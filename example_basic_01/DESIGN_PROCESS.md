# 폴링 기반 다중 갱신 주기 대시보드 패턴

런타임 프레임워크의 폴링 기반 대시보드 패턴을 검증하기 위한 IoT 예제

---

## 목표

**핵심 검증 사항**:
- **폴링 기반** 다중 갱신 주기 패턴 (5초/15초/60초)
- Topic 기반 pub-sub으로 중복 fetch 방지
- 페이지 레벨 interval 관리
- 동적 param 업데이트 (interval 재시작 불필요)
- 2D/3D 이벤트 바인딩 패턴
- 컴포넌트 독립성 유지
- 템플릿 기반 개발 용이성

**명시적 범위 한정**:
- ✅ 읽기 중심 대시보드 (데이터 표시)
- ✅ 폴링 방식 (setInterval 기반)
- ❌ 쓰기 패턴 (데이터 변경) - 범위 외
- ❌ WebSocket/SSE (실시간 push) - 범위 외

**추후 추가 필요**:
- ⏳ 에러 처리 (fetch 실패 시 UI 상태 표시)

---

## 설계 철학

### Primitive Building Blocks 원칙

프레임워크는 최소한의 primitive만 제공하고, 조합은 사용자에게 맡긴다.

**프레임워크가 제공하는 것**:
- ✅ `WKit.fetchData(page, datasetName, param)` - 데이터 fetch
- ✅ `WKit.getInstanceByName(name, iter)` - 인스턴스 검색
- ✅ `GlobalDataPublisher.fetchAndPublish(topic, page)` - 데이터 발행

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

## 시나리오 구상

### 선택한 도메인: 스마트 팩토리 환경 모니터링

**배경**: 공장 내 여러 구역에 설치된 센서들을 모니터링하고 관리하는 대시보드

### 데이터 카테고리 (갱신 주기별)

#### 🔴 초단위 실시간 (3-5초)
- 센서 실시간 값: 온도, 습도, 압력, CO2 농도
- 긴급 알림: 임계치 초과 경고

#### 🟡 단기 갱신 (10-15초)
- 디바이스 상태: 온라인/오프라인, 배터리 레벨, 신호 강도
- 최근 이벤트 로그: 최근 30분 이벤트

#### 🟢 중기 갱신 (30-60초)
- 시간별 트렌드: 지난 24시간 센서 데이터 차트
- 구역별 통계: 평균, 최대, 최소값

#### ⚪ 정적/수동 갱신
- 디바이스 목록: 등록된 모든 센서 목록
- 설정 정보: 임계치, 알림 규칙

### 컴포넌트 구성안

```
Dashboard Layout
├─ Header
│  └─ SystemStatus (🟡 디바이스 상태 요약)
│
├─ Left Panel
│  ├─ DeviceList (⚪ 디바이스 목록)
│  └─ AlertPanel (🔴 긴급 알림)
│
├─ Main Area
│  ├─ SensorGrid (🔴 실시간 센서 값 - 카드 형태)
│  └─ TrendChart (🟢 시간별 트렌드 차트)
│
└─ Right Panel
   ├─ RecentEvents (🟡 최근 이벤트 로그)
   └─ ZoneStatistics (🟢 구역별 통계)
```

---

## API 서버 구축

### 필요성

데이터의 반복 갱신을 통해 화면을 효과적으로 업데이트하는 방법을 검증하기 위해서는 실제 데이터 소스가 필요합니다.

### 구현

**위치**: `IOT_API/` 폴더
**기술**: Node.js + Express
**포트**: 3000

**API 엔드포인트**:

```
/api/iot
├─ /realtime (3-5초 갱신)
│  ├─ GET /sensors/current        # 모든 센서 현재 값
│  └─ GET /alerts/active          # 활성 알림
│
├─ /shortterm (10-15초 갱신)
│  ├─ GET /devices/status         # 디바이스 상태
│  └─ GET /events/recent          # 최근 이벤트
│
├─ /midterm (30-60초 갱신)
│  ├─ GET /sensors/trend/24h      # 24시간 트렌드
│  └─ GET /zones/statistics       # 구역별 통계
│
└─ /static (초기 로드만)
   ├─ GET /devices/list           # 디바이스 목록
   └─ GET /settings/thresholds    # 임계치 설정
```

**데이터 특성**:
- 센서 타입: 온도, 습도, 압력, CO2 (각 4개씩, 총 16개)
- 구역: Zone A, B, C, D
- 랜덤 변동 + 트렌딩 패턴
- 임계치 기반 자동 알림 생성

---

## 페이지 라이프사이클 구현

### 5.1. page_before_load.js

**역할**: 컴포넌트 생성 전 초기 설정

**핵심 논리**:
> 컴포넌트는 독립적이고, 페이지에서 정의할 이벤트도 사용자 정의입니다.
> 이벤트가 정의될 영역을 빈 구조로 제공하고, 샘플로 패턴을 명시합니다.

