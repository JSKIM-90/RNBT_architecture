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
 * 6. Template Config - 사용할 template ID 설정
 * 7. Popup - template 기반 Shadow DOM 팝업
 */
```

**순서 원칙**: 비즈니스 로직(1~4) → 프레임워크 통합(5~7)

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

### Config 분리 패턴

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

### 핵심 원칙

| 항목 | 역할 | 위치 |
|------|------|------|
| `key` | Raw API 필드명 | Config |
| `selector` | DOM 선택자 | Config |
| `dataAttr` | data-* 속성 (CSS 선택자용) | Config |
| `optionBuilder` | 차트 타입별 옵션 생성 함수 | Config |
| 데이터 포맷팅 | 서버 책임 (°C, % 붙이지 않음) | - |

---

## 3. 렌더링 함수 바인딩

```javascript
// Config 병합 후 바인딩
this.renderSensorInfo = renderSensorInfo.bind(this, [...this.baseInfoConfig, ...this.sensorInfoConfig]);
this.renderChart = renderChart.bind(this, this.chartConfig);
```

**패턴**: `함수.bind(this, config)` → config가 첫 번째 인자로 고정

### renderSensorInfo 구현 (fx.go 패턴)

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

### renderChart 구현 (optionBuilder 주입)

```javascript
function renderChart(config, data) {
    const { optionBuilder, ...chartConfig } = config;
    const option = optionBuilder(chartConfig, data);
    this.updateChart('.chart-container', option);
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

## 6. Template Data - HTML/CSS 데이터

### 3D 컴포넌트의 HTML/CSS 활용 방식

| 구분 | DOM 컴포넌트 (2D) | 3D 컴포넌트 |
|------|------------------|-------------|
| **htmlCode 용도** | `element.innerHTML` 직접 렌더링 | `<template>` 정의 저장소 |
| **렌더링 방식** | DOM에 바로 삽입 | JS에서 template 추출 → Shadow DOM 팝업 |

### Template 구조

```javascript
// register.js 상단에 정의 (향후 publishCode에서 가져올 예정)
const templateHTML = `
<template id="popup-sensor">
    <div class="popup-overlay">
        <div class="popup">...</div>
    </div>
</template>

<template id="tooltip-info">
    <div class="tooltip">...</div>
</template>
`;

const templateCSS = `
.popup-overlay { ... }
.popup { ... }
.tooltip { ... }
`;
```

### extractTemplate Helper

```javascript
function extractTemplate(htmlCode, templateId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const template = doc.querySelector(`template#${templateId}`);
    return template?.innerHTML || '';
}
```

### Template Config

```javascript
this.templateConfig = {
    popup: 'popup-sensor',      // 팝업용 template ID
    // tooltip: 'tooltip-info', // 향후 확장
};
```

---

## 7. Popup - template 기반 Shadow DOM 팝업

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

// template 기반 (향후 publishCode 연동)
this.getPopupHTML = () => extractTemplate(templateHTML, this.templateConfig.popup);
this.getPopupStyles = () => templateCSS;
this.onPopupCreated = onPopupCreated.bind(this, this.popupCreatedConfig);

applyShadowPopupMixin(this, {
    getHTML: this.getPopupHTML,
    getStyles: this.getPopupStyles,
    onCreated: this.onPopupCreated
});
```

### 향후 publishCode 연동

```javascript
// 현재 (임시 데이터)
this.getPopupHTML = () => extractTemplate(templateHTML, this.templateConfig.popup);
this.getPopupStyles = () => templateCSS;

// 향후 (publishCode 연동)
this.getPopupHTML = () => extractTemplate(this.properties.publishCode.htmlCode, this.templateConfig.popup);
this.getPopupStyles = () => this.properties.publishCode.cssCode;
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

**버전**: 1.1.0
**작성일**: 2025-12-16
**참조**: `Utils/Mixin.js`, `Projects/IPSILON_3D/page/components/TemperatureSensor/`
