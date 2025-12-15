# Master common_component의 completed가 Page loaded를 대체할 수 있는 근거

## 개요

이 문서는 마스터 페이지 스크립트가 실행되지 않는 현재 상황에서, 마스터 레이어의 `common_component`가 `completed` 이벤트 시점에 데이터 발행(fetchAndPublish)을 수행하여 페이지의 `loaded` 스크립트 역할을 대체할 수 있는 기술적 근거를 설명합니다.

---

## 문제 상황

### 현재 구조의 한계

```
┌─────────────────────────────────────────────────────────────────┐
│                    현재 상태                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Page Layer                        Master Layer                  │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │ page_scripts/    │              │ (page_scripts    │         │
│  │ ├─ beforeLoad ✅ │              │  없음)           │         │
│  │ ├─ ready ✅      │              │                  │         │
│  │ └─ loaded ✅     │              │ 스크립트 실행 ❌  │         │
│  │   (데이터 발행)   │              │                  │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                  │
│  ※ 마스터 레이어의 페이지 스크립트(loaded, ready 등)가           │
│    실행되지 않아 데이터 발행 불가                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 해결 방안

```
┌─────────────────────────────────────────────────────────────────┐
│                    제안 구조                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Master Layer                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                                                           │   │
│  │  common_component              Header        Sidebar      │   │
│  │  (page 역할 대체)              (subscriber)  (subscriber) │   │
│  │  ┌──────────────┐            ┌──────────┐  ┌──────────┐  │   │
│  │  │ register:    │            │ register:│  │ register:│  │   │
│  │  │  준비        │            │ subscribe│  │ subscribe│  │   │
│  │  ├──────────────┤            └──────────┘  └──────────┘  │   │
│  │  │ completed:   │                  ▲            ▲        │   │
│  │  │ fetchAnd     │──────────────────┴────────────┘        │   │
│  │  │ Publish()    │  publish (page loaded 대체)            │   │
│  │  └──────────────┘                                        │   │
│  │                                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 대체 가능 근거

### 근거 1: 이벤트 실행 순서 보장

#### Page loaded의 실행 시점

```typescript
// PageComponent.ts:484-509
private _completedLoadAllResource() {
  // 1. 모든 컴포넌트에 completed 이벤트 발생
  comInstanceList.forEach((instance: WVComponent) => {
    instance.dispatchWScriptEvent(WVComponentScriptEvent.COMPLETED);
  });

  // 2. 페이지 loaded 이벤트 발생
  this._pageElementComponent.dispatchLoadedScriptEvent();
}
```

#### 실행 순서

```
[모든 컴포넌트 register 완료]
         │
         ▼
[리소스 로딩]
         │
         ▼
[모든 컴포넌트 completed] ◄─── common_component의 completed 여기서 실행
         │
         ▼
[페이지 loaded]           ◄─── 원래 데이터 발행 시점
```

**핵심**: `completed`는 `loaded` 직전에 실행되므로, 동일한 시점에서 데이터 발행 가능

---

### 근거 2: subscribe 등록 시점 보장

#### 다른 컴포넌트들의 subscribe 등록

```javascript
// Header/register.js
subscribe('userInfo', this, this.renderUserInfo);
```

#### 실행 순서 상세

```
시간 ──────────────────────────────────────────────────────────────────►

Phase 1: Register (모든 컴포넌트)
┌────────────────────────────────────────────────────────────────────┐
│ common_component: register                                          │
│ Header:           register + subscribe('userInfo', ...) ✅          │
│ Sidebar:          register + subscribe('notifications', ...) ✅     │
│                                                                     │
│ ※ 모든 subscribe 등록 완료                                          │
└────────────────────────────────────────────────────────────────────┘
         │
         ▼
Phase 2: Resource Loading
         │
         ▼
Phase 3: Completed (순차 실행)
┌────────────────────────────────────────────────────────────────────┐
│ common_component: completed → fetchAndPublish('userInfo', ...)     │
│                               fetchAndPublish('notifications', ...)│
│                                      │                             │
│                                      ▼                             │
│ Header:   handler 호출 → renderUserInfo(data) ✅                    │
│ Sidebar:  handler 호출 → renderNotifications(data) ✅               │
└────────────────────────────────────────────────────────────────────┘
```

**핵심**: 모든 `register`가 완료된 후에 `completed`가 실행되므로, subscribe 등록이 보장됨

---

### 근거 3: DOM 접근 가능성

#### Element 삽입 시점