**구현 특징**:
- ✅ 빈 구조 제공 (`this.eventBusHandlers = {}`)
- ✅ 샘플 하나로 패턴 명시
- ✅ Primitive 조합 방식 표현
- ✅ 선택적 기능은 주석 처리

**코드 예시**:
```javascript
const { onEventBusHandlers, fetchData } = WKit;

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    '@sensorClicked': async ({ event, targetInstance }) => {
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            // TODO: 데이터 처리
        }
    },

    // Param 업데이트 패턴 (아래 "고급 패턴" 섹션 참조)
    '@zoneFilterChanged': ({ event }) => {
        const zone = event.target.value;
        this.currentParams['sensorData'] = {
            ...this.currentParams['sensorData'],
            zone
        };
        GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);
    }
};

onEventBusHandlers(this.eventBusHandlers);

// 3D Raycasting 설정 (선택적)
const canvas = this.element.querySelector('canvas');
if (canvas) {
    this.raycastingEvents = [
        { type: 'click' }
        // { type: 'mousemove' },  // Add more events as needed
        // { type: 'dblclick' }
    ];

    fx.go(
        this.raycastingEvents,
        fx.each(event => {
            event.handler = initThreeRaycasting(canvas, event.type);
        })
    );
}
```

**3D Raycasting 패턴**:
- `raycastingEvents` 배열로 여러 이벤트 타입 관리 (globalDataMappings와 동일한 패턴)
- Canvas 요소를 직접 선택하여 정확한 좌표 계산
- `fx.go` 파이프라인으로 각 이벤트에 handler 등록
- 필요시 mousemove, dblclick 등 추가 가능

**주의**: 3D 이벤트도 결국 `WEventBus`를 통해 전달되므로, 핸들러 구조는 2D와 동일합니다.

---

### 5.2. page_loaded.js

**역할**: 모든 컴포넌트 completed 후 데이터 발행 및 갱신 관리

**핵심 논리**:
> 페이지는 컴포넌트가 공유할 데이터를 속성으로 정의하고,
> 구독자들에게 데이터를 전달합니다.
> 데이터마다 갱신 주기가 다를 수 있으므로 독립적인 interval을 관리합니다.

#### 데이터 매핑 정의

```javascript
this.globalDataMappings = [
    {
        topic: 'sensorData',
        datasetInfo: {
            datasetName: 'iotapi',
            param: { endpoint: '/api/iot/realtime/sensors/current' }
        },
        refreshInterval: 5000  // 5초 주기
    },
    {
        topic: 'deviceStatus',
        datasetInfo: {
            datasetName: 'iotapi',
            param: { endpoint: '/api/iot/shortterm/devices/status' }
        },
        refreshInterval: 15000  // 15초 주기
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

**목적**: 각 topic마다 독립적인 갱신 주기 유지

```javascript
this.startAllIntervals = () => {
    this.refreshIntervals = {};  // Interval ID 저장용

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    // currentParams 병합하여 호출 (참조!)
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

this.startAllIntervals();  // 실행
```

**핵심**: `currentParams`는 참조이므로 interval 재시작 불필요 (고급 패턴에서 상세 설명)

---

### 5.3. page_before_unload.js

**역할**: 페이지 종료 시 모든 리소스 정리

**핵심 논리**:
> 생성된 모든 리소스는 1:1 매칭으로 정리되어야 합니다.
> 메모리 누수 방지 및 브라우저 리소스 확보.

#### 정리 순서

```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);        // 1. Interval 먼저 중단 (새 요청 방지)
    clearEventBus.call(this);           // 2. EventBus 정리
    clearDataPublisher.call(this);      // 3. DataPublisher 정리
    clearThree.call(this);              // 4. Three.js 정리 (raycasting + 3D resources)
}
```

#### 1. Interval 정리

```javascript
function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();  // loaded에서 정의한 메서드 호출
    }
    this.refreshIntervals = null;
}
```

#### 2. EventBus 정리

```javascript
function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}
```

#### 3. DataPublisher 정리

```javascript
function clearDataPublisher() {
    go(
        this.globalDataMappings,
        each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
    );

    this.globalDataMappings = null;
    this.currentParams = null;
}
```

#### 4. Three.js 정리

```javascript
function clearThree() {
    const canvas = this.element.querySelector('canvas');

    if (canvas && this.raycastingEvents) {
        go(
            this.raycastingEvents,
            each(({ type, handler }) => {
                canvas.removeEventListener(type, handler);
            })
        );
        this.raycastingEvents = null;
    }

    // Dispose all 3D resources (components + scene background)
    disposeAllThreeResources(this);
}
```

**패턴**:
- **Raycasting 이벤트 정리**: Canvas의 모든 raycasting 이벤트 리스너 제거
- **3D 리소스 정리**: `WKit.disposeAllThreeResources(page)` 호출
  - 모든 3D 컴포넌트의 geometry, material, texture 정리
  - Scene background 정리
  - 한 줄로 모든 3D 리소스 정리 가능

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
| `this.raycastingEvents = [...]` | `this.raycastingEvents = null` |
| `canvas.addEventListener(...)` | `canvas.removeEventListener(...)` |
| 3D 컴포넌트 리소스 (컴포넌트가 생성) | `disposeAllThreeResources(this)` |

**1:1 매칭 확인**: ✅ 모든 생성된 리소스가 정리됨

---

## 컴포넌트 라이프사이클 패턴

컴포넌트는 **register**와 **destroy** 두 개의 라이프사이클 단계를 가집니다.
Runtime_Scaffold의 템플릿 패턴을 기반으로 빠르게 컴포넌트를 작성할 수 있습니다.

### 6.1. Register 패턴

#### 패턴 1: 2D 이벤트 바인딩

**용도**: 버튼 클릭, 폼 제출 등 일반적인 DOM 이벤트 처리

**코드 예시**:
```javascript
const { bindEvents } = WKit;

