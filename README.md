# 런타임 프레임워크 아키텍처

브라우저 런타임에서 자바스크립트 코드를 동적으로 실행하여 웹 페이지를 제작하는 **비주얼 웹 빌더 애플리케이션**의 런타임 프레임워크입니다.

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │    Master Layer     │    │          Page Layer             │ │
│  │  (공통 UI, 헤더,    │    │  (페이지별 콘텐츠, 대시보드,   │ │
│  │   사이드바, 알림)    │    │   차트, 데이터 테이블)         │ │
│  │                     │    │                                 │ │
│  │  common_component   │    │  page_scripts/                  │ │
│  │  └─ register.js     │    │  ├─ before_load.js              │ │
│  │  └─ destroy.js      │    │  ├─ loaded.js                   │ │
│  │                     │    │  └─ before_unload.js            │ │
│  │  components/        │    │                                 │ │
│  │  ├─ Header/         │    │  components/                    │ │
│  │  └─ Sidebar/        │    │  ├─ DataPanel/                  │ │
│  │                     │    │  └─ Chart/                      │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│            │                              │                      │
│            └──────────────┬───────────────┘                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Framework Layer                          │ │
│  │  ┌───────────┐  ┌──────────────────┐  ┌─────────────────┐  │ │
│  │  │  WKit.js  │  │ GlobalDataPublisher │  │ WEventBus.js │  │ │
│  │  │ (Facade)  │  │   (Data Layer)     │  │  (Pub-Sub)   │  │ │
│  │  └───────────┘  └──────────────────┘  └─────────────────┘  │ │
│  │                      ┌─────────┐                            │ │
│  │                      │  fx.js  │                            │ │
│  │                      │  (FP)   │                            │ │
│  │                      └─────────┘                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 레이어 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     User Script Layer                   │
│  (Component register/destroy, Page lifecycle scripts)   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                   Framework Layer                        │
├──────────────────────────────────────────────────────────┤
│  WKit.js (Facade)                                        │
│  ├─ Data Mapping Pipeline                               │
│  ├─ 2D Event Binding (delegate pattern)                 │
│  ├─ 3D Event Binding (raycasting)                       │
│  └─ Resource Management                                 │
├──────────────────────────────────────────────────────────┤
│  WEventBus.js (Pub-Sub)                                  │
│  └─ Component Communication                             │
├──────────────────────────────────────────────────────────┤
│  GlobalDataPublisher.js (Data Layer)                     │
│  └─ Topic-based Data Sharing                            │
├──────────────────────────────────────────────────────────┤
│  fx.js (FP Utilities)                                    │
│  └─ Functional Programming Toolkit                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                   Runtime Layer                          │
│  (Browser APIs, Three.js, DOM, Data Service)            │
└─────────────────────────────────────────────────────────┘
```

---

## 핵심 모듈 (Utils/)

### fx.js - 함수형 프로그래밍 라이브러리

**패턴**: Functional Programming (FP)

**주요 기능**:
- `curry`, `pipe`, `go`, `reduce`, `map`, `filter` 등 FP 유틸리티
- Lazy Evaluation (`L` 네임스페이스)
- Promise 기반 비동기 처리
- 동시성 처리 (`C` 네임스페이스 - catchNoop)

```javascript
// 파이프라인 기반 데이터 처리
fx.go(
    data,
    fx.map(transform),
    fx.filter(predicate),
    fx.take(10)
);

// Lazy Evaluation (메모리 효율적)
fx.go(
    largeArray,
    fx.L.map(expensiveOperation),  // Lazy
    fx.L.filter(predicate),        // Lazy
    fx.take(10)                    // 10개만 평가
);
```

### WEventBus.js - 이벤트 버스

**패턴**: Pub-Sub (Publisher-Subscriber)

**주요 기능**:
- `on`, `off`, `emit`, `once`
- 컴포넌트 간 느슨한 결합 제공
- 커스텀 이벤트 전파

```javascript
// 이벤트 발행
WEventBus.emit('@myClickEvent', { event, targetInstance });

// 이벤트 구독
WEventBus.on('@myClickEvent', handler);
```

### GlobalDataPublisher.js - 글로벌 데이터 발행 시스템

**패턴**: Topic-based Pub-Sub + Data Layer

**주요 기능**:
- Topic 기반 데이터 매핑 등록 (`registerMapping`)
- 데이터 fetch 후 구독자에게 자동 전파 (`fetchAndPublish`)
- 동적 param 업데이트 지원 (param 병합)
- 구독 관리 (`subscribe`, `unsubscribe`)
- 페이지 레벨 공유 데이터 관리
- 데이터셋별 독립적인 auto-refresh 주기 설정 가능

```javascript
// 1. 매핑 등록
GlobalDataPublisher.registerMapping({
    topic: 'users',
    datasetInfo: { datasetName: 'dummyjson', param: {...} }
});

// 2. 데이터 fetch & 발행
GlobalDataPublisher.fetchAndPublish('users', page);

