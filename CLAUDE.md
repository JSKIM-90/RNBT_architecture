# 런타임 프레임워크 설계 문서

## 개요

브라우저 런타임에서 자바스크립트 코드를 동적으로 실행하여 웹 페이지를 제작하는 **비주얼 웹 빌더 애플리케이션**의 런타임 프레임워크입니다.

---

## 핵심 모듈 구성

### fx.js - 함수형 프로그래밍 라이브러리

**패턴**: Functional Programming (FP)

**주요 기능**:
- `curry`, `pipe`, `go`, `reduce`, `map`, `filter` 등 FP 유틸리티
- Lazy Evaluation (`L` 네임스페이스)
- Promise 기반 비동기 처리
- 동시성 처리 (`C` 네임스페이스 - catchNoop)

**특징**:
```javascript
// 파이프라인 기반 데이터 처리
fx.go(
  data,
  fx.map(transform),
  fx.filter(predicate),
  fx.take(10)
)
```

### WEventBus.js - 이벤트 버스

**패턴**: Pub-Sub (Publisher-Subscriber)

**주요 기능**:
- `on`, `off`, `emit`, `once`
- 컴포넌트 간 느슨한 결합 제공
- 커스텀 이벤트 전파

**사용 예시**:
```javascript
// 이벤트 발행
WEventBus.emit('@myClickEvent', { event, targetInstance })

// 이벤트 구독
WEventBus.on('@myClickEvent', handler)
```

### GlobalDataPublisher.js - 글로벌 데이터 발행 시스템

**패턴**: Topic-based Pub-Sub + Data Layer

**주요 기능**:
- Topic 기반 데이터 매핑 등록 (`registerMapping`)
- 데이터 fetch 후 구독자에게 자동 전파 (`fetchAndPublish`)
- 구독 관리 (`subscribe`, `unsubscribe`)
- 페이지 레벨 공유 데이터 관리

**데이터 흐름**:
```javascript
// 1. 매핑 등록
GlobalDataPublisher.registerMapping({
  topic: 'users',
  datasetInfo: { datasetName: 'dummyjson', param: {...} }
})

// 2. 데이터 fetch & 발행
GlobalDataPublisher.fetchAndPublish('users', page)

// 3. 컴포넌트 구독
GlobalDataPublisher.subscribe('users', instance, handler)
```

### WKit.js - 통합 유틸리티 킷

**패턴**: Facade + Utility + Resource Management

**주요 기능**:

#### 2D 이벤트 바인딩
- 이벤트 위임 패턴 (`bindEvents`, `delegate`)
- 동적 DOM 이벤트 처리

```javascript
WKit.bindEvents(instance, {
  click: {
    '.navbar-brand': '@triggerNavbarTitle',
    '.nav-link': '@triggerNavLink'
  }
})
```

#### 3D 이벤트 바인딩
- Three.js Raycasting 기반 (`bind3DEvents`, `initThreeRaycasting`)
- 3D 객체 클릭 이벤트 처리
- **단일 Canvas 아키텍처**: 모든 3D 컴포넌트가 하나의 Scene 공유
- **컴포넌트 식별**: appendElement.eventListener로 컴포넌트 구분
- **상세 문서**: [`WKIT_Document/3d_event_binding.md`](WKIT_Document/3d_event_binding.md)

#### 리소스 관리
- 3D 객체 메모리 해제 (`dispose3DTree`)
- Geometry, Material, Texture 자동 dispose

#### 헬퍼 함수
- Iterator 생성 (`makeIterator`)
- 인스턴스 검색 (`getInstanceByName`, `getInstanceById`)
- 데이터 fetch (`fetchData`)
- 이벤트 발행 (`emitEvent`)

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
)
```

### 2. 이벤트 기반 아키텍처

컴포넌트 간 느슨한 결합으로 확장성과 유지보수성 확보

```javascript
// 발행자
WEventBus.emit('@myClickEvent', { event, targetInstance })