// Event schema - 셀렉터와 이벤트명 매핑
this.customEvents = {
    click: {
        '.my-button': '@buttonClicked',
        '.my-link': '@linkClicked'
    }
};

// Handler 메서드 바인딩 (optional - 페이지에서 처리하는 경우)
this.handleButtonClick = handleButtonClick.bind(this);
this.handleLinkClick = handleLinkClick.bind(this);

// 이벤트 바인딩
bindEvents(this, this.customEvents);

// Handler functions (optional)
function handleButtonClick(data) {
    console.log(`[Button Clicked] ${this.name}`, data);
}

function handleLinkClick(data) {
    console.log(`[Link Clicked] ${this.name}`, data);
}
```

**핵심 포인트**:
- ✅ **이벤트 위임 패턴**: 동적으로 생성되는 요소도 처리 가능
- ✅ **`@` 접두사**: 커스텀 이벤트 구분
- ✅ **페이지 핸들러**: 실제 처리 로직은 `page_before_load.js`의 `eventBusHandlers`에 정의
- ✅ **컴포넌트 독립성**: 컴포넌트는 이벤트 발행만, 처리는 페이지가 담당

---

#### 패턴 2: 3D 이벤트 바인딩

**용도**: Three.js 3D 객체 클릭, 호버 등 3D 인터랙션

**코드 예시**:
```javascript
const { bind3DEvents } = WKit;

// Event schema - 간단함!
this.customEvents = {
    click: '@3dObjectClicked'
};

// Data source info (선택사항 - 상호작용 시 데이터 필요한 경우)
this.datasetInfo = {
    datasetName: 'myDataset',
    param: {
        type: 'geometry',
        id: this.id  // 동적 ID
    }
};

// 3D 이벤트 바인딩
bind3DEvents(this, this.customEvents);
```

**핵심 포인트**:
- ✅ **Raycasting 자동**: 페이지의 `initThreeRaycasting`이 처리
- ✅ **appendElement.eventListener**: 컴포넌트 식별 메커니즘
- ✅ **datasetInfo 활용**: 페이지 핸들러에서 `WKit.fetchData`로 데이터 fetch 가능
- ✅ **단일 Canvas**: 모든 3D 컴포넌트가 하나의 Scene 공유

**2D vs 3D 비교**:
| 항목 | 2D 이벤트 | 3D 이벤트 |
|------|----------|----------|
| 바인딩 함수 | `bindEvents` | `bind3DEvents` |
| 이벤트 스키마 | `{ click: { '.selector': '@event' } }` | `{ click: '@event' }` |
| 타겟 식별 | CSS 셀렉터 | appendElement.eventListener |
| 데이터 소스 | datasetInfo (선택) | datasetInfo (선택) |

---

#### 패턴 3: GlobalDataPublisher 구독

**용도**: 페이지 레벨에서 발행하는 데이터를 구독하여 렌더링

**코드 예시**:
```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// Subscription schema - topic별 핸들러 배열
this.subscriptions = {
    users: ['renderUserTable', 'updateUserCount'],  // 한 topic에 여러 메서드!
    products: ['renderProductList']
};

// Handler 메서드 바인딩
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

    // Template 활용 렌더링
    const template = this.element.querySelector('#user-table-template');
    const container = this.element.querySelector('[data-table-container]');

    // data를 반복하여 렌더링...
}

function updateUserCount(data) {
    console.log(`[Update Count] ${this.name}`, data.length);

    // 뱃지 업데이트
    const badge = this.element.querySelector('[data-user-count]');
    if (badge) {
        badge.textContent = data.length;
        badge.dataset.count = data.length;
    }
}