// 3. 컴포넌트 구독
GlobalDataPublisher.subscribe('users', instance, handler);
```

### WKit.js - 통합 유틸리티 킷

**패턴**: Facade + Utility + Resource Management

#### 2D 이벤트 바인딩
- 이벤트 위임 패턴 (`bindEvents`, `delegate`)
- 동적 DOM 이벤트 처리

```javascript
WKit.bindEvents(instance, {
    click: {
        '.navbar-brand': '@triggerNavbarTitle',
        '.nav-link': '@triggerNavLink'
    }
});
```

#### 3D 이벤트 바인딩
- Three.js Raycasting 기반 (`bind3DEvents`, `initThreeRaycasting`)
- 3D 객체 클릭 이벤트 처리
- **단일 Canvas 아키텍처**: 모든 3D 컴포넌트가 하나의 Scene 공유
- **컴포넌트 식별**: appendElement.eventListener로 컴포넌트 구분

#### 리소스 관리
- 3D 객체 메모리 해제 (`dispose3DTree`)
- Geometry, Material, Texture 자동 dispose

#### 헬퍼 함수
- Iterator 생성 (`makeIterator`)
- 인스턴스 검색 (`getInstanceByName`, `getInstanceById`)
- 데이터 fetch (`fetchData`)
- 이벤트 발행 (`emitEvent`)
- 제어 흐름 추상화 (`withSelector`)

---

## 핵심 설계 패턴

### 1. 함수형 프로그래밍 (FP)

파이프라인 기반 데이터 처리로 코드의 가독성과 재사용성 향상

```javascript
fx.go(
    Object.entries(instance.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => subscribe(topic, instance, instance[fn]), fnList)
    )
);
```

### 2. 이벤트 기반 아키텍처

컴포넌트 간 느슨한 결합으로 확장성과 유지보수성 확보

```javascript
// 발행자
WEventBus.emit('@myClickEvent', { event, targetInstance });

// 구독자
WEventBus.on('@myClickEvent', async ({ event, targetInstance }) => {
    const { datasetInfo } = targetInstance;
    if (datasetInfo) {
        const { datasetName, param } = datasetInfo;
        const data = await WKit.fetchData(page, datasetName, param);
        // 처리 로직
    }
});
```

### 3. 이벤트 위임 패턴

동적으로 생성되는 DOM 요소에 대한 효율적인 이벤트 처리

```javascript
function delegate(instance, eventName, selector, handler) {
    const emitEvent = (event) => {
        const target = event.target.closest(selector);
        if (target && instance.element.contains(target)) {
            return handler.call(target, event);
        }
    };
    instance.element.addEventListener(eventName, emitEvent);
}
```

### 4. Topic 기반 데이터 매핑

중앙 집중식 데이터 관리로 컴포넌트 간 데이터 공유 효율화

```javascript
// 페이지에서 등록
GlobalDataPublisher.registerMapping({ topic: 'users', datasetInfo });
GlobalDataPublisher.fetchAndPublish('users', page);

// 컴포넌트에서 구독
GlobalDataPublisher.subscribe('users', this, this.renderTable);
```

---

## 라이프사이클 패턴

### Page Layer 라이프사이클

```
┌─────────────────────────────────────────────────────────────────┐
│                     Page Layer Timeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [before_load]                                                   │
│       │                                                          │
│       ├─ 이벤트 핸들러 등록 (onEventBusHandlers)                  │
│       ├─ 3D Raycasting 초기화 (선택적)                            │
│       │                                                          │
│       ▼                                                          │
│  [Component register] ──────────────────┐                        │
│       │                                 │                        │
│       ├─ 구독 등록 (subscribe)           │  여러 컴포넌트         │
│       ├─ 이벤트 바인딩 (bindEvents)       │  병렬 실행            │
│       │                                 │                        │
│       ▼                                 │                        │
│  [Component completed] ─────────────────┘                        │
│       │                                                          │
│       ▼                                                          │
│  [loaded]                                                        │
│       │                                                          │
│       ├─ 데이터 매핑 등록 (registerMapping)                       │
│       ├─ 데이터 발행 (fetchAndPublish)                           │
│       ├─ Auto-refresh 시작 (setInterval)                         │
│       │                                                          │
│       ▼                                                          │
│  [User Interaction] ←──────────────────────────┐                 │
│       │                                        │                 │
│       ├─ DOM Event → delegate()                │                 │
│       ├─ WEventBus.emit()                      │                 │
│       ├─ Page EventBus Handler 실행             │  반복           │
│       │                                        │                 │
│       └────────────────────────────────────────┘                 │
│                                                                  │
│  [before_unload]                                                 │
│       │                                                          │
│       ├─ Interval 정리 (clearInterval)                           │
│       ├─ EventBus 정리 (offEventBusHandlers)                     │
│       ├─ DataPublisher 정리 (unregisterMapping)                  │
│       └─ 3D 리소스 정리 (dispose3DTree)                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 컴포넌트 라이프사이클

- `register` → `completed` → `destroy`

### 페이지 라이프사이클

- `before_load` → `loaded` → `before_unload`

### 각 단계의 역할

| 단계 | 역할 | 주요 작업 |
|------|------|----------|
| **before_load** | 이벤트 준비 | `onEventBusHandlers()`, `initThreeRaycasting()` |
| **Component register** | 구독 및 바인딩 | `subscribe()`, `bindEvents()` |
| **loaded** | 데이터 발행 | `registerMapping()`, `fetchAndPublish()`, `setInterval()` |
| **before_unload** | 리소스 정리 | 모든 생성 리소스 1:1 정리 |

---

## Master Layer 처리 패턴

### Master의 특수성

Master 레이어에는 **page_scripts가 없습니다**. 대신 `common_component`가 페이지 스크립트의 역할을 대체합니다.

### common_component 패턴

```
┌─────────────────────────────────────────────────────────────────┐
│                    Master Layer Structure                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  common_component/              ← Page의 page_scripts/ 역할      │
│  ├─ register.js                                                  │
│  │   ├─ onEventBusHandlers()                                     │
│  │   ├─ registerMapping()                                        │
│  │   └─ fetchAndPublish(topic, this.page)  ← 핵심!              │
│  │                                                               │
│  └─ destroy.js                                                   │
│      ├─ offEventBusHandlers()                                    │
│      └─ unregisterMapping()                                      │
│                                                                  │
│  components/                                                     │
│  ├─ Header/                                                      │
│  │   ├─ register.js  → subscribe('userInfo', ...)               │
│  │   └─ destroy.js   → unsubscribe('userInfo', this)            │
│  │                                                               │
│  └─ Sidebar/                                                     │
│      ├─ register.js  → subscribe('notifications', ...)          │
│      └─ destroy.js   → unsubscribe('notifications', this)       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 핵심 차이: this vs this.page

```javascript
// Page Layer (page_scripts/loaded.js)
GlobalDataPublisher.fetchAndPublish('stats', this);  // this = page

