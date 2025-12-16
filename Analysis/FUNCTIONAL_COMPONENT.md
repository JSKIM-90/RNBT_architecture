# Functional Component Pattern

자기 완결 컴포넌트(Self-Contained Component) 개발 패턴 가이드입니다.

> **Note**: 이 문서는 **3D + Popup + Chart 컴포넌트(TemperatureSensor)** 예시를 기반으로 작성되었습니다.
> 다른 유형의 컴포넌트에는 일부 패턴이 적용되지 않을 수 있습니다.

---

## 핵심 개념

**자기 완결 컴포넌트**: 데이터 fetch, 렌더링, 이벤트, UI(팝업)를 모두 내부에서 관리하는 컴포넌트

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

---

## register.js 구조

### 섹션 순서 (권장)

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
 * 6. Popup - 오버라이드 가능
 */
```

**순서 원칙**: 비즈니스 로직(1~4) → 프레임워크 통합(5~6)

---

## 1. datasetInfo - 데이터 정의

```javascript
this.datasetInfo = [
    { datasetName: 'sensor', param: { id: this.id }, render: ['renderSensorInfo'] },
    { datasetName: 'sensorHistory', param: { id: this.id }, render: ['renderChart'] }
];
```

| 필드 | 역할 |
|------|------|
| `datasetName` | datasetList.json의 키 |
| `param` | API 호출 파라미터 |
| `render` | 데이터 수신 후 호출할 렌더 함수 배열 |

**render가 배열인 이유**: 하나의 데이터로 여러 렌더링 가능 (예: 요약 + 상세)

---

## 2. Data Config - API 필드 매핑

### Config 주입 패턴

```javascript
// API 필드 → UI 요소 매핑
this.sensorConfig = [
    { key: 'name', selector: '.sensor-name' },
    { key: 'zone', selector: '.sensor-zone' },
    { key: 'temperature', selector: '.sensor-temp' },
    { key: 'humidity', selector: '.sensor-humidity' },
    { key: 'status', selector: '.sensor-status', dataset: 'status' }
];

// 차트 데이터 매핑
this.dataConfig = {
    xKey: 'timestamps',
    yKey: 'temperatures'
};

// 차트 스타일
this.chartStyleConfig = {
    color: '#3b82f6',
    smooth: true,
    areaStyle: true
};
```

### 핵심 원칙

- **key**: Raw API 필드명 → Config
- **selector**: DOM 선택자 → Config
- **스타일**: color, smooth 등 → Config
- **데이터 포맷팅**: 서버 책임 (클라이언트에서 °C, % 붙이지 않음)

---

## 3. 렌더링 함수 바인딩

```javascript
this.renderSensorInfo = renderSensorInfo.bind(this, this.sensorConfig);
this.renderChart = renderChart.bind(this, { ...this.dataConfig, ...this.chartStyleConfig });
```

**패턴**: `함수.bind(this, config)` → config가 첫 번째 인자로 고정

### renderSensorInfo 구현 (fx.go 패턴)

```javascript
function renderSensorInfo(config, data) {
    fx.go(
        config,
        fx.each(({ key, selector, dataset }) => {
            const el = this.popupQuery(selector);
            el.textContent = data[key];
            dataset && (el.dataset[dataset] = data[key]);
        })
    );
}
```

---

## 4. Public Methods

```javascript
this.showDetail = showDetail.bind(this);
this.hideDetail = hideDetail.bind(this);
```

### showDetail 구현 (fx.go 패턴)

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

**fx.go 비동기 처리**: fx.go는 내부적으로 Promise를 자동 처리 (`acc.then(recur)`)

---

## 5. customEvents - 이벤트 발행

```javascript
this.customEvents = {
    click: '@sensorClicked'
};

bind3DEvents(this, this.customEvents);
```

---

## 6. Popup - applyShadowPopupMixin

### 적용

```javascript
this.popupCreatedConfig = {
    chartSelector: '.chart-container',
    events: {
        click: {
            '.close-btn': () => this.hideDetail()
        }
    }
};

this.getPopupHTML = getPopupHTML.bind(this);
this.getPopupStyles = getPopupStyles.bind(this);
this.onPopupCreated = onPopupCreated.bind(this, this.popupCreatedConfig);

applyShadowPopupMixin(this, {
    getHTML: this.getPopupHTML,
    getStyles: this.getPopupStyles,
    onCreated: this.onPopupCreated
});
```

### applyShadowPopupMixin 제공 메서드

| 메서드 | 역할 |
|--------|------|
| `showPopup()` | 팝업 표시 (없으면 생성) |
| `hidePopup()` | 팝업 숨김 |
| `popupQuery(selector)` | Shadow DOM 내부 요소 선택 |
| `bindPopupEvents(events)` | 이벤트 델리게이션 바인딩 |
| `createChart(selector)` | ECharts 인스턴스 생성 |
| `updateChart(selector, option)` | 차트 옵션 업데이트 |
| `destroyPopup()` | 리소스 정리 |

### onPopupCreated 구현

```javascript
function onPopupCreated({ chartSelector, events }) {
    chartSelector && this.createChart(chartSelector);
    events && this.bindPopupEvents(events);
}
```

---

## destroy.js

```javascript
function onInstanceUnLoad() {
    this.destroyPopup();  // Shadow DOM + 차트 + 이벤트 정리
    console.log('[ComponentName] Destroyed:', this.id);
}
```

**3D 이벤트 정리**: Page의 `disposeAllThreeResources → dispose3DTree`에서 자동 처리

---

## Config 오버라이드

모든 config가 `this.`에 바인딩되어 있어 외부에서 오버라이드 가능:

```javascript
// Page에서 특정 인스턴스의 차트 색상 변경
const sensor = this.getComponentById('sensor-001');
sensor.chartStyleConfig.color = '#ff0000';
```

---

## 전체 예제: TemperatureSensor

```
TemperatureSensor/
├── scripts/
│   ├── register.js    # 초기화 + 메서드 정의
│   └── destroy.js     # 정리
└── (views, styles는 applyShadowPopupMixin 내부에서 getPopupHTML/getPopupStyles로 제공)
```

**특징**:
- 3D 오브젝트 클릭 → showDetail() → Shadow DOM 팝업 표시
- 팝업 내 ECharts 차트 자동 관리
- 닫기 버튼 → hideDetail() → 팝업 숨김

---

**버전**: 1.0.0
**작성일**: 2025-12-16
**참조**: `Utils/Mixin.js`, `Projects/IPSILON_3D/page/components/TemperatureSensor/`