// 구독자
WEventBus.on('@myClickEvent', async ({ event, targetInstance }) => {
  // primitive 조합으로 처리
  const { datasetInfo } = targetInstance;
  if (datasetInfo) {
    const { datasetName, param } = datasetInfo;
    const data = await WKit.fetchData(page, datasetName, param);
    // 처리 로직
  }
})
```

### 3. 이벤트 위임 패턴

동적으로 생성되는 DOM 요소에 대한 효율적인 이벤트 처리

```javascript
// WKit.js:365-380
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    const potentialElements = qsAll(selector, instance.element);
    for (const potentialElement of potentialElements) {
      if (potentialElement === event.target) {
        return handler.call(event.target, event);
      }
    }
  };
  instance.element.addEventListener(eventName, emitEvent);
}
```

### 4. 라이프사이클 관리

컴포넌트와 페이지의 생명주기 명확화

**컴포넌트 라이프사이클**:
- `register` → `completed` → `destroy`

**페이지 라이프사이클**:
- `before_load` → `loaded` → `before_unload`

### 5. Topic 기반 데이터 매핑

중앙 집중식 데이터 관리로 컴포넌트 간 데이터 공유 효율화

```javascript
// 페이지에서 등록
GlobalDataPublisher.registerMapping({ topic: 'users', datasetInfo })
GlobalDataPublisher.fetchAndPublish('users', page)

// 컴포넌트에서 구독
GlobalDataPublisher.subscribe('users', this, this.renderTable)
```

### 6. Lazy Evaluation

메모리 효율적인 데이터 처리

```javascript
// 필요한 만큼만 평가
fx.go(
  largeArray,
  fx.L.map(expensiveOperation),  // Lazy
  fx.L.filter(predicate),          // Lazy
  fx.take(10)                      // 10개만 평가
)
```

---

## 런타임 스캐폴드 패턴

### Component Script 패턴

#### 2D 컴포넌트 등록 (이벤트 바인딩)
`component_2d_register_event_binding.js:1-27`

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
    }
}

function myMethod(data) {
    console.log(`[myMethod] ${this.name}`, data);
}
```

#### 공통 구독 컴포넌트 (2D/3D)
`component_common_register_subscribe_page.js:1-39`

**특징**: 한 topic에 여러 핸들러 등록 가능

```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// Subscription schema (배열로 여러 핸들러 등록 가능)
this.subscriptions = {
    users: ['renderUserTable', 'updateUserCount'],  // 한 topic에 여러 메서드!
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

// Handler functions
function renderUserTable(data) {
    console.log(`[Render Table] ${this.name}`, data);
}

function updateUserCount(data) {
    console.log(`[Update Count] ${this.name}`, data.length);
}

function renderProductList(data) {
    console.log(`[Render Products] ${this.name}`, data);
}
```

#### 3D 컴포넌트 (이벤트 바인딩)
`component_3d_register_event_binding.js:1-24`

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

**이벤트 제거** (`component_2d_destroy_remove_events.js:1-11`)
```javascript
const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    removeCustomEvents(this, this.customEvents);
}
```

**구독 해제 포함** (`component_2d_destroy_unsubscribe_page.js:1-14`)
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
`page_before_load.js:1-32`

**용도**: 컴포넌트 생성 전 초기 설정 (이벤트 핸들러, Raycasting)

```javascript
const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    '@buttonClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Button clicked:', event, targetInstance);
    },

    '@3dObjectClicked': async ({ event, targetInstance }) => {
        // Primitive composition for data fetching
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
`page_loaded.js:1-28`

**용도**: 모든 컴포넌트 completed 후 데이터 발행
- 구독자(컴포넌트)들이 준비된 시점에 실행
- GlobalDataPublisher를 통한 페이지 레벨 데이터 공유

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
```

#### before_unload
`page_before_unload.js:1-38`

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
        each((GlobalDataPublisher.unregisterMapping))
    )
}

