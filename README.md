# RENOBIT 아키텍처 가이드

RENOBIT은 크게 페이지와 컴포넌트로 만들어지는 웹 결과물을 만들어내는 플랫폼이다. 페이지는 컴포넌트가 각각의 역할을 수행할 수 있도록 컨트롤러의 역할을 해야 한다. 이 지점에서 두 가지 중요한 원칙을 도출할 수 있다.

- **페이지는 컨트롤러로서 컴포넌트를 운영한다.**
- **컴포넌트는 수동적이며, 자신의 콘텐츠를 가지고 있다.**

---

## 라이프사이클

페이지와 컴포넌트는 각각 라이프 사이클을 가지고 있다.

### 페이지 라이프사이클

| 단계 | 시점 |
|------|------|
| Before Load | 모든 개별 컴포넌트 register 이전 |
| Loaded | 모든 개별 컴포넌트 completed 이후 |
| Before Unload | 모든 개별 컴포넌트 destroy 이전 |

### 컴포넌트 라이프사이클

| 단계 | 설명 |
|------|------|
| register | 컴포넌트 초기화 |
| destroy | 컴포넌트 정리 |

### 컴포넌트 소스 레벨 라이프사이클

참조: [Utils/ComponentMixin.js](Utils/ComponentMixin.js)

#### `_onImmediateUpdateDisplay()` (override)

1. WVDOMComponent의 `immediateUpdateDisplay`가 실행된다
2. innerHTML와 styleTag가 생성된다
3. `super.immediateUpdateDisplay`가 실행된다 (WVComponent)
4. `this._componentEventDispatcher.dispatchEvent(WVComponentScriptEvent.REGISTER)` 실행된다
5. `_onImmediateUpdateDisplay()`가 실행된다 → override

> - Codebox의 register에서 `this.element`에 접근할 수 있다
> - Src에서 `_onImmediateUpdateDisplay`에서 `this.element`에 접근할 수 있다

#### `_onDestroy()` (override)

1. `_onDestroy()`가 실행된다 → override
2. `super._onDestroy`가 실행된다 → WVDOMComponent
3. `this.element`가 제거된다
4. `super._onDestroy`가 실행된다 → WV2DComponent
5. `super._onDestroy`가 실행된다 → WVComponent
6. `this._componentEventDispatcher.dispatchEvent(WVComponentScriptEvent.DESTROY)` 실행된다

> - Codebox의 destroy에서는 `this.element`가 없다. `this`는 있다
> - Src에서 `_onDestroy`에서는 `this.element`가 있다. 당연히 `this`도 있다

---

## 프로젝트 설계 템플릿

### 페이지 라이프사이클 구현

#### page_before_load.js

**역할:** 컴포넌트 생성 전 초기 설정

**핵심 논리:**
- 컴포넌트는 독립적이고, 페이지에서 정의할 이벤트도 사용자 정의입니다
- 이벤트가 정의될 영역을 빈 구조로 제공하고, 샘플로 패턴을 명시합니다

**구현 특징:**
- 빈 구조 제공 (`this.eventBusHandlers = {}`)
- 샘플 하나로 패턴 명시
- Primitive 조합 방식 표현
- 선택적 기능은 주석 처리