function renderProductList(data) {
    console.log(`[Render Products] ${this.name}`, data);
    // Product list 렌더링...
}
```

**핵심 포인트**:
- ✅ **한 topic에 여러 핸들러**: 같은 데이터로 테이블 + 카운트 동시 업데이트
- ✅ **자동 업데이트**: 페이지의 interval이 데이터 발행하면 자동으로 핸들러 호출
- ✅ **독립성**: 컴포넌트는 데이터 출처를 몰라도 됨
- ✅ **재사용성**: 다른 페이지에서도 같은 topic 이름만 사용하면 동작

---

#### 패턴 조합: 이벤트 + 구독

**시나리오**: 사용자가 필터를 변경하면 새 데이터를 구독

```javascript
const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// 1. 이벤트 바인딩
this.customEvents = {
    change: {
        '.filter-select': '@filterChanged'
    }
};
bindEvents(this, this.customEvents);

// 2. 구독 설정
this.subscriptions = {
    filteredData: ['renderData']
};

this.renderData = renderData.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// 3. 핸들러
function renderData(data) {
    // 필터된 데이터로 렌더링
}
```

**페이지 연동**:
```javascript
// page_before_load.js
'@filterChanged': ({ event }) => {
    const filter = event.target.value;
    this.currentParams['filteredData'] = { filter };
    GlobalDataPublisher.fetchAndPublish('filteredData', this, this.currentParams['filteredData']);
}
```

---

### 6.2. Destroy 패턴

#### 패턴 1: 이벤트만 제거

**용도**: 이벤트 바인딩만 사용한 컴포넌트

**코드 예시**:
```javascript
const { removeCustomEvents } = WKit;

// 이벤트 리스너 제거
removeCustomEvents(this, this.customEvents);

// 참조 제거
this.customEvents = null;
this.handleButtonClick = null;
this.handleLinkClick = null;
```

**핵심 포인트**:
- ✅ **단순함**: `removeCustomEvents` 한 줄로 모든 이벤트 제거
- ✅ **메모리 정리**: 핸들러 메서드 참조도 null 처리

---

#### 패턴 2: 구독 해제

**용도**: GlobalDataPublisher 구독을 사용한 컴포넌트

**코드 예시**:
```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// 모든 topic에서 구독 해제
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// 참조 제거
this.subscriptions = null;
this.renderUserTable = null;
this.updateUserCount = null;
this.renderProductList = null;
```

**핵심 포인트**:
- ✅ **자동 순회**: `fx.go`로 모든 topic 자동 처리
- ✅ **메모리 정리**: 모든 핸들러 메서드 null 처리
- ✅ **완벽한 정리**: 페이지가 데이터 발행해도 이 컴포넌트는 더 이상 받지 않음

---

#### 패턴 3: 이벤트 + 구독 모두 정리

**코드 예시**:
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
this.renderUserTable = null;
this.updateUserCount = null;
this.handleButtonClick = null;
```

---

### 6.3. 생성/정리 매칭 (컴포넌트)

| 생성 (register) | 정리 (destroy) |
|-----------------|----------------|
| `this.customEvents = {...}` | `this.customEvents = null` |
| `bindEvents(this, customEvents)` | `removeCustomEvents(this, customEvents)` |
| `this.subscriptions = {...}` | `this.subscriptions = null` |
| `subscribe(topic, this, handler)` | `unsubscribe(topic, this)` |
| `this.myMethod = myMethod.bind(this)` | `this.myMethod = null` |
| `bind3DEvents(this, customEvents)` | (페이지 unload에서 일괄 정리) |

**1:1 매칭 확인**: ✅ 모든 생성된 리소스가 정리됨

---

### 6.4. 베스트 프랙티스

#### ✅ DO

**구독 스키마 활용**:
```javascript
this.subscriptions = {
    topic1: ['handler1', 'handler2'],
    topic2: ['handler3']
};
```
- 한눈에 어떤 topic을 구독하는지 파악
- 핸들러 추가/제거 용이

**data-attribute 활용**:
```javascript
function renderData(data) {
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('[data-item]');
    item.dataset.id = data.id;
    item.dataset.name = data.name;
}
```
- 이벤트 발생 시 context 전달
- 페이지 핸들러에서 `event.target.dataset` 활용

**Template 재사용**:
```javascript
// 여러 데이터 항목을 반복 렌더링
data.forEach(item => {
    const clone = template.content.cloneNode(true);
    // clone 수정...
    container.appendChild(clone);
});
```

#### ❌ DON'T

**컴포넌트에서 직접 데이터 fetch**:
```javascript
// ❌ 컴포넌트가 데이터 소스를 알아야 함 - 결합도 증가
async function myHandler() {
    const data = await fetch('/api/data');
    // ...
}
```
→ 대신 GlobalDataPublisher 구독 사용

**복잡한 비즈니스 로직**:
```javascript
// ❌ 컴포넌트가 너무 많은 책임
function renderData(data) {
    const processed = complexBusinessLogic(data);  // 50줄...
    const filtered = applyFilters(processed);      // 30줄...
    const sorted = applySorting(filtered);         // 20줄...
    // ...
}
```
→ 대신 페이지나 별도 유틸리티 함수로 분리

