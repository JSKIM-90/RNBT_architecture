# RNBT 아키텍처 검증 문서

이 문서는 RNBT 아키텍처의 설계와 구현이 일관되고 오류가 없는지 검증한 결과입니다.

---

## 검증 범위

| 관점 | 검증 내용 |
|------|----------|
| **설계 관점** | 이벤트/데이터 흐름이 명확히 분리되어 있는가 |
| **문법 관점** | Utils 모듈이 필요한 함수를 제공하는가 |
| **설계를 위한 문법 관점** | 설계 패턴을 구현하기 위한 함수 시그니처가 올바른가 |

---

## 1. 설계 관점 검증

### 1.1 이벤트 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  사용자 인터랙션                                                  │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐    customEvents     ┌─────────────┐            │
│  │  DOM Event  │ ──────────────────▶ │  Weventbus  │            │
│  └─────────────┘    (bindEvents)     │   .emit()   │            │
│                                      └──────┬──────┘            │
│                                             │                    │
│                                             ▼                    │
│                                      ┌─────────────┐            │
│                                      │    Page     │            │
│                                      │  Handler    │            │
│                                      └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**설계 원칙:**
- 컴포넌트는 이벤트를 **발행**만 함 (what happened)
- 페이지가 이벤트를 **처리**함 (what to do)
- 느슨한 결합으로 컴포넌트 재사용성 보장

**검증 결과:** ✅ 설계 원칙 준수

---

### 1.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  Page (Orchestrator)                                             │
│       │                                                          │
│       │ fetchAndPublish(topic, page, params)                     │
│       ▼                                                          │
│  ┌─────────────────────┐                                        │
│  │ GlobalDataPublisher │                                        │
│  │   (Pub-Sub Hub)     │                                        │
│  └──────────┬──────────┘                                        │
│             │                                                    │
│             │ subscribe(topic, instance, handler)                │
│             ▼                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Component A │  │ Component B │  │ Component C │             │
│  │ (Subscriber)│  │ (Subscriber)│  │ (Subscriber)│             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

**설계 원칙:**
- 페이지가 데이터 **발행** (어떤 API를 호출할지 결정)
- 컴포넌트는 데이터 **구독** (어떤 데이터가 필요한지만 선언)
- Topic 기반으로 중복 fetch 방지

**검증 결과:** ✅ 설계 원칙 준수

---

### 1.3 자기완결 컴포넌트 (3D)