```javascript
const { onEventBusHandlers, fetchData } = WKit;

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    '@itemClicked': async ({ event, targetInstance }) => {
        const { datasetInfo } = targetInstance;
        if (datasetInfo?.length) {
            for (const { datasetName, param } of datasetInfo) {
                const data = await fetchData(this, datasetName, param);
                // TODO: 데이터 처리
            }
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

#### page_loaded.js

**역할:** 모든 컴포넌트 completed 후 데이터 발행 및 갱신 관리

**핵심 논리:**
- 페이지는 컴포넌트가 공유할 데이터를 속성으로 정의하고, 구독자들에게 데이터를 전달합니다
- 데이터마다 갱신 주기가 다를 수 있으므로 독립적인 interval을 관리합니다

**데이터 매핑 정의:**

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

- `refreshInterval` 있으면: 주기적 갱신
- `refreshInterval` 없으면: 한 번만 fetch

**Param 관리:**

문제: param은 호출 시점마다 달라질 수 있어야 함 (필터, 시간 범위 등)
해결: `this.currentParams`로 topic별 param 관리

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

- 관리 주체: 페이지 (데이터셋 정보를 소유하므로)
- 관리 구조: `this.currentParams[topic]`
- 사용: `fetchAndPublish(topic, this, this.currentParams[topic])`

**Interval 관리:**

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

> 핵심: `currentParams`는 참조이므로 interval 재시작 불필요

#### page_before_unload.js

**역할:** 페이지 종료 시 모든 리소스 정리

**핵심 논리:** 생성된 모든 리소스는 1:1 매칭으로 정리되어야 합니다.

**정리 순서:**

```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);        // 1. Interval 먼저 중단
    clearEventBus.call(this);           // 2. EventBus 정리
    clearDataPublisher.call(this);      // 3. DataPublisher 정리
    clearThree.call(this);              // 4. Three.js 정리 (선택)
}
```

**생성/정리 매칭 테이블:**

| 생성 (before_load / loaded) | 정리 (before_unload) |
|-----------------------------|----------------------|
| `this.eventBusHandlers = {...}` | `this.eventBusHandlers = null` |
| `onEventBusHandlers(...)` | `offEventBusHandlers(...)` |
| `this.globalDataMappings = [...]` | `this.globalDataMappings = null` |
| `this.currentParams = {}` | `this.currentParams = null` |
| `this.refreshIntervals = {}` | `this.refreshIntervals = null` |
| `GlobalDataPublisher.registerMapping(...)` | `GlobalDataPublisher.unregisterMapping(...)` |
| `setInterval(...)` | `clearInterval(...)` |

---

## 컴포넌트 라이프사이클 패턴

컴포넌트는 register와 destroy 두 개의 라이프사이클 단계를 가집니다.

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

**핵심 포인트:**
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

**생성/정리 매칭 (컴포넌트):**

| 생성 (register) | 정리 (destroy) |
|-----------------|----------------|
| `this.customEvents = {...}` | `this.customEvents = null` |
| `bindEvents(this, customEvents)` | `removeCustomEvents(this, customEvents)` |
| `this.subscriptions = {...}` | `this.subscriptions = null` |
| `subscribe(topic, this, handler)` | `unsubscribe(topic, this)` |
| `this.myMethod = myMethod.bind(this)` | `this.myMethod = null` |

---

## 고급 패턴

### 동적 Param 변경 패턴

**핵심 발견: Stop/Start 불필요!**

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

**패턴:**

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

**장점:**
- 독립적 주기 유지
- 즉시 반영
- 자동 업데이트

### YAGNI 원칙

"필요할 때 추가하라. 미리 추가하지 마라."

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

---

## 핵심 원칙

### 페이지 = 오케스트레이터

- 데이터 정의 (globalDataMappings)
- Interval 관리 (refreshIntervals)
- Param 관리 (currentParams)

### 컴포넌트 = 독립적 구독자

- 필요한 topic만 구독
- 데이터 렌더링만 집중
- 페이지의 내부 구조 몰라도 됨

### Topic 기반 pub-sub

- 중복 fetch 방지
- 여러 컴포넌트 공유 가능
- 느슨한 결합

### event vs targetInstance

사용자 이벤트 발생 시 두 가지 정보가 제공됩니다:

| 정보 타입 | event.target | targetInstance |
|-----------|--------------|----------------|
| 사용자 입력 | value, textContent | |
| DOM 속성 | dataset, classList | |
| 인스턴스 메타 | | id, name |
| 데이터셋 정보 | | datasetInfo |
| 인스턴스 메소드 | | showDetail(), etc. |

> 상호보완적: 두 가지가 서로 다른 정보를 제공하여 완전한 컨텍스트 구성

---

## Default JS 템플릿

새 컴포넌트/페이지 생성 시 복사하여 시작하는 기본 스크립트 구조

### 개요

Default JS는 프로젝트 패턴을 따르는 시작점 코드입니다.
퍼블리싱(HTML/CSS) 완료 후, 이 템플릿을 복사하여 사용자 정의 로직을 추가합니다.

```
Figma 디자인
    ↓
HTML/CSS 퍼블리싱 (컴포넌트 구조에 맞춤)
    ↓
Default JS 적용 ← 이 문서
    ↓
사용자 정의 메소드 + 이벤트 핸들러 구현
```

### 1. 컴포넌트 Default JS

#### register.js

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    // topic: ['핸들러명']
};

// 핸들러 바인딩
// this.renderData = renderData.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    // click: {
    //     '.my-button': '@myButtonClicked'
    // }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

// function renderData(response) {
//     const { data } = response;
//     if (!data) return;
//
//     // 렌더링 로직
// }
```

#### destroy.js

```javascript
const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTION CLEANUP
// ======================

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// ======================
// EVENT CLEANUP
// ======================

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// ======================
// HANDLER CLEANUP
// ======================

// this.renderData = null;
```

### 2. 3D 컴포넌트 Default JS

#### register.js

```javascript
const { bind3DEvents } = WKit;

// ======================
// 3D EVENT BINDING
// ======================

this.customEvents = {
    click: '@3dObjectClicked'
    // mousemove: '@3dObjectHovered'
};

// Data source info (상호작용 시 데이터 필요한 경우)
// 배열 형태로 정의 (다중 데이터셋 지원)
this.datasetInfo = [
    {
        datasetName: 'myDataset',
        param: {
            type: 'geometry',
            id: this.id
        }
    }
];

bind3DEvents(this, this.customEvents);
```