function clearThreeInstances() {
    const { scene } = wemb.threeElements;
    go(
        makeIterator(this, 'threeLayer'),
        map(({ appendElement }) => dispose3DTree(appendElement))
    )

    clearSceneBackground(scene);
    this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
    this.raycastingEventHandler = null;
}
```

---

## 데이터 흐름

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

### 데이터 fetch 패턴

```javascript
// 이벤트 핸들러에서 직접 primitive 조합
this.eventBusHandlers = {
  '@myClickEvent': async ({ event, targetInstance }) => {
    const { datasetInfo } = targetInstance;

    if (datasetInfo) {
      const { datasetName, param } = datasetInfo;

      // WKit이 제공하는 primitive 사용
      const data = await WKit.fetchData(this, datasetName, param);

      // 데이터 처리
      console.log('Fetched data:', data);
    }
  }
};
```

**처리 과정**:
1. targetInstance에서 datasetInfo 정보 추출
2. `WKit.fetchData()` - 데이터셋에서 데이터 fetch
3. 필요시 `WKit.getInstanceByName()` - 다른 인스턴스 찾기
4. 사용자가 직접 로직 조합

---

## 주요 특징

### 1. 선언적 스크립트 작성
사용자가 에디터에서 register/destroy 스크립트만 작성하면 프레임워크가 자동으로 실행

### 2. 자동 라이프사이클 관리
프레임워크가 자동으로 init/cleanup 호출하여 메모리 누수 방지

### 3. 함수형 조합
fx.js 기반 파이프라인으로 복잡한 로직을 간결하게 표현

```javascript
fx.go(
  data,
  fx.map(transform),
  fx.filter(predicate),
  fx.each(process)
)
```

### 4. 메모리 안전성
- 3D 리소스 자동 dispose (geometry, material, texture)
- 이벤트 리스너 정리
- GlobalDataPublisher 구독 해제

### 5. 느슨한 결합
EventBus와 GlobalDataPublisher로 컴포넌트 독립성 보장

### 6. 2D/3D 통합
DOM 이벤트와 Three.js 이벤트를 일관된 방식으로 처리

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
  - ~~`pipeForDataMapping(targetInstance)`~~ - **제거됨 (v1.1)**
  - ~~`triggerEventToTargetInstance(name, eventName)`~~ - **제거됨 (v1.1)**
  - ~~`getDataMappingSchema()`~~ - **제거됨 (v1.1)**

#### 제거된 API들

##### 1. pipeForDataMapping

**제거 이유**:
1. **비즈니스 로직의 조합**: 프레임워크가 "어떻게 조합할지"를 강제
2. **불필요한 추상화**: visualInstanceList 매핑 기능이 실제로 사용되지 않음
3. **명확성 저하**: 내부에서 여러 primitive를 숨김 (fetchData, getInstanceByName, makeIterator)
4. **유연성 부족**: 사용자가 필요한 부분만 선택적으로 사용 불가

**Before (제거 전)**:
```javascript
// 내부 로직이 숨겨져 있음
const results = await WKit.pipeForDataMapping(targetInstance);
console.log(results[0].data);
```

**After (제거 후)**:
```javascript
// primitive 조합으로 명확한 흐름
const { dataMapping } = targetInstance;
const { datasetName, param } = dataMapping[0].datasetInfo;
const data = await WKit.fetchData(this, datasetName, param);
console.log(data);
```

**장점**:
- 코드 흐름이 명확해짐
- 사용자가 필요한 만큼만 사용
- 디버깅 용이
- 프레임워크 API 표면 최소화

##### 2. triggerEventToTargetInstance

**제거 이유**:
1. **단순 조합**: `getInstanceByName` + `emitEvent`만 조합
2. **불필요한 래핑**: 사용자가 2줄로 직접 작성 가능
3. **fx.range(1) 안티패턴**: 내부에서 더미 값 생성

**Before (제거 전)**:
```javascript
WKit.triggerEventToTargetInstance('MyComponent', '@myEvent');
```

**After (제거 후)**:
```javascript
// primitive 조합으로 명확함
const iter = WKit.makeIterator(wemb.mainPageComponent);
const targetInstance = WKit.getInstanceByName('MyComponent', iter);
if (targetInstance) {
    WKit.emitEvent('@myEvent', targetInstance);
}
```

##### 3. getDataMappingSchema

**제거 이유**:
1. **불확실한 필요성**: 일괄 처리가 필요한 영역이 구독 패턴 외에는 불확실
2. **스키마 예제의 한계**: 실제 사용 사례마다 구조가 다름
3. **오해 소지**: "이 구조를 따라야 한다"는 잘못된 신호

**Before (제거 전)**:
```javascript
const schema = WKit.getDataMappingSchema();
// 하드코딩된 예제 반환
```

**After (제거 후)**:
```javascript
// 사용자가 필요한 구조를 직접 정의 (v1.1 simplified)
// 3D 컴포넌트의 경우 간단한 datasetInfo 객체만 정의
this.datasetInfo = {
    datasetName: 'myDataset',
    param: {
        type: 'geometry',
        id: this.id
    }
};