**정리 누락**:
```javascript
// ❌ 구독만 하고 해제 안 함 - 메모리 누수
// destroy.js가 없거나 비어있음
```
→ 반드시 1:1 매칭으로 정리

---

### 6.5. 실전 예시: Header 컴포넌트

실제 구현한 Header 컴포넌트를 살펴보겠습니다.

**register.js**:
```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// 구독 설정
this.subscriptions = {
    deviceStatus: ['renderSystemStatus']
};

this.renderSystemStatus = renderSystemStatus.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// 핸들러 - Template 활용
function renderSystemStatus(data) {
    if (!data || !Array.isArray(data)) return;

    const onlineDevices = data.filter(d => d.status === 'online').length;
    const offlineDevices = data.filter(d => d.status === 'offline').length;
    const totalDevices = data.length;

    const template = this.element.querySelector('#status-template');
    const container = this.element.querySelector('[data-status-container]');

    const clone = template.content.cloneNode(true);

    // data-attribute 업데이트
    clone.querySelector('[data-status-type="total"]').textContent = `Total: ${totalDevices}`;
    clone.querySelector('[data-status-type="online"]').textContent = `Online: ${onlineDevices}`;
    clone.querySelector('[data-status-type="offline"]').textContent = `Offline: ${offlineDevices}`;

    container.innerHTML = '';
    container.appendChild(clone);
}
```

**destroy.js**:
```javascript
const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

this.subscriptions = null;
this.renderSystemStatus = null;
```

**특징**:
- ✅ Template 기반 렌더링
- ✅ data-attribute로 상태 저장
- ✅ 구독/해제 1:1 매칭
- ✅ 5분 내 작성 가능한 간결함

---

### 6.6. 이벤트 위임 패턴 상세

#### 왜 이벤트 위임을 사용하는가?

##### ❌ 직접 바인딩의 문제점

```javascript
// 나쁜 예: 각 버튼에 직접 바인딩
const buttons = document.querySelectorAll('.my-button');
buttons.forEach(button => {
    button.addEventListener('click', handler);
});
```

**문제**:
1. **동적 요소 처리 불가**: 나중에 추가된 버튼은 이벤트 없음
   ```javascript
   // 이미 바인딩 완료 후...
   container.innerHTML += '<button class="my-button">New</button>';
   // ❌ 새 버튼은 클릭해도 반응 없음!
   ```

2. **메모리 낭비**: 버튼 100개면 리스너 100개
   ```javascript
   // 100개 버튼 → 100개 리스너 → 메모리 100배 사용
   ```

3. **정리 복잡**: 요소 제거 시 리스너도 수동으로 제거해야 함
   ```javascript
   buttons.forEach(button => {
       button.removeEventListener('click', handler);  // 일일이 제거
   });
   ```

---

##### ✅ 이벤트 위임의 장점

```javascript
// 좋은 예: 부모에 한 번만 바인딩
container.addEventListener('click', (event) => {
    const button = event.target.closest('.my-button');
    if (button) {
        handler.call(button, event);
    }
});
```

**장점**:
1. **동적 요소 자동 처리**: 나중에 추가된 요소도 자동으로 동작
   ```javascript
   container.innerHTML += '<button class="my-button">New</button>';
   // ✅ 클릭하면 자동으로 동작!
   ```

2. **메모리 효율**: 버튼 100개여도 리스너는 1개
   ```javascript
   // 100개 버튼 → 1개 리스너 → 메모리 1배만 사용
   ```

3. **간단한 정리**: 부모의 리스너만 제거하면 됨
   ```javascript
   container.removeEventListener('click', handler);  // 한 번만!
   ```

---

#### 어떻게 동작하는가?

##### 1. 이벤트 버블링 메커니즘

```html
<div class="container">              <!-- 3. 최종 도착 -->
    <button class="my-button">       <!-- 2. 버블링 -->
        <span>Click me</span>        <!-- 1. 클릭 시작 -->
    </button>
</div>
```

**버블링 과정**:
```
사용자가 <span> 클릭
    ↓
1. event.target = span
2. span → button → container로 이벤트 버블링
3. container의 리스너가 이벤트 포착
4. closest('.my-button')로 버튼 찾기
5. 버튼을 찾으면 핸들러 실행
```

---

##### 2. WKit의 delegate 함수 동작 원리

**코드 분석**:
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

  // Step 4: 컴포넌트 root에 리스너 등록 (위임!)
  instance.element.addEventListener(eventName, emitEvent);
}
```

**단계별 설명**:

**Step 1: `closest(selector)`**
```javascript
// 클릭된 요소부터 시작해서 부모로 올라가며 selector 매칭 검색
const target = event.target.closest('.my-button');

// 예시:
// <button class="my-button">
//   <span>Text</span>  <!-- 여기 클릭 -->
// </button>

// event.target = span
// span.closest('.my-button') = button ✅
```

**Step 2: 범위 체크**
```javascript
// 찾은 요소가 컴포넌트 내부에 있는지 확인
instance.element.contains(target)