> **Note:** 3D 컴포넌트의 정리
> - 3D 리소스: 페이지 `before_unload.js`의 `disposeAllThreeResources()`에서 일괄 정리
>   - subscriptions 해제
>   - customEvents, datasetInfo 참조 제거
>   - geometry, material, texture dispose
> - DOM 리소스: 자기완결 컴포넌트(Shadow DOM 팝업 등)는 `destroy.js`에서 직접 정리
>   - `this.destroyPopup()` 등 컴포넌트가 생성한 DOM 리소스 정리

### 3. 페이지 Default JS

#### before_load.js

```javascript
const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    // '@itemClicked': async ({ event, targetInstance }) => {
    //     const { datasetInfo } = targetInstance;
    //     if (datasetInfo?.length) {
    //         for (const { datasetName, param } of datasetInfo) {
    //             const data = await fetchData(this, datasetName, param);
    //             // 데이터 처리
    //         }
    //     }
    // },

    // 샘플: Param 업데이트 패턴
    // '@filterChanged': ({ event }) => {
    //     const filter = event.target.value;
    //     this.currentParams['myTopic'] = {
    //         ...this.currentParams['myTopic'],
    //         filter
    //     };
    //     GlobalDataPublisher.fetchAndPublish('myTopic', this, this.currentParams['myTopic']);
    // }
};

onEventBusHandlers(this.eventBusHandlers);
```

#### loaded.js

```javascript
const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.globalDataMappings = [
    // {
    //     topic: 'myTopic',
    //     datasetInfo: {
    //         datasetName: 'myapi',
    //         param: { endpoint: '/api/data' }
    //     },
    //     refreshInterval: 5000  // 없으면 한 번만 fetch
    // }
];

// ======================
// PARAM MANAGEMENT
// ======================

this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => this.currentParams[topic] = {}),
    each(({ topic }) =>
        GlobalDataPublisher.fetchAndPublish(topic, this)
            .catch(err => console.error(`[fetchAndPublish:${topic}]`, err))
    )
);

// ======================
// INTERVAL MANAGEMENT
// ======================

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
                    ).catch(err => console.error(`[fetchAndPublish:${topic}]`, err));
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

#### before_unload.js

```javascript
const { offEventBusHandlers } = WKit;
const { each } = fx;

// ======================
// EVENT BUS CLEANUP
// ======================

offEventBusHandlers.call(this, this.eventBusHandlers);
this.eventBusHandlers = null;

// ======================
// DATA PUBLISHER CLEANUP
// ======================

fx.go(
    this.globalDataMappings,
    each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
);

this.globalDataMappings = null;
this.currentParams = null;

// ======================
// INTERVAL CLEANUP
// ======================

if (this.stopAllIntervals) {
    this.stopAllIntervals();
}
this.refreshIntervals = null;
```

### 4. 페이지 3D Default JS (추가 섹션)

3D 컴포넌트가 있는 페이지는 위 페이지 Default JS에 아래 내용을 추가합니다.

#### before_load.js 추가

```javascript
const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS (3D 핸들러 추가)
// ======================

this.eventBusHandlers = {
    // ... 기존 핸들러 ...

    // 3D 객체 클릭 핸들러
    '@3dObjectClicked': async ({ event, targetInstance }) => {
        console.log('Clicked 3D object:', event.intersects[0]?.object);

        const { datasetInfo } = targetInstance;
        if (datasetInfo?.length) {
            // 배열 순회 (다중 데이터셋 지원)
            for (const { datasetName, param } of datasetInfo) {
                const data = await fetchData(this, datasetName, param);
                console.log('3D object data:', data);
            }
        }
    }
};

onEventBusHandlers(this.eventBusHandlers);

// ======================
// 3D RAYCASTING SETUP
// ======================

const { withSelector } = WKit;

this.raycastingEvents = withSelector(this.element, 'canvas', canvas =>
    fx.go(
        [
            { type: 'click' }
            // { type: 'mousemove' },
            // { type: 'dblclick' }
        ],
        fx.map(event => ({
            ...event,
            handler: initThreeRaycasting(canvas, event.type)
        }))
    )
);
```

#### before_unload.js 추가

```javascript
const { disposeAllThreeResources } = WKit;
const { each } = fx;

// ... 기존 cleanup 코드 ...

// ======================
// 3D RAYCASTING CLEANUP
// ======================

const { withSelector } = WKit;

withSelector(this.element, 'canvas', canvas => {
    if (this.raycastingEvents) {
        fx.go(
            this.raycastingEvents,
            each(({ type, handler }) => canvas.removeEventListener(type, handler))
        );
        this.raycastingEvents = null;
    }
});