// 페이지 이벤트 핸들러에서 primitive 조합
'@3dObjectClicked': async ({ event, targetInstance }) => {
    const { datasetInfo } = targetInstance;
    if (datasetInfo) {
        const { datasetName, param } = datasetInfo;
        const data = await WKit.fetchData(this, datasetName, param);
    }
}
```

**남은 스키마 함수들** (유지):
- `getCustomEventsSchema()` - 이벤트 바인딩 패턴 (명확한 구조)
- `getGlobalMappingSchema()` - GlobalDataPublisher 패턴 (명확한 구조)
- `getSubscriptionSchema()` - 구독 패턴 (명확한 구조)

---

### 코드 생성 친화적
스키마 함수들로 코드 자동 생성 지원:
- `WKit.getCustomEventsSchema()` - 이벤트 바인딩 패턴
- `WKit.getGlobalMappingSchema()` - 글로벌 데이터 매핑 패턴
- `WKit.getSubscriptionSchema()` - 구독 패턴
- ~~`WKit.getDataMappingSchema()`~~ - **제거됨 (v1.1)** - 불확실한 필요성

### 런타임 안전성
동적 스크립트 실행 시 메모리 누수 방지:
- 명시적 리소스 정리
- 이벤트 리스너 자동 제거
- 3D 객체 traverse & dispose

### 확장성
새로운 데이터셋/이벤트 추가 시 스키마만 수정하면 됨

### 개발자 경험
- FP 기반으로 코드 가독성 향상
- 디버깅 용이성 (콘솔 로그 자동 출력)
- 에러 핸들링 일관성

---

## 아키텍처 다이어그램

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

## 사용 예시

### 예시 1: 데이터 구독 및 시각화

```javascript
// Component - register (먼저 구독 등록)
this.subscriptions = { products: ['renderChart'] };

fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, fnList]) =>
    fx.each(fn => GlobalDataPublisher.subscribe(topic, this, this[fn]), fnList)
  )
);

function renderChart(data) {
  // 차트 렌더링 로직
  console.log('Rendering chart with data:', data);
}

// Page - loaded (모든 컴포넌트 completed 후 데이터 발행)
this.globalDataMappings = [
  {
    topic: 'products',
    datasetInfo: {
      datasetName: 'api',
      param: { endpoint: '/products' }
    }
  }
];

fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
// → 구독한 컴포넌트의 renderChart() 자동 호출됨
```

### 예시 2: 이벤트 기반 상호작용

```javascript
// Page - before_load (이벤트 핸들러 먼저 등록)
this.eventBusHandlers = {
  '@productClicked': async ({ event, targetInstance }) => {
    // primitive 조합으로 데이터 fetch
    const { datasetInfo } = targetInstance;

    if (datasetInfo) {
      const { datasetName, param } = datasetInfo;
      const data = await WKit.fetchData(this, datasetName, param);
      // 상세 페이지로 이동 또는 모달 표시
      console.log('Product data:', data);
    }
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);

// Component - register (이벤트 바인딩)
this.customEvents = {
  click: {
    '.product-card': '@productClicked'
  }
};

WKit.bindEvents(this, this.customEvents);
```

### 예시 3: 3D 객체 상호작용

```javascript
// Page - before_load (Raycasting 및 이벤트 핸들러 먼저 등록)
this.raycastingEventHandler = WKit.initThreeRaycasting(
  this.element,
  'click'
);

this.eventBusHandlers = {
  '@3dObjectClicked': async ({ event, targetInstance }) => {
    console.log('Clicked 3D object:', event.intersects[0].object);

    // 필요시 데이터 fetch
    const { datasetInfo } = targetInstance;
    if (datasetInfo) {
      const { datasetName, param } = datasetInfo;
      const data = await WKit.fetchData(this, datasetName, param);
      console.log('3D object data:', data);
    }
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);

// 3D Component - register (이벤트 바인딩)
this.customEvents = {
  click: '@3dObjectClicked'
};

this.datasetInfo = {
  datasetName: 'geometryData',
  param: { type: '3d', id: this.id }
};

WKit.bind3DEvents(this, this.customEvents);
```

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
// 화살표 함수는 바인딩 불필요하지만 일관성을 위해 일반 함수 사용 권장
this.myMethod = (data) => { ... };

// 정리 로직 누락 (메모리 누수)
```

### 2. 데이터 소스 정의

**DO**:
```javascript
// 3D 컴포넌트: 간단한 datasetInfo 객체
this.datasetInfo = {
  datasetName: 'myDataset',
  param: {
    type: 'geometry',
    id: this.id  // 동적 ID 사용
  }
};

// 페이지: GlobalDataPublisher 매핑
this.globalDataMappings = [{
  topic: 'users',
  datasetInfo: {
    datasetName: 'api',
    param: { endpoint: '/users' }
  }
}];
```

**DON'T**:
```javascript
// 하드코딩된 ID 사용
this.datasetInfo = {
  datasetName: 'myDataset',
  param: { id: 'hardcoded-id' }  // ❌
};

// 불필요한 복잡한 구조
this.dataMapping = [{  // ❌ 배열 불필요
  ownerId: this.id,  // ❌ 사용되지 않는 필드
  visualInstanceList: [],  // ❌ 사용되지 않는 필드
  datasetInfo: { ... }
}];
```

### 3. 이벤트 네이밍

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

### 4. 리소스 정리

**DO**:
```javascript
// before_unload에서 모든 리소스 정리
function onPageUnLoad() {
  clearEventBus.call(this);
  clearDataPublisher.call(this);
  clearThreeInstances.call(this);
}
```

**DON'T**:
```javascript
// 일부 리소스만 정리 (메모리 누수)
function onPageUnLoad() {
  WKit.offEventBusHandlers(this.eventBusHandlers);
  // 3D 리소스 정리 누락 ❌
}
```

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
// Redux/MobX와 같은 상태 관리 라이브러리 통합
WKit.connectToStore(instance, mapStateToProps);
```

### 3. 타입 안전성
```javascript
// TypeScript 타입 정의 추가
interface DataMappingSchema {
  ownerId: string;
  visualInstanceList: string[];
  datasetInfo: DatasetInfo;
}
```

### 4. 디버깅 도구
```javascript
// 개발 모드에서 시각화된 디버깅 정보
WKit.enableDebugMode({
  showEventFlow: true,
  trackDataMapping: true
});
```

---

## 참고 자료

### 파일 참조
- `fx.js` - 함수형 프로그래밍 유틸리티
- `WEventBus.js:1-34` - 이벤트 버스 구현
- `GlobalDataPublisher.js:1-58` - 데이터 발행 시스템
- `WKit.js:1-381` - 통합 유틸리티 킷
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

**문서 버전**: 1.1.0
**최종 업데이트**: 2025-11-19
**주요 변경사항**:
- v1.1.0: Primitive Building Blocks 원칙 적용
  - 제거된 API: `pipeForDataMapping`, `triggerEventToTargetInstance`, `getDataMappingSchema`
  - 제거된 Internal: `resolveMappingInfo`, `getDataFromMapping`
  - 데이터 구조 간소화: 3D 컴포넌트의 `dataMapping` 배열 → 단일 `datasetInfo` 객체
  - 제거된 불필요 필드: `ownerId`, `visualInstanceList` (사용되지 않음)
  - 페이지 라이프사이클 정정:
    - before_load: 이벤트 핸들러 등록, Raycasting 초기화 (컴포넌트 생성 전)
    - loaded: GlobalDataPublisher 데이터 발행 (모든 컴포넌트 completed 후)
  - 프레임워크는 primitive만 제공, 조합은 사용자가 직접
- v1.0.0: 초기 문서 작성

**작성자**: Claude Code Analysis