// 다른 컴포넌트의 버튼은 무시
```

**Step 3: 컨텍스트 유지**
```javascript
handler.call(target, event);

// this = target (매칭된 버튼)
// event.target = 실제 클릭된 요소 (span 등)
```

**Step 4: 한 곳에만 등록**
```javascript
// instance.element (컴포넌트 root)에만 등록
// 내부의 모든 자식 요소 클릭 포착
```

---

##### 3. bindEvents의 역할

```javascript
WKit.bindEvents = function (instance, customEvents) {
  fx.each(([browserEvent, selectorMap]) => {
    fx.each(([selector, customEventName]) => {
      const handler = (event) => {
        console.log('@eventHandler', customEventName);
        WEventBus.emit(customEventName, {
          event,
          targetInstance: instance,
        });
      };

      // delegate로 위임 설정
      delegate(instance, browserEvent, selector, handler);
    }, Object.entries(selectorMap));
  }, Object.entries(customEvents));
};
```

**전체 흐름**:
```
1. bindEvents 호출
   ↓
2. customEvents 순회
   {
     click: {
       '.button1': '@event1',
       '.button2': '@event2'
     }
   }
   ↓
3. 각 selector마다 delegate 호출
   → instance.element에 리스너 등록 (한 번만!)
   ↓
4. 사용자 클릭
   ↓
5. closest로 매칭되는 요소 찾기
   ↓
6. WEventBus.emit으로 커스텀 이벤트 발행
   ↓
7. 페이지의 eventBusHandlers 실행
```

---

#### 실전 예시

##### 동적 리스트 렌더링

```javascript
// Component register
this.customEvents = {
    click: {
        '.delete-button': '@itemDeleted'
    }
};
bindEvents(this, this.customEvents);

// 동적으로 아이템 추가
function renderItems(data) {
    const html = data.map(item => `
        <div class="item">
            ${item.name}
            <button class="delete-button" data-id="${item.id}">Delete</button>
        </div>
    `).join('');

    container.innerHTML = html;  // 새로 렌더링
}

// ✅ 새로 추가된 delete-button도 자동으로 클릭 가능!
// ✅ 리스너는 단 1개! (instance.element에만)
```

##### 중첩된 요소 처리

```html
<button class="status-item" data-status="online">
    <span class="icon">●</span>
    <span class="label">Online: 5</span>
</button>
```

```javascript
// 아이콘이나 라벨 클릭해도 버튼 이벤트 발생
this.customEvents = {
    click: {
        '.status-item': '@statusClicked'
    }
};

// closest가 .status-item을 찾아줌
// event.target.dataset.status로 데이터 접근 가능
```

---

#### Edge Cases

##### 1. 중첩된 매칭 요소

```html
<div class="button outer">
  <div class="button inner">
    <span>Click</span>
  </div>
</div>
```

**동작**:
- `closest('.button')` → 가장 가까운 `.button.inner` 반환 ✅
- 한 번만 처리됨 (의도된 동작) ✅

##### 2. Root 자체가 selector

```javascript
// instance.element에 class="my-component"
this.customEvents = {
  click: { '.my-component': '@clicked' }
};
```

**동작**:
- `closest('.my-component')` → instance.element 반환 ✅
- `contains(target)` → true (자기 자신 포함) ✅

##### 3. 여러 컴포넌트가 같은 selector

```javascript
// Component A, B 모두 '.button' 사용
```

**동작**:
- 각각 독립적인 instance.element에 리스너 등록 ✅
- `contains()` 체크로 자신의 범위만 처리 ✅

---

#### 핵심 정리

| 항목 | 직접 바인딩 | 이벤트 위임 |
|------|------------|------------|
| **리스너 개수** | 요소마다 1개 | 부모에 1개 |
| **동적 요소** | ❌ 처리 불가 | ✅ 자동 처리 |
| **메모리** | 요소 수만큼 | 항상 1개 |
| **정리** | 각각 제거 필요 | 부모만 제거 |
| **버블링 필요** | 불필요 | 필수 |

**WKit의 이벤트 위임 = 효율성 + 동적 처리 + 간단한 정리**

**구현 검증**: ✅ 올바르게 구현됨
- `closest()` 사용으로 버블링 정확히 활용
- `contains()` 체크로 범위 격리
- 동적 요소 자동 처리
- 메모리 효율적

---

## 완전한 라이프사이클 흐름

### 전체 흐름 요약

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
  → stopAllIntervals() (모든 interval 중단)
  → offEventBusHandlers() (이벤트 정리)
  → unregisterMapping() (DataPublisher 정리)
  → 모든 참조 제거 (null 할당)
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

4. **동적 확장성**
   - refreshInterval로 주기 조절
   - currentParams로 동적 param
   - 새 topic 추가 용이

---

## 이벤트 실행 구조

### event vs targetInstance

사용자 이벤트 발생 시 두 가지 정보가 제공됩니다:

| 정보 타입 | event.target | targetInstance |
|-----------|--------------|----------------|
| **사용자 입력** | ✅ value, textContent | ❌ |
| **DOM 속성** | ✅ dataset, classList | ❌ |
| **인스턴스 메타** | ❌ | ✅ id, name |
| **데이터셋 정보** | ❌ | ✅ datasetInfo |
| **인스턴스 메소드** | ❌ | ✅ showDetail(), etc. |

**상호보완적**: 두 가지가 서로 다른 정보를 제공하여 완전한 컨텍스트 구성

### 이벤트 흐름

```
사용자 클릭
    ↓