// ======================
// 3D RESOURCES CLEANUP
// ======================

// 한 줄로 모든 3D 컴포넌트 정리:
// - subscriptions 해제
// - customEvents, datasetInfo 참조 제거
// - geometry, material, texture dispose
// - Scene background 정리
disposeAllThreeResources(this);
```

---

## Functional Component Pattern

자기 완결 컴포넌트(Self-Contained Component) 개발 패턴 가이드입니다.

> **Note:** 이 문서는 3D + Popup + Chart 컴포넌트(TemperatureSensor) 예시를 기반으로 작성되었습니다.
> 다른 유형의 컴포넌트에는 일부 패턴이 적용되지 않을 수 있습니다.

참조:
- [Projects/IPSILON_3D](Projects/IPSILON_3D/)
- [Utils/Mixin.js](Utils/Mixin.js)

### 핵심 개념

**자기 완결 컴포넌트:** 데이터 fetch, 렌더링, 이벤트, UI(팝업)를 모두 내부에서 관리하는 컴포넌트

```
┌─────────────────────────────────────────────────────────────────────┐
│  Self-Contained Component                                            │
│                                                                      │
│  - datasetInfo: 데이터 정의 (무엇을 fetch하고 어떻게 render할지)        │
│  - Config: API 필드 매핑 + 스타일 설정                                │
│  - Public Methods: Page에서 호출 (showDetail, hideDetail)            │
│  - customEvents: 3D 이벤트 발행 (@sensorClicked)                     │
│  - Popup: Shadow DOM 기반 UI (오버라이드 가능)                        │
└─────────────────────────────────────────────────────────────────────┘
```

### register.js 구조

#### 섹션 순서 (권장)

```javascript
/*
 * ComponentName - Self-Contained 3D Component
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의
 * 2. Data Config - API 필드 매핑
 * 3. 렌더링 함수 바인딩
 * 4. Public Methods - Page에서 호출
 * 5. customEvents - 이벤트 발행
 * 6. Template Config - 사용할 template ID 설정
 * 7. Popup - template 기반 Shadow DOM 팝업
 */
```

> 순서 원칙: 비즈니스 로직(1~4) → 프레임워크 통합(5~7)

#### 1. datasetInfo - 데이터 정의

```javascript
this.datasetInfo = [
    { datasetName: 'sensor', param: { id: this.id }, render: ['renderSensorInfo'] },
    { datasetName: 'sensorHistory', param: { id: this.id }, render: ['renderChart'] }
];
```

| 필드 | 역할 |
|------|------|
| datasetName | datasetList.json의 키 |
| param | API 호출 파라미터 |
| render | 데이터 수신 후 호출할 렌더 함수 배열 |

> render가 배열인 이유: 하나의 데이터로 여러 렌더링 가능 (예: 요약 + 상세)

#### 2. Data Config - API 필드 매핑

**Config 분리 패턴:**

```javascript
// 공통: 자산 기본 정보
this.baseInfoConfig = [
    { key: 'name', selector: '.sensor-name' },
    { key: 'zone', selector: '.sensor-zone' },
    { key: 'status', selector: '.sensor-status', dataAttr: 'status' }
];

// 도메인 특화: 센서 측정값
this.sensorInfoConfig = [
    { key: 'temperature', selector: '.sensor-temp' },
    { key: 'humidity', selector: '.sensor-humidity' }
];

// 차트: 통합 config + optionBuilder 주입
this.chartConfig = {
    xKey: 'timestamps',
    series: [
        { yKey: 'temperatures', color: '#3b82f6', smooth: true, areaStyle: true }
    ],
    optionBuilder: getLineChartOption  // line/bar/pie 등 주입 가능
};
```

**핵심 원칙:**

| 항목 | 역할 | 위치 |
|------|------|------|
| key | Raw API 필드명 | Config |
| selector | DOM 선택자 | Config |
| dataAttr | data-* 속성 (CSS 선택자용) | Config |
| optionBuilder | 차트 타입별 옵션 생성 함수 | Config |
| 데이터 포맷팅 | 서버 책임 (°C, % 붙이지 않음) | |

#### 3. 렌더링 함수 바인딩

```javascript
// Config 병합 후 바인딩
this.renderSensorInfo = renderSensorInfo.bind(this, [...this.baseInfoConfig, ...this.sensorInfoConfig]);
this.renderChart = renderChart.bind(this, this.chartConfig);
```

> 패턴: `함수.bind(this, config)` → config가 첫 번째 인자로 고정

**renderSensorInfo 구현 (fx.go 패턴):**

```javascript
function renderSensorInfo(config, data) {
    fx.go(
        config,
        fx.each(({ key, selector, dataAttr }) => {
            const el = this.popupQuery(selector);
            el.textContent = data[key];
            dataAttr && (el.dataset[dataAttr] = data[key]);
        })
    );
}
```

**renderChart 구현 (optionBuilder 주입):**

```javascript
function renderChart(config, data) {
    const { optionBuilder, ...chartConfig } = config;
    const option = optionBuilder(chartConfig, data);
    this.updateChart('.chart-container', option);
}
```

#### 4. Public Methods

```javascript
this.showDetail = showDetail.bind(this);
this.hideDetail = hideDetail.bind(this);
```

**showDetail 구현 (fx.go 패턴):**

```javascript
function showDetail() {
    this.showPopup();
    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, param, render }) =>
            fx.go(
                fetchData(this.page, datasetName, param),
                result => result?.response?.data,
                data => data && render.forEach(fn => this[fn](data))
            )
        )
    );
}
```

> fx.go 비동기 처리: fx.go는 내부적으로 Promise를 자동 처리 (`acc.then(recur)`)

#### 5. customEvents - 이벤트 발행

```javascript
this.customEvents = {
    click: '@sensorClicked'
};

