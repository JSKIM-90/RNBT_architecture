# 프로젝트 설계 템플릿

런타임 프레임워크 기반 프로젝트 설계 가이드

---

## 설계 철학

### Primitive Building Blocks 원칙

프레임워크는 최소한의 primitive만 제공하고, 조합은 사용자에게 맡긴다.

**프레임워크가 제공하는 것**:
- `WKit.fetchData(page, datasetName, param)` - 데이터 fetch
- `WKit.getInstanceByName(name, iter)` - 인스턴스 검색
- `GlobalDataPublisher.fetchAndPublish(topic, page)` - 데이터 발행

**사용자가 직접 조합**:
```javascript
const { datasetInfo } = targetInstance;
if (datasetInfo) {
    const { datasetName, param } = datasetInfo;
    const data = await WKit.fetchData(this, datasetName, param);
    // 사용자가 원하는 대로 처리
}
```

### 독립적 작업 단위

각 라이프사이클 단계를 독립적으로 개발:
- 각 단계의 책임이 명확
- 점진적 검증 가능
- 유지보수 용이

### 템플릿 기반 개발

- 빈 구조 + 샘플 하나로 명확한 가이드 제공
- 복사-붙여넣기로 확장 가능
- 5-10분 내 새 컴포넌트/페이지 추가 가능

---

## 페이지 라이프사이클 구현

### page_before_load.js

**역할**: 컴포넌트 생성 전 초기 설정

**핵심 논리**:
> 컴포넌트는 독립적이고, 페이지에서 정의할 이벤트도 사용자 정의입니다.
> 이벤트가 정의될 영역을 빈 구조로 제공하고, 샘플로 패턴을 명시합니다.

**구현 특징**:
- 빈 구조 제공 (`this.eventBusHandlers = {}`)
- 샘플 하나로 패턴 명시
- Primitive 조합 방식 표현
- 선택적 기능은 주석 처리

**코드 예시**:
```javascript
const { onEventBusHandlers, fetchData } = WKit;

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    '@itemClicked': async ({ event, targetInstance }) => {
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            // TODO: 데이터 처리
        }
    },

    // Param 업데이트 패턴
    '@filterChanged': ({ event }) => {
        const filter = event.target.value;
        this.currentParams['myTopic'] = {
            ...this.currentParams['myTopic'],
            filter
        };
        GlobalDataPublisher.fetchAndPublish('myTopic', this, this.currentParams['myTopic']);
    }
};

onEventBusHandlers(this.eventBusHandlers);
```

---

### page_loaded.js

**역할**: 모든 컴포넌트 completed 후 데이터 발행 및 갱신 관리

**핵심 논리**:
> 페이지는 컴포넌트가 공유할 데이터를 속성으로 정의하고,
> 구독자들에게 데이터를 전달합니다.
> 데이터마다 갱신 주기가 다를 수 있으므로 독립적인 interval을 관리합니다.

#### 데이터 매핑 정의

```javascript
this.globalDataMappings = [
    {
        topic: 'topicA',
        datasetInfo: {
            datasetName: 'myapi',
            param: { endpoint: '/api/data-a' }
        },
        refreshInterval: 5000  // 5초 주기
    },
    {
        topic: 'topicB',
        datasetInfo: {
            datasetName: 'myapi',
            param: { endpoint: '/api/data-b' }
        },
        refreshInterval: 30000  // 30초 주기
    }
];
```

**refreshInterval 있으면**: 주기적 갱신
**refreshInterval 없으면**: 한 번만 fetch

#### Param 관리

**문제**: param은 호출 시점마다 달라질 수 있어야 함 (필터, 시간 범위 등)

**해결**: `this.currentParams`로 topic별 param 관리

```javascript
// Initialize param storage
this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),           // 1. Register
    each(({ topic }) => this.currentParams[topic] = {}), // 2. Init params
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this)) // 3. Fetch
);
```

**관리 주체**: 페이지 (데이터셋 정보를 소유하므로)
**관리 구조**: `this.currentParams[topic]`
**사용**: `fetchAndPublish(topic, this, this.currentParams[topic])`

#### Interval 관리

```javascript
this.startAllIntervals = () => {
    this.refreshIntervals = {};

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    GlobalDataPublisher.fetchAndPublish(
                        topic,
                        this,
                        this.currentParams[topic] || {}
                    );
                }, refreshInterval);
            }
        })
    );
};

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

this.startAllIntervals();
```

**핵심**: `currentParams`는 참조이므로 interval 재시작 불필요

---

### page_before_unload.js

