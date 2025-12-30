# Master + Page 레이어 아키텍처 예제

런타임 프레임워크의 **Master + Page 레이어 아키텍처**를 검증하기 위한 대시보드 예제

---

## 목표

**핵심 검증 사항**:
- Master 레이어와 Page 레이어의 **독립적인 데이터 흐름**
- Master의 `common_component`가 페이지 스크립트 역할 대체
- 각 레이어별 GlobalDataPublisher 사용
- 레이어 간 **느슨한 결합** 유지
- 컴포넌트 정형화 패턴

**명시적 범위**:
- Master: 공통 UI (Header, Sidebar) - 사용자 정보, 메뉴, 알림
- Page: 페이지별 콘텐츠 (StatsPanel, VisitorChart) - 통계, 차트

---

## 아키텍처 구조

```
example_master_01/
├── master/                    # Master 레이어
│   ├── common_component/      # 페이지 스크립트 대체
│   │   ├── register.js        # 이벤트 핸들러, 데이터 발행
│   │   └── beforeDestroy.js   # 리소스 정리
│   └── components/
│       ├── Header/            # 사용자 정보, 메뉴
│       └── Sidebar/           # 알림 목록
│
├── page/                      # Page 레이어
│   ├── page_scripts/
│   │   ├── before_load.js     # 이벤트 핸들러 등록
│   │   ├── loaded.js          # 데이터 발행
│   │   └── before_unload.js   # 리소스 정리
│   └── components/
│       ├── StatsPanel/        # 통계 카드
│       └── VisitorChart/      # ECharts 차트
│
├── mock_server/               # 목 API 서버 (port: 3001)
└── datasetList.json           # 데이터셋 정의
```

---

## 데이터 흐름

### Master 레이어

```
[common_component - register]
  → onEventBusHandlers() (이벤트 핸들러 등록)
  → registerMapping() (topic 등록)
  → fetchAndPublish() (데이터 발행)

[Header - register]
  → subscribe('userInfo', ...)
  → subscribe('menu', ...)

[Sidebar - register]
  → subscribe('notifications', ...)
```

**Topics**:
| Topic | 구독자 | 갱신 주기 |
|-------|--------|----------|
| userInfo | Header | 초기 1회 |
| menu | Header | 초기 1회 |
| notifications | Sidebar | 5초 |

### Page 레이어

```
[page_before_load]
  → onEventBusHandlers() (이벤트 핸들러 등록)

[StatsPanel, VisitorChart - register]
  → subscribe('stats', ...)
  → subscribe('chartData', ...)

[page_loaded]
  → registerMapping()
  → fetchAndPublish()
```

**Topics**:
| Topic | 구독자 | 갱신 주기 |
|-------|--------|----------|
| stats | StatsPanel | 10초 |
| chartData | VisitorChart | 15초 |

---

## common_component 패턴

Master 레이어에서는 페이지 스크립트가 없으므로 `common_component`가 대신합니다.

### 핵심 차이점

| 항목 | Page 레이어 | Master 레이어 |
|------|------------|--------------|
| 스크립트 위치 | page_scripts/ | common_component/ |
| fetchAndPublish 호출 | `this` (page) | `this.page` (master) |
| 라이프사이클 | before_load → loaded → before_unload | register → beforeDestroy |

### common_component/register.js 핵심

```javascript
const { fetchAndPublish } = GlobalDataPublisher;

// Master에서는 this.page를 사용!
fetchAndPublish('userInfo', this.page);
fetchAndPublish('notifications', this.page);
```

**주의**: `this.page`는 Master 레이어의 page 참조입니다.

---

## 컴포넌트 패턴

### 구독 패턴 (모든 컴포넌트 공통)

```javascript
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

this.subscriptions = {
    topicName: ['renderMethod']
};

this.renderMethod = renderMethod.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);
```

### 이벤트 바인딩 패턴

```javascript
const { bindEvents } = WKit;

this.customEvents = {
    click: {
        '.my-button': '@myClickEvent'
    }
};

bindEvents(this, this.customEvents);
```

### Guard Clause 에러 처리

```javascript
function renderData(response) {
    const { data } = response;

    // Guard clause로 데이터 검증
    if (!data) return;

    const template = this.element.querySelector('#template');
    const container = this.element.querySelector('.container');

    if (!template || !container) return;

    // 렌더링 로직...
}
```