bind3DEvents(this, this.customEvents);
```

#### 6. Template Data - HTML/CSS 데이터

**3D 컴포넌트의 HTML/CSS 활용 방식:**

| 구분 | DOM 컴포넌트 (2D) | 3D 컴포넌트 |
|------|-------------------|-------------|
| htmlCode 용도 | element.innerHTML 직접 렌더링 | `<template>` 정의 저장소 |
| cssCode 용도 | 요소 스타일링 | Shadow DOM 팝업 스타일 |
| 렌더링 방식 | DOM에 바로 삽입 | JS에서 template 추출 → Shadow DOM 팝업 |
| 데이터 출처 | this.properties.publishCode | this.properties.publishCode |

**publishCode 구조 (front 프로젝트 3D 컴포넌트):**

```javascript
// WV3DPropertyManager.attach_default_component_infos()에서 정의
publishCode: {
    htmlCode: '',  // <template> 태그들 포함
    cssCode: '',   // Shadow DOM 내부 스타일
},
info: {
    componentName: 'ComponentName',
    componentType: 'htmlCssJsEditable',  // 에디터에서 HTML/CSS 편집 활성화
    version: '174.0',
},
```

**Template 구조 (에디터에서 htmlCode에 입력):**

```html
<template id="popup-sensor">
    <div class="popup-overlay">
        <div class="popup">...</div>
    </div>
</template>

<template id="tooltip-info">
    <div class="tooltip">...</div>
</template>
```

**extractTemplate Helper:**

```javascript
function extractTemplate(htmlCode, templateId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const template = doc.querySelector(`template#${templateId}`);
    return template?.innerHTML || '';
}
```

**Template Config:**

```javascript
this.templateConfig = {
    popup: 'popup-sensor',      // 팝업용 template ID
    // tooltip: 'tooltip-info', // 향후 확장
};
```

#### 7. Popup - template 기반 Shadow DOM 팝업

**적용:**

```javascript
this.popupCreatedConfig = {
    chartSelector: '.chart-container',
    events: {
        click: {
            '.close-btn': () => this.hideDetail()
        }
    }
};

// publishCode에서 HTML/CSS 가져오기
const { htmlCode, cssCode } = this.properties.publishCode || {};
this.getPopupHTML = () => extractTemplate(htmlCode || '', this.templateConfig.popup);
this.getPopupStyles = () => cssCode || '';
this.onPopupCreated = onPopupCreated.bind(this, this.popupCreatedConfig);

applyShadowPopupMixin(this, {
    getHTML: this.getPopupHTML,
    getStyles: this.getPopupStyles,
    onCreated: this.onPopupCreated
});
```

**데이터 흐름:**

```
에디터에서 HTML/CSS 입력
    ↓
publishCode: { htmlCode, cssCode }에 저장
    ↓
3D 컴포넌트 register.js에서 this.properties.publishCode로 접근
    ↓
extractTemplate()로 template ID에 해당하는 HTML 추출
    ↓