```typescript
// WVDisplayObjectContainer.ts:174
$(parentElement).append(component.appendElement);  // DOM 삽입

// WVDOMComponent.ts:140 (immediateUpdateDisplay 내부)
this.element.innerHTML = processedHTML;  // innerHTML 설정
```

#### 시점 비교

| 시점 | DOM 상태 | innerHTML 상태 |
|------|----------|---------------|
| register | ✅ 삽입됨 | ✅ 설정됨 |
| completed | ✅ 존재 | ✅ 존재 |
| loaded | ✅ 존재 | ✅ 존재 |

**핵심**: `completed` 시점에 이미 DOM이 완전히 준비되어 있음

---

### 근거 4: GlobalDataPublisher 동작 원리

#### Pub-Sub 패턴

```javascript
// 1. Subscriber 등록 (register 시점)
GlobalDataPublisher.subscribe('userInfo', this, this.renderUserInfo);

// 2. Publisher 발행 (completed 시점)
GlobalDataPublisher.fetchAndPublish('userInfo', this.page);

// 3. 모든 subscriber의 handler 호출
// → renderUserInfo(response) 자동 호출
```

#### 데이터 흐름

```
┌────────────────┐     ┌─────────────────────┐     ┌────────────────┐
│ common_        │     │ GlobalDataPublisher │     │ Header/        │
│ component      │     │                     │     │ Sidebar        │
├────────────────┤     ├─────────────────────┤     ├────────────────┤
│                │     │                     │     │                │
│ [completed]    │     │                     │◄────┤ [register]     │
│                │     │ subscribers: [...]  │     │ subscribe()    │
│ fetchAnd       ├────►│                     │     │                │
│ Publish()      │     │ fetch → publish ────┼────►│ handler()      │
│                │     │                     │     │ DOM 업데이트   │
└────────────────┘     └─────────────────────┘     └────────────────┘
```

**핵심**: `fetchAndPublish` 호출 시점에 등록된 모든 subscriber에게 데이터 전달

---

### 근거 5: Subscriber 컴포넌트의 completed 미실행 상태에서도 DOM 접근 가능

#### 시나리오

```
common_component: completed → fetchAndPublish()
                                    │
                                    ▼
Header: register 완료, completed 아직 미실행 상태에서 handler 호출
        └─ DOM 조작 가능한가? ✅ 가능!
```

#### 코드 기반 검증

**completed는 forEach로 순차 실행됨:**

```typescript
// PageComponent.ts:499-505
comInstanceList.forEach((instance: WVComponent) => {
  instance.dispatchWScriptEvent(WVComponentScriptEvent.COMPLETED);
});
```

**register 시점에 이미 완료되는 작업들:**

| 작업 | 코드 위치 | 완료 시점 |
|------|----------|----------|
| DOM 삽입 | `WVDisplayObjectContainer.ts:174` - `$(parentElement).append()` | register 전 |
| innerHTML 설정 | `WVDOMComponent.ts:140` - `this.element.innerHTML = htmlCode` | register 시점 |
| subscribe 등록 | 컴포넌트 register.js | register 시점 |

#### common_component의 completed 시점에서 다른 컴포넌트 상태

| 항목 | Header/Sidebar 상태 |
|------|---------------------|
| DOM 존재 | ✅ register에서 이미 삽입됨 |
| innerHTML (htmlCode) | ✅ register에서 이미 설정됨 |
| subscribe | ✅ register에서 이미 등록됨 |
| completed | ❌ 아직 실행 안 됨 (순서에 따라) |

**핵심**: completed가 실행되지 않았더라도, register 시점에 DOM과 innerHTML이 이미 준비되어 있으므로 subscribe handler에서 DOM 조작이 가능함

#### ⚠️ 중요: completed 실행 순서는 무관함

```typescript
// forEach로 순차 실행되지만, 순서에 의존하면 안 됨
comInstanceList.forEach((instance: WVComponent) => {
  instance.dispatchWScriptEvent(WVComponentScriptEvent.COMPLETED);
});
```

**실행 순서가 무관한 이유**:
1. **subscribe는 register에서 완료**: completed 전에 모든 컴포넌트의 subscribe가 등록됨
2. **DOM은 register에서 준비**: completed 전에 모든 DOM이 삽입되고 innerHTML이 설정됨
3. **fetchAndPublish는 동기적 발행이 아님**: fetch 완료 후 모든 subscriber에게 전달