// Master Layer (common_component/register.js)
GlobalDataPublisher.fetchAndPublish('userInfo', this.page);  // this.page = master's page
```

**왜 `this.page`인가?**
- `common_component`는 컴포넌트이므로 `this`는 컴포넌트 인스턴스
- `fetchAndPublish`의 두 번째 인자는 page 참조가 필요
- Master 레이어의 page 참조는 `this.page`로 접근

---

## 데이터 흐름 패턴

### Topic 기반 Pub-Sub

```
┌────────────────┐     ┌─────────────────────┐     ┌────────────────┐
│ Page/Master    │     │ GlobalDataPublisher │     │  Components    │
│ (Publisher)    │     │                     │     │ (Subscribers)  │
├────────────────┤     ├─────────────────────┤     ├────────────────┤
│                │     │                     │     │                │
│ registerMapping├────►│ topic: 'stats'      │     │                │
│                │     │ datasetInfo: {...}  │     │                │
│                │     │                     │     │                │
│                │     │                     │◄────┤ subscribe()    │
│                │     │ subscribers: [...]  │     │                │
│                │     │                     │     │                │
│ fetchAndPublish├────►│ fetch → publish ────┼────►│ handler()      │
│                │     │                     │     │ renderData()   │
│                │     │                     │     │                │
└────────────────┘     └─────────────────────┘     └────────────────┘
```

### 전체 데이터 흐름

```
[Page - before_load]
  → 이벤트 핸들러 등록 (onEventBusHandlers)
  → Raycasting 초기화 (initThreeRaycasting)

[Component - register]
  → GlobalDataPublisher.subscribe() (구독 등록)
  → 이벤트 바인딩 (bindEvents, bind3DEvents)

[Page - loaded] (모든 컴포넌트 completed 후)
  → GlobalDataPublisher.registerMapping()
  → GlobalDataPublisher.fetchAndPublish()
  → 구독자들에게 데이터 자동 전파

[User Interaction]
  → DOM Event
  → delegate() → WEventBus.emit()
  → Page EventBus Handler
  → WKit.fetchData() → 데이터 처리 (primitive 조합)
```

### 실행 순서

```
1. [Page loaded] registerMapping({ topic: 'stats', datasetInfo })
2. [Component register] subscribe('stats', this, this.renderStats)
3. [Page loaded] fetchAndPublish('stats', this)
4. [GlobalDataPublisher] fetch data from API
5. [GlobalDataPublisher] publish to all subscribers
6. [Component] renderStats(data) 자동 호출
```

---

## 런타임 스캐폴드 패턴

### Component Script 패턴

#### 2D 컴포넌트 등록 (이벤트 바인딩)

```javascript
const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    this.customEvents = getCustomEvents.call(this);
    this.myMethod = myMethod.bind(this);
    bindEvents(this, this.customEvents);
}

function getCustomEvents() {
    return {
        click: {
            [`selector`]: '@myEvent'
        }
    };
}

function myMethod(data) {
    console.log(`[myMethod] ${this.name}`, data);
}
```

#### 공통 구독 컴포넌트 (2D/3D)

**특징**: 한 topic에 여러 핸들러 등록 가능

```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// Subscription schema (배열로 여러 핸들러 등록 가능)
this.subscriptions = {
    users: ['renderUserTable', 'updateUserCount'],
    products: ['renderProductList']
};

// Handler functions (bind to this)
this.renderUserTable = renderUserTable.bind(this);
this.updateUserCount = updateUserCount.bind(this);
this.renderProductList = renderProductList.bind(this);

// Subscribe to topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

function renderUserTable(data) {
    console.log(`[Render Table] ${this.name}`, data);
}

function updateUserCount(data) {
    console.log(`[Update Count] ${this.name}`, data.length);
}
```

#### 3D 컴포넌트 (이벤트 바인딩)

```javascript
const { bind3DEvents } = WKit;

// Event schema
this.customEvents = {
    click: '@3dObjectClicked'
};

// Data source info (optional)
this.datasetInfo = {
    datasetName: 'myDataset',
    param: {
        type: 'geometry',
        id: this.id
    }
};

// Bind 3D events
bind3DEvents(this, this.customEvents);
```

#### 컴포넌트 Destroy

**이벤트 제거**:
```javascript
const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    removeCustomEvents(this, this.customEvents);
}
```

**구독 해제 포함**:
```javascript
const { unsubscribe } = GlobalDataPublisher;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    clearSubscribe(this);
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        fx.each(([topic, _]) => unsubscribe(topic, instance))
    );
}
```

### Page Script 패턴

#### before_load

**용도**: 컴포넌트 생성 전 초기 설정 (이벤트 핸들러, Raycasting)

```javascript
const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    '@buttonClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Button clicked:', event, targetInstance);
    },

    '@3dObjectClicked': async ({ event, targetInstance }) => {
        const { datasetInfo } = targetInstance;

        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            console.log('[Page] 3D Object clicked - Data:', data);
        }
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// Setup Three.js raycasting (for 3D events)
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
```

#### loaded

**용도**: 모든 컴포넌트 completed 후 데이터 발행

```javascript
const { each } = fx;