Shadow DOM 팝업에 적용
```

**applyShadowPopupMixin 제공 메서드:**

| 메서드 | 역할 |
|--------|------|
| showPopup() | 팝업 표시 (없으면 생성) |
| hidePopup() | 팝업 숨김 |
| popupQuery(selector) | Shadow DOM 내부 요소 선택 |
| bindPopupEvents(events) | 이벤트 델리게이션 바인딩 |
| createChart(selector) | ECharts 인스턴스 생성 |
| updateChart(selector, option) | 차트 옵션 업데이트 |
| destroyPopup() | 리소스 정리 |

**onPopupCreated 구현:**

```javascript
function onPopupCreated({ chartSelector, events }) {
    chartSelector && this.createChart(chartSelector);
    events && this.bindPopupEvents(events);
}
```

### destroy.js

```javascript
function onInstanceUnLoad() {
    this.destroyPopup();  // Shadow DOM + 차트 + 이벤트 정리
    console.log('[ComponentName] Destroyed:', this.id);
}
```

> 3D 이벤트 정리: Page의 `disposeAllThreeResources` → `dispose3DTree`에서 자동 처리

### Config 오버라이드

모든 config가 `this.`에 바인딩되어 있어 외부에서 오버라이드 가능:

```javascript
// Page에서 특정 인스턴스의 차트 색상 변경
const sensor = this.getComponentById('sensor-001');
sensor.chartStyleConfig.color = '#ff0000';
```

### 전체 예제: TemperatureSensor

```
TemperatureSensor/
├── scripts/
│   ├── register.js    # 초기화 + 메서드 정의
│   └── destroy.js     # 정리
└── (views, styles는 applyShadowPopupMixin 내부에서 getPopupHTML/getPopupStyles로 제공)
```

**특징:**
- 3D 오브젝트 클릭 → `showDetail()` → Shadow DOM 팝업 표시
- 팝업 내 ECharts 차트 자동 관리
- 닫기 버튼 → `hideDetail()` → 팝업 숨김

**버전:** 1.2.0  
**작성일:** 2025-12-16  
**참조:** Utils/Mixin.js, Projects/IPSILON_3D/page/components/TemperatureSensor/

**변경 이력:**

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.2.0 | 2025-12-16 | publishCode 연동 완료 (임시 데이터 → 실제 데이터) |
| 1.1.0 | 2025-12-16 | Template 기반 구조 반영 |
| 1.0.0 | 2025-12-15 | 초기 작성 |

---

## fx.go 기반 에러 핸들링 가이드

### 목적

이 문서는 fx.go / reduce 기반 파이프라인에서 에러가 어떻게 전파되고, 어디에서 처리해야 하는지를 명확히 정의한다.

### 1. 기본 원칙

#### 1.1 유틸은 에러를 처리하지 않는다

fx.go, reduce, reduceF 등 유틸 레벨에서는 에러를 복구하지 않는다.

에러를 삼키지 않고 그대로 전파한다.

유틸의 책임은 다음 두 가지뿐이다:
- 정상 값은 다음 단계로 전달
- 에러는 호출자에게 전파

> 재시도, fallback, 사용자 알림, 로그 레벨 등은 도메인 컨텍스트를 아는 호출자의 책임이다.

#### 1.2 호출자는 반드시 에러를 처리한다

`fx.go(...)`는 실패 시 rejected Promise를 반환할 수 있다.

모든 호출부는 반드시 다음 중 하나로 에러를 처리해야 한다:
- async / await + try-catch
- `.catch(...)`

```javascript
// async / await
try {
  await fx.go(...);
} catch (e) {
  // 도메인별 처리
}

// Promise 체인
fx.go(...)
  .catch(e => {
    // 도메인별 처리
  });
```

### 2. fx.go 파이프라인의 내부 동작 (이해를 위한 설명)

#### 2.1 fx.go는 reduce 기반 파이프라인

```javascript
const go = (...args) => reduce((a, f) => f(a), args);
```

- 각 함수의 반환값이 다음 함수의 입력이 된다
- Promise가 반환되면 비동기 파이프라인으로 연결된다

#### 2.2 비동기 처리의 핵심: reduceF

```javascript
const reduceF = (acc, a, f) =>
  a instanceof Promise
    ? a.then(
        a => f(acc, a),
        e => e == nop ? acc : Promise.reject(e)
      )
    : f(acc, a);