**역할**: 페이지 종료 시 모든 리소스 정리

**핵심 논리**:
> 생성된 모든 리소스는 1:1 매칭으로 정리되어야 합니다.

#### 정리 순서

```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);        // 1. Interval 먼저 중단
    clearEventBus.call(this);           // 2. EventBus 정리
    clearDataPublisher.call(this);      // 3. DataPublisher 정리
    clearThree.call(this);              // 4. Three.js 정리 (선택)
}
```

#### 생성/정리 매칭 테이블

| 생성 (before_load / loaded) | 정리 (before_unload) |
|-----------------------------------|---------------------------|
| `this.eventBusHandlers = {...}` | `this.eventBusHandlers = null` |
| `onEventBusHandlers(...)` | `offEventBusHandlers(...)` |
| `this.globalDataMappings = [...]` | `this.globalDataMappings = null` |
| `this.currentParams = {}` | `this.currentParams = null` |
| `this.refreshIntervals = {}` | `this.refreshIntervals = null` |
| `GlobalDataPublisher.registerMapping(...)` | `GlobalDataPublisher.unregisterMapping(...)` |
| `setInterval(...)` | `clearInterval(...)` |

---

## 컴포넌트 라이프사이클 패턴

컴포넌트는 **register**와 **destroy** 두 개의 라이프사이클 단계를 가집니다.

### Register 패턴

#### 패턴 1: 2D 이벤트 바인딩

```javascript
const { bindEvents } = WKit;

this.customEvents = {
    click: {
        '.my-button': '@buttonClicked',
        '.my-link': '@linkClicked'
    }
};

bindEvents(this, this.customEvents);
```

**핵심 포인트**:
- 이벤트 위임 패턴: 동적으로 생성되는 요소도 처리 가능
- `@` 접두사: 커스텀 이벤트 구분
- 컴포넌트 독립성: 컴포넌트는 이벤트 발행만, 처리는 페이지가 담당

#### 패턴 2: GlobalDataPublisher 구독

```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

this.subscriptions = {
    topicA: ['renderTable', 'updateCount'],  // 한 topic에 여러 메서드
    topicB: ['renderList']
};

this.renderTable = renderTable.bind(this);
this.updateCount = updateCount.bind(this);
this.renderList = renderList.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

function renderTable(data) {
    console.log(`[Render Table] ${this.name}`, data);
    // 렌더링 로직
}
```

### Destroy 패턴

```javascript
const { removeCustomEvents } = WKit;
const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// 1. 이벤트 제거
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// 2. 구독 해제
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// 3. 모든 핸들러 참조 제거
this.renderTable = null;
this.updateCount = null;
```

### 생성/정리 매칭 (컴포넌트)

| 생성 (register) | 정리 (destroy) |
|-----------------|----------------|
| `this.customEvents = {...}` | `this.customEvents = null` |
| `bindEvents(this, customEvents)` | `removeCustomEvents(this, customEvents)` |
| `this.subscriptions = {...}` | `this.subscriptions = null` |
| `subscribe(topic, this, handler)` | `unsubscribe(topic, this)` |
| `this.myMethod = myMethod.bind(this)` | `this.myMethod = null` |

---

## 이벤트 위임 패턴

### 왜 이벤트 위임을 사용하는가?

**직접 바인딩의 문제점**:
1. 동적 요소 처리 불가: 나중에 추가된 요소는 이벤트 없음
2. 메모리 낭비: 요소 100개면 리스너 100개
3. 정리 복잡: 요소 제거 시 리스너도 수동으로 제거해야 함

**이벤트 위임의 장점**:
1. 동적 요소 자동 처리: 나중에 추가된 요소도 자동으로 동작
2. 메모리 효율: 요소 100개여도 리스너는 1개
3. 간단한 정리: 부모의 리스너만 제거하면 됨

### 동작 원리

```javascript
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    // Step 1: 버블링 중 매칭되는 요소 찾기
    const target = event.target.closest(selector);

    // Step 2: 요소가 존재하고 컴포넌트 범위 내인지 확인
    if (target && instance.element.contains(target)) {
      // Step 3: 찾은 요소를 this로 하여 핸들러 실행
      return handler.call(target, event);
    }
  };

  // Step 4: 컴포넌트 root에 리스너 등록
  instance.element.addEventListener(eventName, emitEvent);
}
```

### 핵심 정리

| 항목 | 직접 바인딩 | 이벤트 위임 |
|------|------------|------------|
| **리스너 개수** | 요소마다 1개 | 부모에 1개 |
| **동적 요소** | 처리 불가 | 자동 처리 |
| **메모리** | 요소 수만큼 | 항상 1개 |
| **정리** | 각각 제거 필요 | 부모만 제거 |