**따라서**:
- common_component가 먼저 completed되어 fetchAndPublish를 호출해도
- Header/Sidebar의 subscribe handler가 정상 호출됨 (register에서 이미 등록됨)
- 순서에 의존하는 로직을 작성하지 말 것

---

### 근거 6: 마스터 레이어의 3D 리소스 안전성

#### 3D 리소스 로딩 메커니즘

**isResourceComponent 플래그:**

```typescript
// WV3DResourceComponent.ts:22
this._isResourceComponent = true;  // 3D 리소스 컴포넌트만 true
```

**리소스 로더는 isResourceComponent만 대기:**

```typescript
// ComponentResourceLoader.ts:76-80
comInstanceList.forEach((instance: WVComponent) => {
  if (instance.isResourceComponent) {  // 3D 리소스 컴포넌트만
    this._comInstanceList.push(instance);
  }
});
```

#### 마스터 레이어는 2D 전용

```typescript
// ViewerPageComponent.ts:36, 246
private _masterLayer: ViewerTwoLayer;  // 2D 레이어

// EditorPageComponent.ts:60, 237
private _masterLayer: EditTwoLayer;    // 2D 레이어
```

#### Layer 구조 및 3D 배치

```
┌─────────────────────────────────────────────────────────────────┐
│ Master Layer (ViewerTwoLayer / EditTwoLayer)                    │
│ └─ 2D 컴포넌트만 배치 (헤더, 사이드바, 알림 등)                   │
│ └─ isResourceComponent = false                                  │
│ └─ 리소스 로딩 대기 불필요 ✅                                     │
├─────────────────────────────────────────────────────────────────┤
│ Two Layer (ViewerTwoLayer / EditTwoLayer)                       │
│ └─ 2D 컴포넌트                                                  │
│ └─ isResourceComponent = false                                  │
├─────────────────────────────────────────────────────────────────┤
│ Three Layer                                                     │
│ └─ 3D 컴포넌트 (WV3DResourceComponent 등)                       │
│ └─ isResourceComponent = true                                   │
│ └─ 리소스 로딩 대기 필요 ⚠️                                       │
└─────────────────────────────────────────────────────────────────┘
```

#### 잠재적 문제 시나리오 (Page Layer + 3D의 경우)

```
만약 Page Layer에서 3D 데이터를 다룬다면:

common_component: completed → fetchAndPublish('3d-model-data')
                                    │
                                    ▼
3D Component: 아직 모델 로딩 중... → handler 호출됨
              └─ 3D 모델이 없어서 렌더링 불가 ❌
```

#### 마스터 레이어에서는 안전

```
Master Layer (2D 전용):
┌─────────────────────────────────────────────────────────────────┐
│ common_component: completed → fetchAndPublish('userInfo')       │
│                                    │                            │
│                                    ▼                            │
│ Header (2D): handler 호출 → DOM 조작 ✅                          │
│ Sidebar (2D): handler 호출 → DOM 조작 ✅                         │
│                                                                  │
│ ※ 3D 컴포넌트가 없으므로 리소스 로딩 문제 없음                    │
└─────────────────────────────────────────────────────────────────┘
```

#### 레이어별 안전성 비교

| 레이어 | 3D 컴포넌트 | 리소스 로딩 필요 | 패턴 사용 가능 |
|--------|------------|-----------------|---------------|
| Master Layer | ❌ 없음 | ❌ 불필요 | ✅ 안전 |
| Two Layer | ❌ 없음 | ❌ 불필요 | ✅ 안전 |
| Three Layer | ✅ 있음 | ✅ 필요 | ⚠️ 주의 필요 |

**핵심**: 마스터 레이어는 `ViewerTwoLayer`/`EditTwoLayer`로 2D 전용이며, 3D 리소스 컴포넌트가 배치되지 않으므로 리소스 로딩 완료 여부와 무관하게 DOM 기반 작업이 안전함

---

## Page loaded vs common_component completed 비교

### 기능적 동등성

| 기능 | Page loaded | common_component completed |
|------|-------------|---------------------------|
| 실행 시점 | 리소스 로딩 완료 후 | 리소스 로딩 완료 후 (직전) |
| DOM 접근 | ✅ 가능 | ✅ 가능 |
| 모든 컴포넌트 생성 완료 | ✅ 보장 | ✅ 보장 |
| subscribe 등록 완료 | ✅ 보장 | ✅ 보장 |
| fetchAndPublish 가능 | ✅ | ✅ |
| registerMapping 가능 | ✅ | ✅ |

### 코드 비교