```

**의미 정리:**

| 구분 | 설명 |
|------|------|
| nop | 필터(L.filter) 전용 내부 시그널. "조건 불충족 → 스킵"을 표현. 에러가 아님. 순회를 계속하기 위해 acc를 그대로 반환 |
| 진짜 에러 | `Promise.reject(e)`로 그대로 전파. 복구하지 않음 |

> reduceF는 에러를 처리하지 않는다. nop만 예외적으로 스킵을 위해 복구한다.

#### 2.3 순회가 중단되는 이유 (fail-fast 동작)

reduce는 acc가 Promise일 경우 다음과 같이 동작한다:

```javascript
return acc.then(recur);
```

그러나 acc가 rejected Promise이면:
- `then(recur)`의 recur는 실행되지 않는다
- rejected 상태가 그대로 반환된다

**결과적으로:**
- 다음 함수 적용 ❌
- 순회 중단
- 최종적으로 fx.go는 rejected Promise를 반환

> reduce는 내부에서 catch를 하지 않기 때문에 기본 동작은 fail-fast이다.

### 3. nop의 정확한 역할

nop은 오직 필터를 구현하기 위한 내부 메커니즘이다.

목적은 비동기 조건식에서 "false → 스킵"을 표현하는 것이다.

**특징:**
- 진짜 에러 ❌
- 외부에서 처리 대상 ❌
- reduceF에서만 특별 취급

```javascript
e => e == nop ? acc : Promise.reject(e)
```

### 4. catch 위치와 파이프라인 의미

#### 4.1 중요한 구분

- 파이프라인의 정상 흐름의 의미는 함수 구성으로 결정된다
- catch의 위치는 에러 발생 시의 동작 방식을 결정한다

> **파이프라인의 정상 흐름은 함수 구성으로,**
> **파이프라인의 에러 처리 전략은 catch를 어디에 두느냐로 결정된다.**

#### 4.2 파이프라인 중간 catch (주의)

```javascript
fx.go(
  items,
  fx.each(item =>
    fx.go(fetchData(item), process)
      .catch(err => {
        console.error(err);
        // 반환값 없음 → resolved(undefined)
      })
  )
);
```

- 진짜 에러가 fulfilled 값으로 변환됨
- 파이프라인은 "성공"으로 인식하고 계속 진행
- 의도하지 않으면 버그의 원인이 됨

#### 4.3 기본 패턴: 파이프라인 끝에서 catch

```javascript
fx.go(
  items,
  fx.each(item =>
    fx.go(fetchData(item), process)
  )
).catch(e => {
  console.error('[Component]', e);
  // 상태 복구 / 에러 UI / 중단 처리
});
```

- 에러는 끝까지 전파된다
- 한 지점에서 일관되게 처리한다
- 기본값으로 권장되는 패턴이다

#### 4.4 예외: 부분 실패를 허용하는 경우

일부 실패를 허용해야 하는 도메인에서는 의도적으로 중간 catch를 사용할 수 있다.

단, 반드시 명시적인 대체값을 반환해야 한다:

```javascript
.catch(e => ({
  ok: false,
  error: e
}));
```

> 에러를 삼키는 것이 아니라 의미 있는 값으로 변환하는 것이다.

### 5. interval / 이벤트 핸들러

이 컨텍스트에서는 최상단 catch가 필수다.

목적은 unhandled rejection 방지다.

```javascript
const run = () =>
  GlobalDataPublisher.fetchAndPublish(topic, page, params)
    .catch(e => {
      console.error(`[fetchAndPublish:${topic}]`, e);
      // 재시도 / 백오프 / 사용자 알림 등
    });

setInterval(run, refreshMs);
run();
```

### 6. 체크리스트

- [ ] 모든 fx.go 호출부에 try-catch 또는 `.catch()`가 있는가?
- [ ] 파이프라인 중간 catch가 의도적인 복구인가?
- [ ] catch에서 반환값이 명확한가?
- [ ] nop을 진짜 에러 처리와 혼동하지 않았는가?
- [ ] interval / 이벤트 핸들러에 catch가 있는가?

### 핵심 요약

1. fx.go는 에러를 처리하지 않고 전파한다
2. reduceF는 nop만 복구하고 진짜 에러는 fail-fast로 중단시킨다
3. 파이프라인의 정상 흐름은 함수 구성으로 결정된다
4. 에러 처리 전략은 catch 위치로 결정된다

---

## Component Structure Guide

컴포넌트 자산을 쌓기 위한 구조 가이드입니다.

### 핵심 원칙

#### Figma 선택 요소 = 컨테이너

```
┌─────────────────────────────────────────────────────────────────────┐
│  Figma 링크 제공 = 컴포넌트 단위 선택                                  │
│                                                                      │
│  사용자가 Figma 링크를 제공하면:                                       │
│  - 선택된 요소의 가장 바깥 = div 컨테이너                              │
│  - 선택된 요소의 크기 = 컨테이너 크기                                  │
│  - 내부 요소 = innerHTML (Figma 스타일 그대로)                        │
└─────────────────────────────────────────────────────────────────────┘
```

```html
<div id="component-container">       <!-- Figma 선택 요소 크기 -->
    <div class="transaction-table">  <!-- Figma 내부 요소 (스타일 그대로) -->
        ...
    </div>
</div>
```

### 웹 빌더 기본 구조

웹 빌더는 컴포넌트마다 div 컨테이너를 기본 단위로 가집니다.

웹 빌더에서 컴포넌트를 배치하면:

```html
<div id="component-xxx">   ← 웹 빌더가 자동 생성하는 컨테이너
    <!-- innerHTML -->     ← 사용자 정의 내용