---

## 고급 패턴

### 동적 Param 변경 패턴

#### 핵심 발견: Stop/Start 불필요!

`currentParams`는 **참조(Reference)**입니다.

```javascript
// Interval 설정 시
setInterval(() => {
    GlobalDataPublisher.fetchAndPublish(
        topic,
        this,
        this.currentParams[topic]  // ← 참조!
    );
}, refreshInterval);
```

#### 패턴

```javascript
'@filterChanged': ({ event }) => {
    const filter = event.target.value;

    // 1. Update currentParams
    this.currentParams['myTopic'] = {
        ...this.currentParams['myTopic'],
        filter
    };

    // 2. Immediate fetch - 사용자가 즉시 새 데이터 봄
    GlobalDataPublisher.fetchAndPublish('myTopic', this, this.currentParams['myTopic']);

    // 3. Interval은 자동으로 업데이트된 param 사용
    // No stop/start needed!
}
```

**장점**:
- 독립적 주기 유지
- 즉시 반영
- 자동 업데이트

### YAGNI 원칙

> "필요할 때 추가하라. 미리 추가하지 마라."

| 기능 | 복잡도 | 실용성 | 권장 |
|------|--------|--------|------|
| Param 변경 | 낮음 | 매우 높음 | 필수 |
| Interval on/off | 낮음 | 높음 | 유용 |
| Interval 주기 변경 | 높음 | 매우 낮음 | 불필요 |

---

## 완전한 라이프사이클 흐름

```
[Page - before_load]
  → 이벤트 핸들러 등록 (onEventBusHandlers)
  → 이벤트 준비 완료

[Component - register]
  → GlobalDataPublisher.subscribe() (구독 등록)
  → 데이터 수신 준비 완료

[Page - loaded]
  → 데이터셋 정의 (globalDataMappings)
  → currentParams 초기화
  → GlobalDataPublisher.registerMapping()
  → 최초 데이터 발행 (fetchAndPublish)
  → Interval 시작 (startAllIntervals)
  → 구독자들에게 데이터 자동 전파

[User Interaction]
  → DOM Event
  → WEventBus.emit()
  → Page EventBus Handler
  → currentParams 업데이트
  → 즉시 fetchAndPublish
  → 다음 interval에서 자동으로 새 param 사용

[Page - before_unload]
  → stopAllIntervals()
  → offEventBusHandlers()
  → unregisterMapping()
  → 모든 참조 제거
```

### 핵심 원칙

1. **페이지 = 오케스트레이터**
   - 데이터 정의 (globalDataMappings)
   - Interval 관리 (refreshIntervals)
   - Param 관리 (currentParams)

2. **컴포넌트 = 독립적 구독자**
   - 필요한 topic만 구독
   - 데이터 렌더링만 집중
   - 페이지의 내부 구조 몰라도 됨

3. **Topic 기반 pub-sub**
   - 중복 fetch 방지
   - 여러 컴포넌트 공유 가능
   - 느슨한 결합

---

## event vs targetInstance

사용자 이벤트 발생 시 두 가지 정보가 제공됩니다:

| 정보 타입 | event.target | targetInstance |
|-----------|--------------|----------------|
| **사용자 입력** | value, textContent | - |
| **DOM 속성** | dataset, classList | - |
| **인스턴스 메타** | - | id, name |
| **데이터셋 정보** | - | datasetInfo |
| **인스턴스 메소드** | - | showDetail(), etc. |

**상호보완적**: 두 가지가 서로 다른 정보를 제공하여 완전한 컨텍스트 구성

---

## 베스트 프랙티스

### DO

```javascript
// 구독 스키마 활용
this.subscriptions = {
    topic1: ['handler1', 'handler2'],
    topic2: ['handler3']
};

// data-attribute 활용
item.dataset.id = data.id;

// Guard clause로 데이터 검증
if (!data) return;

// closest()로 이벤트 타겟 찾기
const item = event.target.closest('.item');
```

### DON'T

```javascript
// 컴포넌트에서 직접 데이터 fetch
const data = await fetch('/api/data');  // 결합도 증가

// 전체 함수를 try-catch로 감싸기
try { /* 전체 로직 */ } catch (e) { }  // 버그 숨김

// 정리 누락
// destroy.js가 없거나 비어있음  // 메모리 누수
```

---

**버전**: 1.0.0
**작성일**: 2025-12-02