// Define global data mappings
this.globalDataMappings = [
    {
        topic: 'users',
        datasetInfo: {
            datasetName: 'myapi',
            param: { dataType: 'users', limit: 20 }
        }
    },
    {
        topic: 'products',
        datasetInfo: {
            datasetName: 'myapi',
            param: { dataType: 'products', category: 'all' }
        }
    }
];

// Register and fetch data for all topics
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// Advanced: Dynamic param updates
// fetchAndPublish(topic, this, { limit: 50 });  // Merges with registered param
```

#### before_unload

```javascript
const { go, map } = fx;
const { makeIterator, dispose3DTree, clearSceneBackground, offEventBusHandlers } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearThreeInstances.call(this);
}

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}

function clearDataPublisher() {
    go(
        this.globalDataMappings,
        map(({ topic }) => topic),
        each(GlobalDataPublisher.unregisterMapping)
    );
}

function clearThreeInstances() {
    const { scene } = wemb.threeElements;
    go(
        makeIterator(this, 'threeLayer'),
        map(({ appendElement }) => dispose3DTree(appendElement))
    );

    clearSceneBackground(scene);
    this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
    this.raycastingEventHandler = null;
}
```

---

## 컴포넌트 패턴

### 표준 컴포넌트 구조

```javascript
// register.js
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// 1. 구독 스키마
this.subscriptions = {
    topicName: ['renderMethod']
};

// 2. 메서드 바인딩
this.renderMethod = renderMethod.bind(this);

// 3. 구독 등록
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// 4. 이벤트 바인딩 (선택적)
this.customEvents = {
    click: { '.my-button': '@buttonClicked' }
};
bindEvents(this, this.customEvents);

// 5. 렌더 함수 (Guard Clause 패턴)
function renderMethod(response) {
    const { data } = response;
    if (!data) return;  // Guard clause

    // 렌더링 로직...
}
```

### destroy.js 패턴

```javascript
// destroy.js
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// 1. 구독 해제
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// 2. 이벤트 제거 (선택적)
removeCustomEvents(this, this.customEvents);

// 3. 참조 정리
this.subscriptions = null;
this.customEvents = null;
this.renderMethod = null;
```

---

## 설계 철학

### Primitive Building Blocks 원칙

**프레임워크는 최소한의 primitive만 제공하고, 조합은 사용자에게 맡긴다**

#### 철학
- ✅ **DO**: 범용적이고 재사용 가능한 primitive 제공
  - `WKit.fetchData(page, datasetName, param)` - 데이터 fetch
  - `WKit.getInstanceByName(name, iter)` - 인스턴스 검색
  - `WKit.makeIterator(page, ...layers)` - iterator 생성

- ❌ **DON'T**: 특정 비즈니스 로직을 조합한 고수준 함수 제공

#### 장점
- 코드 흐름이 명확해짐
- 사용자가 필요한 만큼만 사용
- 디버깅 용이
- 프레임워크 API 표면 최소화

### Higher-Order Function으로 제어 흐름 추상화

**`if` 문을 함수로 감싸서 재사용 가능한 패턴으로 만든다**

```javascript
// WKit에서 제공하는 HOF
const withSelector = (element, selector, fn) => {
    const target = element.querySelector(selector);
    return target ? fn(target) : null;
};

// 선언적 사용
WKit.withSelector(this.element, 'canvas', canvas => {
    // canvas가 존재할 때만 실행
});
```

#### 적용 기준

| 조건 | 설명 |
|------|------|
| **반복되는 null 체크** | 동일한 요소를 여러 곳에서 검사 |
| **전제조건과 순회 대상이 다름** | `if (canvas)` 후 `events.forEach()` |
| **컨텍스트 전달 필요** | 검사 결과를 콜백에서 사용 |

---

## 주요 특징

### 1. 선언적 스크립트 작성
사용자가 에디터에서 register/destroy 스크립트만 작성하면 프레임워크가 자동으로 실행

### 2. 자동 라이프사이클 관리
프레임워크가 자동으로 init/cleanup 호출하여 메모리 누수 방지

### 3. 함수형 조합
fx.js 기반 파이프라인으로 복잡한 로직을 간결하게 표현

### 4. 메모리 안전성
- 3D 리소스 자동 dispose (geometry, material, texture)
- 이벤트 리스너 정리
- GlobalDataPublisher 구독 해제

### 5. 느슨한 결합
EventBus와 GlobalDataPublisher로 컴포넌트 독립성 보장

### 6. 2D/3D 통합
DOM 이벤트와 Three.js 이벤트를 일관된 방식으로 처리

### 7. 컴포넌트 정형화
스키마 기반 템플릿으로 도메인 컴포넌트 추가 용이
- customEvents, subscriptions 스키마만 정의
- 5-10분이면 새 컴포넌트 추가 가능

### 8. 페이지의 Orchestration 역할
페이지는 순수한 조율 계층으로 비즈니스 로직 집중
- 컴포넌트 간 연결 고리 정의
- 데이터 흐름 제어 (globalDataMappings)
- 이벤트 처리 위임 (eventBusHandlers)

### 9. 데이터셋별 Auto-Refresh
각 데이터의 특성에 맞는 독립적인 갱신 주기 지원
- 실시간 데이터(주문, 알림): 짧은 주기 (3초)
- 통계 데이터(리포트): 긴 주기 (30초+)

---

## 베스트 프랙티스

### 1. 컴포넌트 스크립트 작성

**DO**:
```javascript
// 메서드 바인딩
this.myMethod = myMethod.bind(this);