### ECharts 컴포넌트 패턴

```javascript
// 초기화
const chartContainer = this.element.querySelector('#echarts');
this.chartInstance = echarts.init(chartContainer);

// ResizeObserver로 리사이즈 처리
this.resizeObserver = new ResizeObserver(() => {
    this.chartInstance && this.chartInstance.resize();
});
this.resizeObserver.observe(chartContainer);

// 렌더링 (외부 라이브러리만 try-catch)
function renderChart(response) {
    const { data } = response;
    if (!data) return;

    const option = { /* ... */ };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[Chart] setOption error:', error);
    }
}
```

---

## 이벤트 처리 패턴

### event.target.closest() 패턴

동적으로 생성된 요소의 dataset 접근:

```javascript
'@notificationClicked': ({ event, targetInstance }) => {
    // closest()로 부모 요소 찾기
    const item = event.target.closest('.notification-item');
    const { notificationId } = item?.dataset || {};
    console.log('Clicked:', notificationId);
}
```

**주의**: `event.target.dataset`은 클릭된 자식 요소의 dataset을 반환합니다.

### delegate와 event.target의 관계

**delegate의 역할 = 게이트키퍼 (판단자)**

```
[사용자 클릭]
     │
     ▼
[event.target = 실제 클릭된 요소 (예: span, icon)]
     │
     ▼
[delegate: closest(selector)로 판단]
     │
     ├─ 매칭 안됨 → 무시
     │
     └─ 매칭됨 → WEventBus.emit('@event', { event, targetInstance })
                                              │
                                              └─ event는 원본 그대로 전달
```

delegate 함수 (WKit.js):
```javascript
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    // closest로 셀렉터에 맞는 요소를 찾음
    const target = event.target.closest(selector);

    if (target && instance.element.contains(target)) {
      return handler.call(target, event);  // event는 원본 그대로 전달
    }
  };
  // ...
}
```

**관심사 분리**:
- **delegate**: "이 클릭이 `.notification-item` 영역 내에서 발생했는가?" 판단만 수행
- **이벤트 핸들러**: 비즈니스 로직 (어떤 데이터가 필요한지는 핸들러가 결정)

**왜 event.target을 수정하지 않는가**:
1. `event` 객체는 브라우저 네이티브 객체 - 수정은 안티패턴
2. WEventBus로 emit 시 원본 event 전달 - 유연성 유지
3. 핸들러가 필요한 정보를 직접 추출하도록 위임

---

## Mock Server

### 실행

```bash
cd mock_server
npm install
npm start  # port 3001
```

### API 엔드포인트

| Endpoint | 설명 |
|----------|------|
| GET /api/user | 사용자 정보 |
| GET /api/menu | 네비게이션 메뉴 |
| GET /api/notifications | 알림 목록 |
| GET /api/stats | 통계 데이터 |
| GET /api/chart | 차트 데이터 |

---

## datasetList.json 구조

```json
{
  "version": "3.2.0",
  "data": [
    {
      "name": "userapi",
      "dataset_id": "user-001",
      "page_id": "MASTER",
      "interval": "0",
      "rest_api": "{\"url\":\"http://localhost:3001/api/user\",\"method\":\"GET\",...}"
    }
  ]
}
```

**page_id**:
- `MASTER`: Master 레이어용 데이터셋
- `PAGE`: Page 레이어용 데이터셋

---

## 베스트 프랙티스

### DO

```javascript
// Guard clause로 데이터 검증
if (!data) return;

// closest()로 이벤트 타겟 찾기
const item = event.target.closest('.item');

// ResizeObserver로 차트 리사이즈
this.resizeObserver = new ResizeObserver(() => { ... });
```

### DON'T

```javascript
// 전체 함수를 try-catch로 감싸기 (버그 숨김)
function render(data) {
    try { /* 전체 로직 */ } catch (e) { }
}

// event.target.dataset 직접 접근 (자식 요소 문제)
const { id } = event.target.dataset;  // 부모가 아닌 자식의 dataset
```

---

## 작성 일시

- **최초 작성**: 2025-11-28
- **목적**: Master + Page 레이어 아키텍처 검증