```
┌─────────────────────────────────────────────────────────────────┐
│  Self-Contained Component (예: UPS)                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ datasetInfo = [                                           │   │
│  │   { datasetName: 'ups', render: ['renderUPSInfo'] }      │   │
│  │ ]                                                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                     │                                            │
│                     │ showDetail() → fetchData()                 │
│                     ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Shadow DOM Popup (applyShadowPopupMixin)                  │   │
│  │   ├── renderUPSInfo() → popupQuery()                      │   │
│  │   └── renderChart() → updateChart()                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**설계 원칙:**
- 컴포넌트가 자체적으로 데이터 호출 (페이지 의존성 없음)
- Shadow DOM으로 스타일 격리
- 팝업 내 차트/테이블 독립 관리

**검증 결과:** ✅ 설계 원칙 준수

---

## 2. 문법 관점 검증

### 2.1 Utils 모듈별 제공 함수

#### Wkit.js

| 함수명 | 용도 | 시그니처 |
|--------|------|----------|
| `bindEvents` | 2D 이벤트 바인딩 | `(instance, customEvents)` |
| `removeCustomEvents` | 2D 이벤트 해제 | `(instance, customEvents)` |
| `bind3DEvents` | 3D 이벤트 바인딩 | `(instance, customEvents)` |
| `initThreeRaycasting` | 3D 레이캐스팅 설정 | `(canvas, eventType)` → `handler` |
| `onEventBusHandlers` | 이벤트버스 핸들러 등록 | `(handlers)` |
| `offEventBusHandlers` | 이벤트버스 핸들러 해제 | `(handlers)` |
| `fetchData` | API 호출 | `(page, datasetName, param)` → `Promise` |
| `withSelector` | 안전한 셀렉터 실행 | `(element, selector, fn)` |
| `makeIterator` | 레이어별 인스턴스 이터레이터 | `(page, ...layers)` |
| `getInstanceById` | ID로 인스턴스 검색 | `(id, iter)` |
| `getInstanceByName` | 이름으로 인스턴스 검색 | `(name, iter)` |
| `disposeAllThreeResources` | 3D 리소스 일괄 정리 | `(page)` |

#### GlobalDataPublisher.js

| 함수명 | 용도 | 시그니처 |
|--------|------|----------|
| `registerMapping` | 데이터 매핑 등록 | `({ topic, datasetInfo })` |
| `unregisterMapping` | 데이터 매핑 해제 | `(topic)` |
| `fetchAndPublish` | 데이터 fetch 후 발행 | `(topic, page, params)` → `Promise` |
| `subscribe` | topic 구독 | `(topic, instance, handler)` |
| `unsubscribe` | topic 구독 해제 | `(topic, instance)` |

#### Weventbus.js

| 함수명 | 용도 | 시그니처 |
|--------|------|----------|
| `on` | 이벤트 리스너 등록 | `(event, callback)` |
| `off` | 이벤트 리스너 해제 | `(event, callback)` |
| `emit` | 이벤트 발행 | `(event, data)` |
| `once` | 일회성 리스너 등록 | `(event, callback)` |

#### PopupMixin.js

| 함수명 | 용도 | 시그니처 |
|--------|------|----------|
| `applyShadowPopupMixin` | 기본 팝업 믹스인 | `(instance, { getHTML, getStyles, onCreated })` |
| `applyEChartsMixin` | 차트 믹스인 | `(instance)` |
| `applyTabulatorMixin` | 테이블 믹스인 | `(instance)` |

**applyShadowPopupMixin 제공 메서드:**

| 메서드 | 용도 |
|--------|------|
| `createPopup()` | Shadow DOM 팝업 생성 |
| `showPopup()` | 팝업 표시 |
| `hidePopup()` | 팝업 숨김 |
| `popupQuery(selector)` | Shadow DOM 내부 요소 선택 |
| `popupQueryAll(selector)` | Shadow DOM 내부 요소 모두 선택 |
| `bindPopupEvents(events)` | 팝업 내 이벤트 바인딩 |
| `destroyPopup()` | 팝업 및 리소스 정리 |

**applyEChartsMixin 제공 메서드:**

| 메서드 | 용도 |
|--------|------|
| `createChart(selector)` | ECharts 인스턴스 생성 |
| `getChart(selector)` | 차트 인스턴스 조회 |
| `updateChart(selector, option)` | 차트 옵션 업데이트 |

**applyTabulatorMixin 제공 메서드:**

| 메서드 | 용도 |
|--------|------|
| `createTable(selector, options)` | Tabulator 인스턴스 생성 |
| `getTable(selector)` | 테이블 인스턴스 조회 |
| `isTableReady(selector)` | 초기화 완료 여부 |
| `updateTable(selector, data)` | 테이블 데이터 업데이트 |
| `updateTableOptions(selector, options)` | 테이블 옵션 업데이트 |

#### fx.js

| 함수명 | 용도 |
|--------|------|
| `fx.go` | 파이프라인 실행 |
| `fx.pipe` | 파이프라인 함수 생성 |
| `fx.map` | 변환 |
| `fx.filter` | 필터링 |
| `fx.reduce` | 축약 |
| `fx.each` | 순회 (부수효과) |
| `fx.find` | 검색 |
| `fx.take` | N개 추출 |
| `fx.L.*` | 지연 평가 버전 |
| `fx.C.*` | 동시성 버전 |

**검증 결과:** ✅ 모든 Utils가 필요한 함수를 제공

---

## 3. 설계를 위한 문법 관점 검증

### 3.1 이벤트 흐름 구현

**설계:**
```
컴포넌트 → customEvents 정의 → bindEvents → Weventbus.emit → 페이지 핸들러
```

**구현 검증:**

```javascript
// 1. 컴포넌트: customEvents 정의
this.customEvents = {
    click: { '.btn': '@buttonClicked' }
};