// 명시적 정리
function onInstanceUnLoad() {
    WKit.removeCustomEvents(this, this.customEvents);
}
```

**DON'T**:
```javascript
// 정리 로직 누락 (메모리 누수)
```

### 2. 이벤트 네이밍

**DO**:
```javascript
// @ 접두사로 커스텀 이벤트 명시
'@myClickEvent'
'@productSelected'
```

**DON'T**:
```javascript
// 브라우저 기본 이벤트와 혼동 가능
'click'  // ❌
'myEvent'  // ❌
```

### 3. 리소스 정리

**DO**:
```javascript
// before_unload에서 모든 리소스 정리
function onPageUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearThreeInstances.call(this);
}
```

### 4. HTML dataset 활용

**DO**:
```javascript
// 동적 렌더링 시 dataset에 식별자 저장
this.renderUsers = function(users) {
    return users.map((user, index) => `
        <div class="user-card"
             data-index="${index}"
             data-user-id="${user.id}">
            ${user.name}
        </div>
    `).join('');
}.bind(this);

// 이벤트 핸들러에서 dataset 활용
'@userClicked': ({ event, targetInstance }) => {
    const { index, userId } = event.target.dataset;
    const user = targetInstance.users[index];
}
```

### 5. 컴포넌트 메소드 위임

**DO**:
```javascript
// Page - Orchestration만 집중
'@userClicked': async ({ userId }) => {
    const user = await fetchData(this, 'users', { id: userId });
    userDetailPanel.showUserDetail(user);  // 위임!
}

// Component - 도메인 로직 소유
this.showUserDetail = function(user) {
    const enriched = this.enrichUserData(user);
    this.updateUI(enriched);
}.bind(this);
```

### 6. 페이지네이션 패턴

**핵심 원칙**: 서버가 데이터 주체, 클라이언트는 렌더링만 담당

```javascript
this.pageState = {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
};

function renderData(response) {
    const { data, pagination } = response;
    if (!data) return;

    const prevTotalPages = this.pageState.totalPages;

    if (pagination) {
        this.pageState.page = pagination.page;
        this.pageState.totalPages = pagination.totalPages;
    }

    this.tableInstance.setData(data);

    // totalPages 변경 시에만 버튼 재생성
    if (prevTotalPages !== this.pageState.totalPages) {
        // 버튼 재생성
    }
}
```

### 7. 이벤트 바인딩과 event.preventDefault()

WKit의 `bindEvents`는 **submit 이벤트에만** `event.preventDefault()`를 호출합니다.

```javascript
// ⚠️ 비동기 핸들러 - await 전에 호출 필수
'@linkClicked': async ({ event }) => {
    event.preventDefault();  // ✅ await 전에 호출

    const data = await fetchData(...);
    // ...
}
```

### 8. 자기 완결 컴포넌트 패턴 (Self-Contained Component)

컴포넌트가 자신의 기능을 완전히 소유하고, 페이지는 실행 여부만 결정하는 패턴입니다.

#### 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│  1. 컴포넌트는 기능(메소드)을 정의한다                         │
│     - showDetail(), highlight(), focusCamera() 등            │
│     - 각 메소드는 자기 완결 (필요 시 fetchData 포함)           │
│                                                              │
│  2. 컴포넌트는 datasetInfo[]로 데이터 정보를 선언한다          │
│     - 복수의 데이터셋 지원                                    │
│     - 메소드 내에서 필요 시 조회                              │
│                                                              │
│  3. 컴포넌트는 customEvents로 이벤트만 발행한다               │
│     - 사용자 행동을 혼자 판단하지 않음                        │
│     - "뭔가 일어났다"만 알림                                  │
│                                                              │
│  4. 컴포넌트는 자체 리소스(Shadow DOM)를 관리한다             │
│     - 외부 컴포넌트 의존 없음 (결합도 제거)                    │
│     - Shadow DOM으로 HTML + CSS 캡슐화 (자동 스코핑)          │
│     - destroy 시 host 제거로 전체 정리 (1:1 원칙)             │
│                                                              │
│  5. 페이지가 시나리오를 결정한다                              │
│     - eventBusHandlers에서 어떤 메소드를 호출할지 선택        │
│     - 시나리오 변경 시 페이지 핸들러만 수정                    │
└─────────────────────────────────────────────────────────────┘
```

#### Shadow DOM 이해

Shadow DOM은 웹 컴포넌트의 캡슐화를 위한 브라우저 기술입니다.

**Host와 Shadow Root 관계**

```
Document Tree
│
├── body
│   └── div#app
│       └── div#popup-sensor1  ← Host (Document Tree에 존재)
│               │
│               └── #shadow-root  ← 경계선
│                       │
│                       └── div.popup  ← Shadow DOM (렌더링되지만 격리됨)
│                           └── ...
```

**핵심 특성**

| 구분 | Host | Shadow Root 내부 |
|------|------|------------------|
| Document Tree | 포함됨 | 포함되지 않음 |
| `document.querySelector()` | 접근 가능 | 접근 불가 |
| 외부 CSS 영향 | 받음 | 받지 않음 |
| 렌더링 | O | O |

**접근 방식 차이**

```javascript
// Host는 일반 DOM처럼 접근
document.querySelector('#popup-sensor1');  // ✓ 찾음

// Shadow 내부는 document에서 직접 접근 불가
document.querySelector('.popup');  // ✗ null

// Shadow Root를 통해서만 접근
host.shadowRoot.querySelector('.popup');  // ✓ 찾음
```

**CSS 양방향 격리**

```css
/* Shadow DOM 내부 스타일 */
.popup { background: red; }

/* 외부 Document 스타일 */
.popup { background: blue; }

/* 서로 영향 없음 - 각자의 .popup은 독립적 */
```

Shadow DOM 내부에서 정의한 CSS는 외부에 영향을 주지 않고, 외부 CSS도 Shadow DOM 내부에 영향을 주지 않습니다.

#### Mixin 패턴 이해

Mixin은 객체에 재사용 가능한 속성과 메서드를 동적으로 주입하는 패턴입니다.

