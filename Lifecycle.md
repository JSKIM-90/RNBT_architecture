# WEMB 컴포넌트 라이프사이클 문서

## 개요

이 문서는 WEMB 프레임워크의 컴포넌트 및 페이지 라이프사이클을 정리합니다.

---

## 전체 라이프사이클 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Page Loading Flow                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1] API 호출                                                                │
│       │                                                                      │
│       ▼                                                                      │
│  viewerOpenPageById(pageId)                                                  │
│       │                                                                      │
│       ├─ page_info (페이지 메타 정보)                                         │
│       ├─ content_info.two_layer (2D 컴포넌트 목록)                            │
│       ├─ content_info.three_layer (3D 컴포넌트 목록)                          │
│       └─ content_info.master_layer (마스터 컴포넌트 목록)                      │
│                                                                              │
│  [2] 페이지 스크립트: beforeLoad                                              │
│       │                                                                      │
│       ▼                                                                      │
│  [3] 컴포넌트 생성 및 DOM 삽입 (ComponentInstanceFactory)                     │
│       │                                                                      │
│       ├─ 각 컴포넌트: create() → _createElement() → Element 생성             │
│       ├─ 각 컴포넌트: addChildAt() → DOM 삽입                                │
│       └─ 각 컴포넌트: immediateUpdateDisplay() → register 이벤트             │
│                                                                              │
│  [4] 페이지 스크립트: ready                                                   │
│       │                                                                      │
│       ▼                                                                      │
│  [5] 리소스 로딩 (ComponentResourceLoader)                                   │
│       │                                                                      │
│       ▼                                                                      │
│  [6] 각 컴포넌트: completed 이벤트                                            │
│       │                                                                      │
│       ▼                                                                      │
│  [7] 페이지 스크립트: loaded                                                  │
│       │                                                                      │
│       ▼                                                                      │
│  [8] 페이지 전환 시                                                           │
│       ├─ 페이지 스크립트: beforeUnLoad                                        │
│       └─ 페이지 스크립트: unLoaded                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 이벤트 종류

### 페이지 이벤트 (WVPageComponentScriptEvent)

| 이벤트 | 상수 | 시점 | 용도 |
|--------|------|------|------|
| `beforeUnLoad` | `BEFORE_UNLOAD` | 이전 페이지 언로드 전 | 리소스 정리 준비 |
| `unLoaded` | `UNLOADED` | 이전 페이지 언로드 후 | 리소스 정리 완료 |
| `beforeLoad` | `BEFORE_LOAD` | 새 페이지 로드 전 | 이벤트 핸들러 등록 |
| `ready` | `READY` | 컴포넌트 생성 완료 | DOM 접근 가능 (사용 안 함*) |
| `loaded` | `LOADED` | 리소스 로드 완료 | 데이터 발행, API 호출 |

> **`ready` 이벤트 사용 안 함**: `ready`는 모든 컴포넌트 DOM 생성 후 발생하지만, 실제로는 `loaded` 시점에 데이터 발행이 이루어져야 합니다.
> 컴포넌트의 `register`에서 이미 DOM 접근이 가능하고, 구독 등록 및 이벤트 바인딩을 처리합니다.
> 따라서 `ready.js` 템플릿은 제공하지 않으며, 대부분의 경우 `loaded.js`만 사용합니다.

### 컴포넌트 이벤트 (WVComponentScriptEvent)

| 이벤트 | 상수 | 시점 | 용도 |
|--------|------|------|------|
| `register` | `REGISTER` | DOM 삽입 직후 | subscribe 등록, 이벤트 바인딩 |
| `completed` | `COMPLETED` | 리소스 로딩 완료 | 데이터 발행 (common_component) |
| `destroy` | `DESTROY` | 컴포넌트 파괴 시 | 리소스 정리 |

> **참고**: `resourceLoaded` 이벤트는 3D 리소스 컴포넌트(`isResourceComponent = true`)에서만 발생하므로 일반 컴포넌트에는 해당되지 않음

---

## 상세 실행 순서

### Phase 1: 컴포넌트 생성

```
ComponentInstanceFactory.startFactory()
    │
    ├─ 각 컴포넌트에 대해:
    │   │
    │   ├─ [1] comInstance.create(comInstanceInfo)
    │   │       │
    │   │       ├─ super.create()                    [WVDisplayObject.ts:423]
    │   │       │   └─ _createElement(template)
    │   │       │       └─ this._element = $(template)[0]  ★ Element 생성
    │   │       │
    │   │       └─ _completedCreate()                [WVComponent.ts:235]
    │   │           └─ WVEvent.CREATED 발생
    │   │
    │   ├─ [2] onCreated() 콜백
    │   │       └─ $emit(LoadingEvent.CREATE_COMPONENT)
    │   │
    │   ├─ [3] ComponentInstanceLoader 수신
    │   │       └─ loaderPageContainer.addComInstance(comInstance)
    │   │
    │   └─ [4] ViewerPageComponent.addComInstance()
    │           │
    │           ├─ super.addComInstance()
    │           │   └─ layer.addChild(comInstance)
    │           │       └─ addChildAt()
    │           │           └─ $(parentElement).append()  ★ DOM 삽입
    │           │
    │           └─ comInstance.immediateUpdateDisplay()
    │               │
    │               ├─ this.element.innerHTML = htmlCode  ★ innerHTML 설정
    │               │
    │               └─ super.immediateUpdateDisplay()
    │                   └─ dispatchEvent(REGISTER)        ★ register 이벤트
    │
    └─ 모든 컴포넌트 생성 완료
```

