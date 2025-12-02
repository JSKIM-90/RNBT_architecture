# Default JS 템플릿

새 컴포넌트/페이지 생성 시 복사하여 시작하는 기본 스크립트 구조

---

## 개요

Default JS는 프로젝트 패턴을 따르는 **시작점 코드**입니다.
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

---

## 1. 컴포넌트 Default JS

### register.js

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

### destroy.js

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

---

## 2. 3D 컴포넌트 Default JS

### register.js

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
this.datasetInfo = {
    datasetName: 'myDataset',
    param: {
        type: 'geometry',
        id: this.id
    }
};

bind3DEvents(this, this.customEvents);
```

> **Note**: 3D 컴포넌트는 destroy.js가 없습니다.
> 페이지 `before_unload.js`의 `disposeAllThreeResources()`에서 일괄 정리됩니다.
> - subscriptions 해제
> - customEvents, datasetInfo 참조 제거
> - 3D 리소스 dispose (geometry, material, texture)

---

## 3. 페이지 Default JS

### before_load.js

```javascript
const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    // '@itemClicked': async ({ event, targetInstance }) => {
    //     const { datasetInfo } = targetInstance;
    //     if (datasetInfo) {
    //         const { datasetName, param } = datasetInfo;
    //         const data = await fetchData(this, datasetName, param);
    //         // 데이터 처리
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

### loaded.js

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
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
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

### before_unload.js

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

---

## 4. 페이지 3D Default JS (추가 섹션)

3D 컴포넌트가 있는 페이지는 위 페이지 Default JS에 아래 내용을 **추가**합니다.

### before_load.js 추가

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
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            console.log('3D object data:', data);
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

### before_unload.js 추가

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

## 5. Master common_component Default JS

Master 레이어에서는 `common_component`가 페이지 스크립트 역할을 대체합니다.

| Page 라이프사이클 | Master common_component |
|------------------|------------------------|
| before_load.js | register.js |
| loaded.js | completed.js |
| before_unload.js | destroy.js |

### register.js

```javascript
const { onEventBusHandlers } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // Master 레벨 이벤트 핸들러
};

onEventBusHandlers(this.eventBusHandlers);
```

### completed.js

```javascript
const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.globalDataMappings = [
    // Master용 데이터 매핑
];

this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => this.currentParams[topic] = {}),
    // 주의: this.page 사용!
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this.page))
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
                        this.page,  // 주의: this.page 사용!
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

### destroy.js

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

---

## 사용법

### 1. 새 컴포넌트 생성

```bash
# 1. 퍼블리싱 파일 준비
views/MyComponent.html
styles/MyComponent.css

# 2. Default JS 복사
components/MyComponent_register.js  ← 위 템플릿 복사
components/MyComponent_destroy.js   ← 위 템플릿 복사

# 3. 사용자 정의 추가
- subscriptions에 topic 추가
- customEvents에 이벤트 추가
- 렌더링 함수 구현
```

### 2. 새 페이지 생성

```bash
# 1. Default JS 복사
page_scripts/before_load.js   ← 위 템플릿 복사
page_scripts/loaded.js        ← 위 템플릿 복사
page_scripts/before_unload.js ← 위 템플릿 복사

# 2. 사용자 정의 추가
- eventBusHandlers에 핸들러 추가
- globalDataMappings에 데이터 매핑 추가
```

---

## 확장 예시

### 구독 추가

```javascript
// Before (Default)
this.subscriptions = {};

// After (사용자 정의)
this.subscriptions = {
    users: ['renderUserTable', 'updateUserCount'],
    products: ['renderProductList']
};

this.renderUserTable = renderUserTable.bind(this);
this.updateUserCount = updateUserCount.bind(this);
this.renderProductList = renderProductList.bind(this);
```

### 이벤트 추가

```javascript
// Before (Default)
this.customEvents = {};

// After (사용자 정의)
this.customEvents = {
    click: {
        '.add-button': '@addButtonClicked',
        '.delete-button': '@deleteButtonClicked'
    },
    change: {
        '.filter-select': '@filterChanged'
    }
};
```

---

## 관련 문서

- [`COMPONENT_STRUCTURE.md`](COMPONENT_STRUCTURE.md) - 컴포넌트 구조 (컨테이너 + 내부 요소)
- [`PROJECT_TEMPLATE.md`](PROJECT_TEMPLATE.md) - 프로젝트 설계 패턴 상세
- [`CLAUDE.md`](CLAUDE.md) - 전체 프레임워크 설명

---

**버전**: 1.4.0
**작성일**: 2025-12-02
**변경사항**:
- v1.4.0: 3D 컴포넌트 destroy.js 제거 - `disposeAllThreeResources()`에서 일괄 정리
- v1.3.0: 문서 구조 재정리 - 섹션 번호 추가, 컴포넌트 destroy.js 위치 수정
- v1.2.0: `WKit.withSelector` 사용으로 변경 (선택자 외부 주입)
- v1.1.0: 3D Raycasting 설정에 Higher-Order Function 패턴 적용