**Mixin의 동작**

```javascript
// Before
this.showPopup  // undefined
this.hidePopup  // undefined

// Mixin 적용
applyShadowPopupMixin(this, { ... });

// After
this._popup           // 상태 (속성)
this.createPopup      // 메서드
this.showPopup        // 메서드
this.hidePopup        // 메서드
this.popupQuery       // 메서드
this.bindPopupEvents  // 메서드
this.destroyPopup     // 메서드
```

**상속, Mixin, 컴포지션 비교**

| 패턴 | 메서드 위치 | 관계 | 특징 |
|------|------------|------|------|
| 상속 | 프로토타입 체인 | is-a | 클래스 기반, 단일 상속 |
| Mixin | this에 직접 | 혼합 | 런타임 주입, 다중 조합 가능 |
| 컴포지션 | 별도 객체 | has-a | 위임 기반 |

Mixin은 "상속보다 컴포지션"을 따르려는 기법이지만, 순수 컴포지션과 달리 메서드가 this에 직접 붙습니다. **기능 주입(injection)** 또는 **객체 확장(augmentation)** 패턴이라고 할 수 있습니다.

**여러 Mixin 조합**

```javascript
applyShadowPopupMixin(this, { ... });
applyDraggableMixin(this, { ... });
applyResizableMixin(this, { ... });
// this에 세 가지 기능 모두 추가됨
```

#### applyShadowPopupMixin (Mixin.js)

Shadow DOM 기반 팝업 기능을 컴포넌트에 주입하는 Mixin입니다.

**제공하는 메서드**

| 메서드 | 설명 |
|--------|------|
| `createPopup()` | Shadow DOM 팝업 생성 |
| `showPopup()` | 팝업 표시 |
| `hidePopup()` | 팝업 숨김 |
| `popupQuery(selector)` | Shadow DOM 내부 요소 선택 |
| `popupQueryAll(selector)` | Shadow DOM 내부 요소 모두 선택 |
| `bindPopupEvents(events)` | 이벤트 델리게이션 기반 바인딩 |
| `destroyPopup()` | 팝업 및 리소스 정리 |

**사용법**

```javascript
const { applyShadowPopupMixin } = Mixin;

applyShadowPopupMixin(this, {
    getHTML: getPopupHTML,      // HTML 반환 함수
    getStyles: getPopupStyles,  // CSS 반환 함수
    onCreated: onPopupCreated   // 생성 후 콜백
});
```

**이벤트 델리게이션 패턴**

`bindPopupEvents`는 이벤트 타입당 하나의 리스너만 등록하여 효율적으로 동작합니다.

```javascript
// 컴포넌트에서 선택자와 이벤트 타입 결정
this.bindPopupEvents({
    click: {
        '.close-btn': () => this.hideDetail(),
        '.refresh-btn': () => this.refresh()
    },
    change: {
        '.input-field': (e) => this.onInputChange(e)
    }
});
```

**장점**:
- 선택자, 이벤트 타입 모두 컴포넌트가 결정 (Mixin에 하드코딩 없음)
- 이벤트 타입당 리스너 하나 (효율적)
- 동적으로 추가된 요소도 자동 처리 (`closest()` 사용)

#### 적용 조건

| 조건 | 설명 |
|------|------|
| 사용자 액션 기반 | 클릭, 호버 등 명시적 액션으로 트리거 |
| 단일 사용 데이터 | 다른 컴포넌트와 공유 불필요 |
| 특정 아이템 상세 | 목록 중 하나의 상세 정보 (팝업 등) |

**적용 금지:**
- 여러 컴포넌트가 같은 데이터를 공유해야 하는 경우 → Topic 기반 구독 사용
- 폴링/자동 갱신이 필요한 경우 → GlobalDataPublisher 사용

#### 컴포넌트 구현 예시 (applyShadowPopupMixin 사용)

```javascript
// register.js
const { bind3DEvents, fetchData } = WKit;
const { applyShadowPopupMixin } = Mixin;

initComponent.call(this);

function initComponent() {
    // 1. 데이터 정의
    this.datasetInfo = [
        { datasetName: 'sensor', param: { id: this.id } }
    ];

    // 2. 이벤트 발행
    this.customEvents = { click: '@sensorClicked' };
    bind3DEvents(this, this.customEvents);

    // 3. Shadow DOM 팝업 믹스인 적용
    applyShadowPopupMixin(this, {
        getHTML: getPopupHTML,
        getStyles: getPopupStyles,
        onCreated: onPopupCreated
    });

    // 4. Public Methods
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);
}

// PUBLIC METHODS
async function showDetail() {
    const result = await fetchData(this.page, 'sensor', { id: this.id });
    const sensor = result?.response?.data;
    if (!sensor) return;

    this.showPopup();
    this.popupQuery('.sensor-name').textContent = sensor.name;
    this.popupQuery('.sensor-temp').textContent = `${sensor.temperature}°C`;
}

function hideDetail() {
    this.hidePopup();
}

// POPUP LIFECYCLE
function onPopupCreated() {
    this.bindPopupEvents({
        click: { '.close-btn': () => this.hideDetail() }
    });
}

// POPUP TEMPLATE
function getPopupHTML() {
    return `
        <div class="popup-overlay">
            <div class="popup">
                <div class="popup-header">
                    <span class="sensor-name"></span>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="popup-body">
                    <span class="sensor-temp"></span>
                </div>
            </div>
        </div>
    `;
}

// POPUP STYLES (Shadow DOM 내부 - 외부와 격리됨)
function getPopupStyles() {
    return `
        .popup-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .popup {
            background: #1e2332;
            border-radius: 12px;
            padding: 16px;
            color: #fff;
        }
        /* ... */
    `;
}
```