</div>
```

따라서 Figma 선택 요소의 크기가 곧 컨테이너 크기가 되어야 스타일링이 그대로 유지됩니다.

### 컨테이너 크기 규칙

**컨테이너 크기 = Figma 선택 요소 크기**

```css
/* Container: Figma 선택 요소 크기 */
#component-container {
    width: 524px;   /* Figma 선택 요소 width */
    height: 350px;  /* Figma 선택 요소 height */
    overflow: auto; /* 동적 렌더링 대응 */
}
```

- Figma에서 선택한 요소의 크기가 곧 컨테이너 크기
- 레이아웃 조립 시 크기 조정은 에디터가 담당
- preview.html은 Figma 크기로 디자인 검증 목적

### 설계 철학

#### Figma 스타일 그대로 유지

- 컨테이너 크기 = Figma 선택 요소 크기
- 내부 요소 스타일 = Figma에서 추출한 그대로
- 임의로 `width: 100%`, `height: 100%`로 변경하지 않음

#### 박스 단위 조합

컨테이너가 있으면 조합이 단순해집니다:

```html
<!-- 컨테이너 없이 -->
<button>Click</button>
<!-- 조합 시 버튼 자체 스타일이 레이아웃에 간섭 -->

<!-- 컨테이너 있음 -->
<div class="button-container">
    <button>Click</button>
</div>
<!-- 박스끼리 조합 → 내부는 신경 안 써도 됨 -->
```

- 외부에서 보면: 그냥 박스
- 내부에서 보면: 버튼이든 테이블이든 상관없음
- 조합하는 쪽에서 내부 구현을 알 필요 없음

#### CSS Box Model과의 일관성

- 컨테이너 = Containing Block 역할
- 컨테이너가 명시적 크기를 가지므로 레이아웃 예측 가능
- `overflow: auto`로 동적 콘텐츠 대응

### 런타임 동작

현재 런타임 애플리케이션에서:

```
사용자가 컴포넌트 HTML 작성
    ↓
container.innerHTML = 사용자 정의 HTML
    ↓
외부에서 보면 container 하나
```

- 사용자가 컴포넌트 단위로 HTML을 작성
- HTML이 컨테이너의 innerHTML로 포함됨
- 사용자 정의 HTML이 얼마나 복잡하든, 외부에서는 container 하나로 취급

### 파일 구성

하나의 컴포넌트는 다음 구조로 구성됩니다:

```
ComponentName/
├─ views/component.html       # 내부 요소 HTML
├─ styles/component.css       # 내부 요소 스타일
├─ scripts/
│   ├─ register.js            # 초기화 로직
│   └─ destroy.js             # 정리 로직
└─ preview.html               # 독립 테스트
```

| 파일 | 역할 |
|------|------|
| views/component.html | 내부 요소 HTML |
| styles/component.css | 내부 요소 스타일 |
| scripts/register.js | 초기화 로직 |
| scripts/destroy.js | 정리 로직 |
| preview.html | 독립 테스트용 |

> **Note:** 컴포넌트 폴더명이 이미 ComponentName이므로 내부 파일명에 중복 불필요

### 컴포넌트 템플릿

#### HTML (views/component.html)

```html
<div class="component-name">
    <!-- Figma 내부 구조 그대로 -->
</div>
```

#### CSS (styles/component.css)

```css
/* 컨테이너 ID 중심 nesting 구조 */
#component-id {
    .component-name {
        /* Figma에서 추출한 스타일 그대로 적용 */
        display: flex;
        flex-direction: column;
        /* ... */
    }
}
```

#### Preview (preview.html)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Container: Figma 선택 요소 크기 */
        #component-container {
            width: 524px;   /* Figma 크기 */
            height: 350px;
            overflow: auto;
        }

        /* Component CSS - Figma 스타일 그대로 */
        #component-container {
            .component-name {
                /* Figma에서 추출한 스타일 그대로 */
            }
        }
    </style>
</head>
<body>
    <!-- 컴포넌트만 배치 (page-root 없이) -->
    <div id="component-container">
        <div class="component-name">
            ...
        </div>
    </div>
</body>
</html>
```

### 트레이드오프

#### 장점

- **디자인 일관성:** Figma 스타일을 그대로 유지
- **독립성:** 각 컴포넌트가 자신의 경계 안에서 완결됨
- **조합성:** 컨테이너 크기만 조정하면 어떤 레이아웃에도 배치 가능
- **예측 가능성:** 일관된 구조로 유지보수 용이
- **캡슐화:** 내부 복잡도가 외부에 노출되지 않음

#### 단점

- **DOM 깊이 증가:** 모든 컴포넌트마다 컨테이너 div 추가
- **단순 컴포넌트 오버헤드:** 아이콘 하나도 컨테이너 필요

### 결론

비주얼 빌더에서는 Figma 스타일 유지와 예측 가능한 구조의 가치가 트레이드오프보다 큽니다.
일관된 구조를 유지하면 컴포넌트를 자산으로 쌓을 수 있습니다.