### Phase 2: 리소스 로딩 및 완료

```
ComponentResourceLoader.startResourceLoading()
    │
    ├─ 이미지, 폰트 등 리소스 로딩
    │
    └─ COMPLETED_ALL 이벤트 발생
        │
        └─ _completedLoadAllResource()           [PageComponent.ts:484]
            │
            ├─ [1] 각 컴포넌트 completed 이벤트
            │       comInstanceList.forEach((instance) => {
            │           instance.dispatchWScriptEvent(COMPLETED);  ★ completed
            │           instance.onLoadPage();  // 있는 경우
            │       });
            │
            ├─ [2] 페이지 loaded 이벤트
            │       this._pageElementComponent.dispatchLoadedScriptEvent();
            │
            └─ [3] 레이어 표시
                    this._pageElementComponent.showAllLayer();
```

---

## Layer 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Container                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Master Layer (z-index: 30,000 ~ 34,999)                 │    │
│  │ - 공통 UI (헤더, 사이드바, 알림)                          │    │
│  │ - 페이지 전환 시 유지 가능                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Two Layer (z-index: 10,000 ~ 19,999)                    │    │
│  │ - 일반 2D 컴포넌트                                       │    │
│  │ - 페이지별 콘텐츠                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Three Layer                                              │    │
│  │ - 3D 컴포넌트 (Three.js)                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 이벤트 발생 타이밍 다이어그램

```
시간 ────────────────────────────────────────────────────────────────────────►

[beforeLoad]     [register]        [ready]    [completed]     [loaded]
     │               │                │            │              │
     ▼               ▼                ▼            ▼              ▼
┌─────────┐    ┌──────────┐    ┌─────────┐  ┌──────────┐   ┌──────────┐
│ 이벤트   │    │ 각 컴포넌트│    │ 모든    │  │ 각 컴포넌트│   │ 모든     │
│ 핸들러   │    │ DOM 삽입  │    │ 컴포넌트 │  │ 리소스    │   │ 로딩     │
│ 등록     │    │ innerHTML │    │ 생성    │  │ 로드 완료 │   │ 완료     │
│          │    │ 설정      │    │ 완료    │  │           │   │          │
└─────────┘    └──────────┘    └─────────┘  └──────────┘   └──────────┘
                    │                            │
                    │                            │
                    ▼                            ▼
              subscribe 등록              fetchAndPublish 가능
              이벤트 바인딩               데이터 발행 가능
```

---

## 주요 파일 위치

| 역할 | 파일 경로 |
|------|----------|
| 스크립트 실행 엔진 | `packages/common/src/wemb/core/events/WScriptEventWatcher.ts` |
| 이벤트 디스패처 | `packages/common/src/wemb/core/events/WVComponentEventDispatcher.ts` |
| 페이지 이벤트 메서드 | `packages/common/src/wemb/wv/components/page/PageComponentCore.ts` |
| 컴포넌트 팩토리 | `packages/common/src/wemb/wv/managers/ComponentInstanceFactory.ts` |
| 컴포넌트 로더 | `packages/common/src/wemb/wv/managers/ComponentInstanceLoader.ts` |
| 리소스 로더 | `packages/common/src/wemb/wv/helpers/ComponentResourceLoader.ts` |
| Viewer 페이지 | `packages/viewer/src/viewer/controller/viewer/OpenPageCommand.ts` |

---

## 코드 참조

### 페이지 이벤트 정의 (WVComponentEventDispatcher.ts:17-24)

```typescript
export class WVPageComponentScriptEvent {
  public static readonly BEFORE_UNLOAD: string = 'beforeUnLoad';
  public static readonly UNLOADED: string = 'unLoaded';
  public static readonly BEFORE_LOAD: string = 'beforeLoad';
  public static readonly READY: string = 'ready';
  public static readonly LOADED: string = 'loaded';
}
```

### 컴포넌트 이벤트 정의 (WVComponentEventDispatcher.ts:4-15)

```typescript
export class WVComponentScriptEvent {
  public static readonly REGISTER: string = 'register';
  public static readonly DESTROY: string = 'destroy';
  public static readonly CLICK: string = 'click';
  public static readonly DBL_CLICK: string = 'dblClick';
  public static readonly MOUSE_OVER: string = 'mouseOver';
  public static readonly MOUSE_OUT: string = 'mouseOut';
  public static readonly RESOURCE_LOADED: string = 'resourceLoaded';  // 3D 리소스 컴포넌트 전용
  public static readonly COMPLETED: string = 'completed';
}
```

### register 이벤트 발생 (WVComponent.ts:591-593)

```typescript
if (this.isViewerMode) {
  this._componentEventDispatcher.dispatchEvent(WVComponentScriptEvent.REGISTER);
}
```

### completed 이벤트 발생 (PageComponent.ts:498-505)

```typescript
let comInstanceList: Array<WVComponent> = this._pageElementComponent.comInstanceList;
comInstanceList.forEach((instance: WVComponent) => {
  instance.dispatchWScriptEvent(WVComponentScriptEvent.COMPLETED);
  if (instance[WVCOMPONENT_METHOD_INFO.ON_LAOAD_PAGE]) {
    instance[WVCOMPONENT_METHOD_INFO.ON_LAOAD_PAGE]();
  }
});
```

---

## 버전 정보

- 문서 버전: 1.1.0
- 최종 업데이트: 2025-11-28
- 변경사항:
  - v1.1.0: `ready` 이벤트 사용 안 함 명시 (`loaded`로 대체)