// 2. Wkit.bindEvents 내부 동작
Wkit.bindEvents = function (instance, customEvents) {
    // customEvents 구조: { eventType: { selector: triggerEvent } }
    fx.go(
        Object.entries(customEvents),
        fx.each(([eventName, selectorList]) => {
            fx.each((selector) => {
                delegate(instance, eventName, selector, handler);
            }, Object.keys(selectorList));
        })
    );
};

// 3. delegate 내부에서 Weventbus.emit 호출
function makeHandler(targetInstance, selector) {
    return function (event) {
        const triggerEvent = customEvents?.[event.type]?.[selector];
        if (triggerEvent) {
            Weventbus.emit(triggerEvent, { event, targetInstance });
        }
    };
}

// 4. 페이지: 핸들러에서 수신
this.eventBusHandlers = {
    '@buttonClicked': ({ event, targetInstance }) => { ... }
};
onEventBusHandlers(this.eventBusHandlers);
```

**검증 결과:** ✅ 설계와 구현 일치

---

### 3.2 데이터 흐름 구현

**설계:**
```
페이지 → registerMapping → fetchAndPublish → 컴포넌트 subscribe handler 호출
```

**구현 검증:**

```javascript
// 1. 페이지: 매핑 등록
this.globalDataMappings = [
    { topic: 'assets', datasetInfo: { datasetName: 'assets', param: {} } }
];
fx.go(
    this.globalDataMappings,
    fx.each(GlobalDataPublisher.registerMapping)
);

// 2. GlobalDataPublisher.registerMapping 내부
registerMapping({ topic, datasetInfo }) {
    mappingTable.set(topic, datasetInfo);  // Map에 저장
}

// 3. 컴포넌트: 구독
this.subscriptions = { 'assets': ['renderTable'] };
subscribe('assets', this, this.renderTable);

// 4. GlobalDataPublisher.subscribe 내부
subscribe(topic, instance, handler) {
    subscriberTable.get(topic).add({ instance, handler });
}

// 5. 페이지: 데이터 발행
GlobalDataPublisher.fetchAndPublish('assets', this, params);

// 6. GlobalDataPublisher.fetchAndPublish 내부
async fetchAndPublish(topic, page, paramUpdates) {
    const datasetInfo = mappingTable.get(topic);
    const data = await Wkit.fetchData(page, datasetInfo.datasetName, param);
    fx.each(({ instance, handler }) => handler.call(instance, data), subs);
}
```

**검증 결과:** ✅ 설계와 구현 일치

---

### 3.3 자기완결 컴포넌트 구현

**설계:**
```
컴포넌트 → datasetInfo 정의 → showDetail() → fetchData → render
```

**구현 검증:**

```javascript
// 1. 데이터 정의
this.datasetInfo = [
    { datasetName: 'ups', render: ['renderUPSInfo'] }
];

// 2. showDetail에서 직접 fetchData 호출
function showDetail(assetId) {
    this.showPopup();
    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, render }) =>
            fx.go(
                fetchData(this.page, datasetName, { assetId }),
                result => result?.response?.data,
                data => render.forEach(fn => this[fn](data))
            )
        )
    );
}