브라우저 click 이벤트 발생
    ↓
WKit.delegate가 감지 (이벤트 위임)
    ↓
WEventBus.emit('@sensorClicked', { event, targetInstance })
    ↓
페이지 이벤트 핸들러 실행
```

### 실전 예시

**컴포넌트 (HTML)**:
```html
<div class="sensor-card"
     data-sensor-id="TEMP-001"
     data-zone="Zone A">
    Temperature: 23.5°C
</div>
```

**컴포넌트 (register)**:
```javascript
this.customEvents = {
    click: { '.sensor-card': '@sensorClicked' }
};

this.datasetInfo = {
    datasetName: 'iotapi',
    param: { endpoint: '/api/iot/sensors/detail' }
};

WKit.bindEvents(this, this.customEvents);
```

**페이지 (before_load)**:
```javascript
'@sensorClicked': async ({ event, targetInstance }) => {
    // 1. 사용자가 클릭한 센서 정보 (event.target)
    const { sensorId, zone } = event.target.dataset;

    // 2. 인스턴스의 데이터셋 정보 (targetInstance)
    const { datasetInfo } = targetInstance;
    const { datasetName, param } = datasetInfo;

    // 3. 상세 데이터 fetch
    const data = await WKit.fetchData(
        this,
        datasetName,
        { ...param, sensorId, zone }
    );

    // 4. 컴포넌트에 렌더링 위임
    if (targetInstance.showDetail) {
        targetInstance.showDetail(data);
    }
}
```

### 패턴의 가치

1. **표준성**: 표준 DOM API 사용 (event.target, dataset)
2. **관심사 분리**: 사용자 의도(event) vs 컴포넌트 메타(targetInstance)
3. **유연성**: 단순 값 전달부터 복잡한 처리까지 가능
4. **컴포넌트 독립성**: 페이지는 인스턴스 정보만 활용
5. **디버깅 용이성**: 명확한 컨텍스트

---

## 고급 패턴

### 8.1. 동적 Param 변경 패턴

#### 핵심 발견: Stop/Start 불필요!

**초기 가정** (dashboard_example 안티패턴):
> "param 변경 시 interval을 중단하고, 업데이트하고, 다시 시작해야 한다"

**문제점**:
- ❌ Interval 주기 리셋 (독립적 주기 깨짐)
- ❌ 불필요한 복잡성
- ❌ 성능 저하

**개선된 패턴 - 핵심 원리**:

`currentParams`는 **참조(Reference)**입니다.

```javascript
// Interval 설정 시 (startAllIntervals)
setInterval(() => {
    GlobalDataPublisher.fetchAndPublish(
        topic,
        this,
        this.currentParams[topic]  // ← 참조!
    );
}, refreshInterval);
```

**즉시 호출로 사용자 피드백 + Interval은 자동으로 업데이트된 param 사용**

#### 패턴 1: 특정 Topic만 영향

```javascript
'@zoneFilterChanged': ({ event }) => {
    const zone = event.target.value;

    // 1. Update currentParams
    this.currentParams['sensorData'] = {
        ...this.currentParams['sensorData'],
        zone
    };

    // 2. Immediate fetch - 사용자가 즉시 새 데이터 봄
    GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);

    // 3. Interval은 자동으로 업데이트된 param 사용
    // No stop/start needed!
}
```

#### 패턴 2: 모든 Topic에 영향

```javascript
'@periodFilterChanged': ({ event }) => {
    const period = event.target.value;

    fx.go(
        this.globalDataMappings,
        fx.each(({ topic }) => {
            this.currentParams[topic] = {
                ...this.currentParams[topic],
                period
            };
            GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
        })
    );

    // All intervals continue with updated params!
}
```

#### 타임라인 비교

**❌ Stop/Start (불필요한 복잡성)**:
```
T=0:   sensorData (5초), deviceStatus (15초) 시작
T=2:   사용자 필터 변경
       → stopAllIntervals()
       → startAllIntervals()  ← 모든 interval 0초부터 재시작
T=7:   sensorData (5초), deviceStatus (5초)  ← 동기화됨! 문제!
```

**✅ 개선된 패턴**:
```
T=0:   sensorData (5초), deviceStatus (15초) 시작
T=2:   사용자 필터 변경
       → currentParams 업데이트
       → 즉시 fetchAndPublish  ← 사용자가 바로 봄