```javascript
// === Page loaded (기존 방식) ===
// page_scripts/loaded.js
GlobalDataPublisher.registerMapping({ topic: 'stats', datasetInfo });
GlobalDataPublisher.fetchAndPublish('stats', this);  // this = page

// === common_component completed (대체 방식) ===
// common_component/completed.js (또는 register.js에서 completed 핸들러)
GlobalDataPublisher.registerMapping({ topic: 'userInfo', datasetInfo });
GlobalDataPublisher.fetchAndPublish('userInfo', this.page);  // this.page = master's page
```

### 주요 차이점

| 항목 | Page loaded | common_component completed |
|------|-------------|---------------------------|
| `this` 참조 | page 인스턴스 | 컴포넌트 인스턴스 |
| page 접근 | `this` | `this.page` |
| 실행 순서 | completed 다음 | loaded 직전 |

---

## 구현 예시

### common_component 구조

```
common_component/
├── register.js      # subscribe 등록, 이벤트 핸들러 등록
├── completed.js     # fetchAndPublish (page loaded 대체)
└── destroy.js       # 리소스 정리
```

### register.js

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents, onEventBusHandlers } = WKit;

// 이벤트 핸들러 등록 (page beforeLoad 역할)
onEventBusHandlers(this, this.eventBusHandlers);

// registerMapping (page loaded에서 하던 것)
GlobalDataPublisher.registerMapping({
  topic: 'userInfo',
  datasetInfo: { /* ... */ }
});

GlobalDataPublisher.registerMapping({
  topic: 'notifications',
  datasetInfo: { /* ... */ }
});
```

### completed.js

```javascript
const { fetchAndPublish } = GlobalDataPublisher;

// 데이터 발행 (page loaded 역할 대체)
fetchAndPublish('userInfo', this.page);
fetchAndPublish('notifications', this.page);

// Auto-refresh 시작 (필요시)
this.refreshInterval = setInterval(() => {
  fetchAndPublish('notifications', this.page);
}, 30000);
```

### destroy.js

```javascript
const { unregisterMapping } = GlobalDataPublisher;
const { offEventBusHandlers } = WKit;

// Interval 정리
if (this.refreshInterval) {
  clearInterval(this.refreshInterval);
  this.refreshInterval = null;
}

// 매핑 해제
unregisterMapping('userInfo');
unregisterMapping('notifications');

// 이벤트 핸들러 해제
offEventBusHandlers(this, this.eventBusHandlers);
```

---

## 검증 체크리스트

### 동작 검증

- [ ] common_component의 completed 시점에 fetchAndPublish 호출 확인
- [ ] 다른 마스터 컴포넌트들이 데이터를 정상 수신하는지 확인
- [ ] 수신한 데이터로 DOM 업데이트가 정상 동작하는지 확인
- [ ] 화면에 렌더링이 정상적으로 보이는지 확인

### 순서 검증

- [ ] 모든 컴포넌트의 register가 completed 전에 완료되는지 확인
- [ ] subscribe 등록이 fetchAndPublish 전에 완료되는지 확인

### 정리 검증

- [ ] destroy 시점에 모든 리소스가 정상 정리되는지 확인
- [ ] 메모리 누수가 없는지 확인

---

## 결론

### 대체 가능 이유 요약

1. **실행 순서 보장**: `completed`는 모든 `register` 완료 후, `loaded` 직전에 실행
2. **subscribe 등록 보장**: `register`에서 등록한 subscribe가 `completed` 시점에 모두 활성화
3. **DOM 접근 가능**: `completed` 시점에 모든 DOM이 준비 완료
4. **동일한 API 사용**: `GlobalDataPublisher.fetchAndPublish()` 동일하게 사용 가능
5. **completed 미실행 컴포넌트도 DOM 접근 가능**: register 시점에 DOM과 innerHTML이 이미 설정됨
6. **마스터 레이어 3D 안전성**: 마스터 레이어는 2D 전용이므로 리소스 로딩 문제 없음

### 주의사항

- `this` 대신 `this.page`로 페이지 참조 필요
- 리소스 정리는 `destroy`에서 반드시 수행
- 3D 컴포넌트가 포함된 레이어에서는 이 패턴 사용 시 주의 필요

---

## 버전 정보

- 문서 버전: 1.2.0
- 최종 업데이트: 2025-11-28
- 변경사항:
  - v1.2.0: completed 실행 순서 무관함 명시 (근거 5에 추가)
  - v1.1.0: 초기 버전