```javascript
// destroy.js
const { remove3DEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    this.destroyPopup();  // Mixin 메서드 - 모든 리소스 정리
    remove3DEvents(this, this.customEvents);
}
```

#### 페이지 구현 예시

```javascript
// Page - before_load.js
this.eventBusHandlers = {
    // 시나리오 A: 상세 팝업 표시
    '@sensorClicked': ({ targetInstance }) => {
        targetInstance.showDetail();
    }

    // 시나리오 B: 하이라이트만 (시나리오 변경 시)
    // '@sensorClicked': ({ targetInstance }) => {
    //     targetInstance.highlight();
    // }

    // 시나리오 C: 복합 동작
    // '@sensorClicked': ({ targetInstance }) => {
    //     targetInstance.highlight();
    //     targetInstance.showDetail();
    // }

    // 시나리오 D: 페이지 레벨 처리
    // '@sensorClicked': async ({ targetInstance }) => {
    //     const data = await fetchData(this, 'sensor', { id: targetInstance.id });
    //     this.updateDashboard(data);
    // }
};

onEventBusHandlers(this.eventBusHandlers);
```

#### 시나리오 변경 대응

| 변경 사항 | 컴포넌트 수정 | 페이지 수정 |
|----------|-------------|------------|
| 클릭 시 다른 행동 | ❌ 불필요 | ✅ 핸들러만 변경 |
| 새 기능 추가 | ✅ 메소드 추가 | ✅ 핸들러에서 호출 |
| 기존 기능 조합 | ❌ 불필요 | ✅ 핸들러에서 조합 |

#### 주의사항

1. **웹 빌더 컨텍스트**: Shadow DOM host 생성 시 `document.body` 대신 `this.page.element` 사용
2. **라이프사이클 관리**: `popupHost.remove()`로 Shadow DOM 전체가 정리됨 (1:1 원칙)
3. **CSS 자동 스코핑**: Shadow DOM 내부 스타일은 외부와 완전 격리 (prefix 불필요)
4. **Shadow DOM 내부 접근**: `this.shadowRoot.querySelector()`로 내부 요소 접근
5. **에러 처리**: 컴포넌트 메소드 내에서 try-catch 처리

#### Shadow DOM 장점

| 항목 | 설명 |
|------|------|
| CSS 자동 격리 | 클래스명 충돌 걱정 없음, prefix 불필요 |
| 같은 컴포넌트 복수 배치 | 각각 독립된 스타일 공간 |
| 외부 스타일 영향 차단 | 페이지 CSS가 팝업에 영향 안 줌 |
| 정리 간소화 | host 제거 시 내부 전체 정리 |

---

## 에러 처리 패턴

### Guard Clause (권장)

```javascript
function renderData(response) {
    const { data } = response;

    // Guard clause - 잘못된 데이터 조기 반환
    if (!data) return;

    const template = this.element.querySelector('#template');
    const container = this.element.querySelector('.container');

    if (!template || !container) return;

    // 안전한 렌더링 로직...
}
```

### Try-Catch (외부 라이브러리만)

```javascript
function renderChart(response) {
    const { data } = response;
    if (!data) return;  // Guard clause

    const option = { /* ECharts 옵션 */ };

    // 외부 라이브러리 호출만 try-catch
    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[Chart] setOption error:', error);
    }
}
```

---

## 이벤트 위임 패턴

### event.target.closest() 사용

```javascript
// 이벤트 핸들러에서 dataset 접근
'@itemClicked': ({ event, targetInstance }) => {
    // closest()로 실제 데이터가 있는 요소 찾기
    const item = event.target.closest('.item');
    const { itemId } = item?.dataset || {};

    console.log('Clicked item:', itemId);
}
```

**왜 closest()인가?**
- `event.target`은 실제 클릭된 요소 (자식일 수 있음)
- `data-*` 속성은 부모 요소에 있을 수 있음
- `closest()`로 버블링 경로에서 셀렉터 매칭

---

## 트러블슈팅

### 이벤트가 발생하지 않는 경우

1. 이벤트 이름 확인 (`@` 접두사)
2. WEventBus에 핸들러 등록 여부 확인
3. 브라우저 콘솔에서 `@eventHandler` 로그 확인

### 데이터가 표시되지 않는 경우

1. GlobalDataPublisher 매핑 등록 확인
2. 구독 설정 확인
3. 데이터셋 이름과 파라미터 확인

### 메모리 누수 의심 시

1. before_unload에서 모든 리소스 정리 확인
2. 3D 객체 dispose 확인
3. 이벤트 리스너 제거 확인

### Tabulator 무한 resize 루프

**증상**: 테이블 컬럼이 계속 크기가 변함

**원인**: `layout: 'fitColumns'`와 컨테이너의 CSS `fit-content` 속성 충돌

**해결**: `layout: 'fitData'`로 변경하여 테이블이 고정 너비를 갖도록 함

### Tabulator 커스텀 스타일링

| 요소 | 기본 문제 | 해결 방법 |
|------|----------|----------|
| `.tabulator-table` | `background: white` | `background: transparent` |
| `.tabulator-row` | 기본 높이가 다름 | `min-height`, `height` 모두 지정 |
| `.tabulator-col-title` | 우측 패딩 존재 | `padding-right: 0 !important` |

---

## 컴포넌트 구조: Figma 선택 요소 = 컨테이너