T=5:   sensorData interval → 새 param 자동 사용 ✅
T=15:  deviceStatus interval → 새 param 자동 사용 ✅
```

**장점**:
- ✅ 독립적 주기 유지 (5초, 15초)
- ✅ 즉시 반영
- ✅ 자동 업데이트

#### 베스트 프랙티스

**✅ DO**:
```javascript
this.currentParams[topic] = { ...this.currentParams[topic], newParam };
GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
```

**❌ DON'T**:
```javascript
this.stopAllIntervals();
// ... 업데이트 ...
this.startAllIntervals();  // 불필요!
```

---

### 8.2. Interval 주기 변경 기능 평가

**질문**: Interval 주기를 동적으로 변경하는 기능이 필요한가?

**결론**: ❌ **불필요함 (YAGNI 원칙)**

#### 불필요한 이유

**1. 사전 정의로 충분**:
```javascript
this.globalDataMappings = [
    { topic: 'sensorData', refreshInterval: 5000 },    // 실시간
    { topic: 'deviceStatus', refreshInterval: 15000 }, // 중기
    { topic: 'trends', refreshInterval: 60000 }        // 통계
];
```

**2. 사용자가 조절할 이유가 없음**:
- 사용자 관심사: "데이터를 본다", "필터를 변경한다"
- 기술적 세부사항: "갱신 주기" ← 노출 불필요

**3. 복잡도만 증가**:

| 기능 | 복잡도 | 실용성 | 권장 |
|------|--------|--------|------|
| Param 변경 | 낮음 | 매우 높음 | ✅ 필수 |
| Interval on/off | 낮음 | 높음 | ✅ 유용 |
| Interval 주기 변경 | 높음 | 매우 낮음 | ❌ 불필요 |

#### 유용한 대안: Visibility API

**유일하게 실용적인 케이스**: 탭 포커스 감지

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.stopAllIntervals();  // 백그라운드: interval 중단
    } else {
        this.startAllIntervals();  // 포그라운드: 재시작
        // 즉시 최신 데이터 fetch
        fx.go(
            this.globalDataMappings,
            fx.each(({ topic }) => {
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
            })
        );
    }
});
```

**장점**:
- ✅ 리소스 절약
- ✅ 서버 부하 감소
- ✅ 단순함
- ✅ 사용자 경험 개선

#### YAGNI 원칙

> "필요할 때 추가하라. 미리 추가하지 마라."

**현재 상황**:
- ✅ Param 변경: 명확히 필요함 → 구현 완료
- ✅ Interval on/off: 유용할 수 있음 → 선택적 구현
- ❌ Interval 주기 변경: 필요성 불명확 → **구현하지 말 것**

---

## 현재 상황 및 다음 단계

### ✅ 완료

- [x] **시나리오 구상** (IoT 모니터링 대시보드)
- [x] **API 서버 구축** (mock_server/)
  - 8개 API 엔드포인트
  - 다양한 갱신 주기 시뮬레이션
  - 실시간 데이터 생성 로직
- [x] **page_before_load.js 구현**
  - 이벤트 핸들러 등록
  - Primitive 조합 패턴
- [x] **page_loaded.js 구현**
  - 데이터 매핑 및 발행
  - Topic별 독립적 갱신 주기
- [x] **page_before_unload.js 구현**
  - 리소스 정리
  - 생성/정리 1:1 매칭 완료
- [x] **컴포넌트 구현**
  - SensorPanel: 센서 데이터 카드 그리드
  - AlertList: 알림 목록 + 카운트 배지
  - TrendChart: ECharts 온도 트렌드 차트
- [x] **에러 처리 패턴**
  - Guard clause로 데이터 검증
  - ECharts 호출만 try-catch

### 구현된 컴포넌트

| 컴포넌트 | 구독 Topic | 기능 |
|----------|-----------|------|
| SensorPanel | sensors | 센서 카드 그리드, 상태별 스타일 |
| AlertList | alerts | 알림 목록, 카운트 배지, 빈 상태 |
| TrendChart | trend | ECharts 온도 트렌드, ResizeObserver |

### datasetList.json 구조 (v3.2.0)

```json
{
  "version": "3.2.0",
  "data": [
    {
      "name": "iotSensors",
      "dataset_id": "iot-sensors-001",
      "page_id": "PAGE",
      "interval": "5000",
      "rest_api": "{\"url\":\"...\",\"method\":\"GET\",...}"
    }
  ]
}
```

### 평가

**완성도**: 8/10
- ✅ 체계적인 설계
- ✅ 일관된 패턴
- ✅ 컴포넌트 구현 완료
- ✅ Guard clause 에러 처리
- ⚠️ 테스트/로딩 상태 미구현

---

**작성 일시**: 2025-11-21
**최종 업데이트**: 2025-11-28 (컴포넌트 구현 완료, 에러 처리 패턴 적용)