// 3. Wkit.fetchData 내부
fetchData(page, datasetName, param) {
    return new Promise((res, rej) => {
        page.dataService
            .call(datasetName, { param })
            .on('success', (data) => res(data))
            .on('error', (err) => rej(err));
    });
}
```

**검증 결과:** ✅ 설계와 구현 일치

---

### 3.4 생성/정리 매칭 검증

| 생성 | 정리 | Utils 함수 | 검증 |
|------|------|-----------|------|
| `onEventBusHandlers(handlers)` | `offEventBusHandlers(handlers)` | Wkit | ✅ |
| `registerMapping(mapping)` | `unregisterMapping(topic)` | GlobalDataPublisher | ✅ |
| `subscribe(topic, instance, handler)` | `unsubscribe(topic, instance)` | GlobalDataPublisher | ✅ |
| `bindEvents(instance, events)` | `removeCustomEvents(instance, events)` | Wkit | ✅ |
| `bind3DEvents(instance, events)` | `disposeAllThreeResources(page)` | Wkit | ✅ |
| `applyShadowPopupMixin(...)` | `destroyPopup()` | PopupMixin | ✅ |
| `applyEChartsMixin(...)` | `destroyPopup()` (내부 처리) | PopupMixin | ✅ |
| `applyTabulatorMixin(...)` | `destroyPopup()` (내부 처리) | PopupMixin | ✅ |
| `new Tabulator(...)` | `.destroy()` | 외부 라이브러리 | ✅ |
| `echarts.init(...)` | `.dispose()` | 외부 라이브러리 | ✅ |
| `new ResizeObserver(...)` | `.disconnect()` | 브라우저 API | ✅ |
| `addEventListener(...)` | `removeEventListener(...)` | 브라우저 API | ✅ |

**검증 결과:** ✅ 모든 생성/정리가 1:1 매칭

---

## 4. 종합 검증 결과

### 4.1 설계 관점

| 항목 | 결과 | 비고 |
|------|------|------|
| 이벤트 흐름 분리 | ✅ | 컴포넌트(발행) ↔ 페이지(처리) |
| 데이터 흐름 분리 | ✅ | 페이지(발행) ↔ 컴포넌트(구독) |
| 자기완결 컴포넌트 | ✅ | 독립적 데이터 호출 + Shadow DOM |
| 느슨한 결합 | ✅ | Topic 기반 Pub-Sub |

### 4.2 문법 관점

| 항목 | 결과 | 비고 |
|------|------|------|
| Wkit.js 함수 제공 | ✅ | 12개 함수 |
| GlobalDataPublisher.js 함수 제공 | ✅ | 5개 함수 |
| Weventbus.js 함수 제공 | ✅ | 4개 함수 |
| PopupMixin.js 함수 제공 | ✅ | 3개 믹스인 + 메서드 |
| fx.js 함수 제공 | ✅ | 파이프라인 + 지연/동시성 |

### 4.3 설계를 위한 문법 관점

| 항목 | 결과 | 비고 |
|------|------|------|
| 이벤트 흐름 구현 | ✅ | customEvents → emit → handler |
| 데이터 흐름 구현 | ✅ | registerMapping → fetchAndPublish → subscribe |
| 자기완결 컴포넌트 구현 | ✅ | datasetInfo → fetchData → render |
| 생성/정리 매칭 | ✅ | 모든 리소스 1:1 매칭 |

---

## 5. 결론

**RNBT 아키텍처는 설계와 구현이 일관되며, 코드적 모순이나 오류가 없습니다.**

1. **설계 원칙**이 명확히 정의되어 있음
2. **Utils 모듈**이 설계를 구현하기 위한 모든 함수를 제공함
3. **함수 시그니처**가 사용처와 일치함
4. **생성/정리**가 1:1로 매칭되어 메모리 누수 방지

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [README.md](../README.md) | 아키텍처 전체 가이드 |
| [TEST_SCENARIOS.md](./TEST_SCENARIOS.md) | 테스트 시나리오 (What) |
| [TESTING_GUIDE.md](../tests/TESTING_GUIDE.md) | 테스트 구현 가이드 (How) |

---

*검증일: 2026-01-10*