웹 빌더는 컴포넌트마다 **div 컨테이너**를 기본 단위로 가집니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Figma 링크 제공 = 컴포넌트 단위 선택                                  │
│                                                                      │
│  - Figma 선택 요소의 가장 바깥 = div 컨테이너                          │
│  - Figma 선택 요소의 크기 = 컨테이너 크기                              │
│  - 내부 요소 = innerHTML (Figma 스타일 그대로)                        │
│                                                                      │
│  <div id="component-container">   ← Figma 선택 요소 크기              │
│      <!-- innerHTML -->           ← Figma 내부 요소 (스타일 그대로)    │
│  </div>                                                              │
└─────────────────────────────────────────────────────────────────────┘
```

**컨테이너 크기 규칙:**

| 상황 | 컨테이너 크기 |
|------|-------------|
| CONTAINER_STYLES.md 없음 | Figma 선택 요소 크기 (고정) |
| CONTAINER_STYLES.md 있음 | 레이아웃 기반 크기로 재정의 |

---

## 폴더 구조

```
RNBT_architecture/
├── Utils/                          # 핵심 프레임워크 모듈
│   ├── fx.js                       # 함수형 프로그래밍
│   ├── WEventBus.js                # 이벤트 버스
│   ├── GlobalDataPublisher.js      # 데이터 발행 시스템
│   └── WKit.js                     # 통합 유틸리티
│
├── Runtime_Scaffold_code_sample/   # 스캐폴드 템플릿
│
├── Examples/
│   ├── example_basic_01/           # Page Only 예제 (IoT 대시보드)
│   │   ├── page/
│   │   │   ├── page_scripts/
│   │   │   └── components/
│   │   ├── mock_server/
│   │   ├── datasetList.json
│   │   └── README.md
│   │
│   ├── example_master_01/          # Master + Page 예제
│   │   ├── master/
│   │   │   ├── common_component/
│   │   │   └── components/
│   │   ├── page/
│   │   │   ├── page_scripts/
│   │   │   └── components/
│   │   ├── mock_server/
│   │   ├── datasetList.json
│   │   └── README.md
│   │
│   └── example_master_02/          # 확장 예제
│
├── Projects/                       # 실제 프로젝트
│
├── Analysis/                       # 분석 문서
│
├── CLAUDE.md                       # 작업 지침
└── README.md                       # 이 파일
```

---

## 예제 가이드

### example_basic_01 - Page Only 아키텍처

- **목적**: 폴링 기반 다중 갱신 주기 패턴 검증
- **시나리오**: IoT 센서 모니터링 대시보드
- **특징**: 5초/15초/60초 독립적 갱신 주기

### example_master_01 - Master + Page 아키텍처

- **목적**: Master + Page 레이어 독립적 데이터 흐름 검증
- **시나리오**: 일반 대시보드 (헤더, 사이드바, 통계)
- **특징**: `common_component` 패턴, `this.page` 참조

---

## datasetList.json 포맷

```json
{
  "version": "3.2.0",
  "data": [
    {
      "name": "datasetName",
      "dataset_id": "unique-id",
      "page_id": "MASTER|PAGE",
      "interval": "5000",
      "param_info": [],
      "rest_api": "{\"url\":\"...\",\"method\":\"GET\",\"headers\":{},\"body\":\"\"}"
    }
  ],
  "datasource": []
}
```

---

## 향후 확장 가능성

### 1. 플러그인 시스템
```javascript
WKit.registerPlugin('myPlugin', {
    onPageLoad() { ... },
    onComponentRegister() { ... }
});
```

### 2. 상태 관리 통합
```javascript
WKit.connectToStore(instance, mapStateToProps);
```

### 3. 타입 안전성
```javascript
interface DataMappingSchema {
    ownerId: string;
    datasetInfo: DatasetInfo;
}
```

### 4. 디버깅 도구
```javascript
WKit.enableDebugMode({
    showEventFlow: true,
    trackDataMapping: true
});
```

---

## 참고 자료

### 파일 참조
- `fx.js` - 함수형 프로그래밍 유틸리티
- `WEventBus.js` - 이벤트 버스 구현
- `GlobalDataPublisher.js` - 데이터 발행 시스템
- `WKit.js` - 통합 유틸리티 킷
- `Runtime_Scaffold_code_sample/` - 런타임 스크립트 예제

### 핵심 함수 참조
- `WKit.bindEvents` - 2D 이벤트 바인딩
- `WKit.bind3DEvents` - 3D 이벤트 바인딩
- `WKit.fetchData` - 데이터 fetch primitive
- `WKit.getInstanceByName` - 인스턴스 검색 primitive
- `WKit.dispose3DTree` - 3D 리소스 정리
- `GlobalDataPublisher.fetchAndPublish` - 데이터 fetch & 발행

---

## 버전 정보

**문서 버전**: 2.2.0
**최종 업데이트**: 2025-12-16

### 주요 변경사항

- v2.2.0: Shadow DOM / Mixin 개념 설명 추가 (2025-12-16)
  - Shadow DOM 이해: Host/Shadow Root 관계, CSS 격리 원리
  - Mixin 패턴 이해: 상속/컴포지션과의 비교
  - applyShadowPopupMixin 소개: 이벤트 델리게이션 패턴 적용
  - 컴포넌트 예시를 applyShadowPopupMixin 사용 버전으로 업데이트

- v2.1.0: 자기 완결 컴포넌트 패턴 추가 (2025-12-16)
  - "8. 자기 완결 컴포넌트 패턴 (Self-Contained Component)" 섹션 추가
  - datasetInfo 배열 지원, 컴포넌트 내 fetchData
  - Shadow DOM 기반 팝업 생성 (CSS 자동 스코핑)
  - 시나리오 변경 대응 유연성 강화

- v2.0.0: 문서 구조 재편 (2025-12-15)
  - CLAUDE.md의 설계 내용을 README.md로 통합
  - CLAUDE.md는 작업 지침만 포함하도록 분리
  - 중복 내용 제거 및 일원화

- v1.0.0: 초기 문서 작성 (2025-11-28)
