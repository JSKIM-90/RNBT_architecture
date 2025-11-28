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

---

## 핵심 모듈 (Utils/)

### fx.js - 함수형 프로그래밍 라이브러리

```javascript
// 파이프라인 기반 데이터 처리
fx.go(
    data,
    fx.map(transform),
    fx.filter(predicate),
    fx.each(process)
);
```

### WEventBus.js - 이벤트 버스

```javascript
// 컴포넌트 간 느슨한 결합
WEventBus.emit('@myEvent', { event, targetInstance });
WEventBus.on('@myEvent', handler);
```

### GlobalDataPublisher.js - 글로벌 데이터 발행 시스템

```javascript
// Topic 기반 pub-sub
GlobalDataPublisher.registerMapping({ topic, datasetInfo });
GlobalDataPublisher.subscribe(topic, instance, handler);
GlobalDataPublisher.fetchAndPublish(topic, page);
```

### WKit.js - 통합 유틸리티 킷

```javascript
// 이벤트 바인딩, 데이터 fetch, 리소스 관리
WKit.bindEvents(instance, customEvents);
WKit.fetchData(page, datasetName, param);
WKit.dispose3DTree(element);
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
├── example_basic_01/               # Page Only 예제 (IoT 대시보드)
│   ├── page/
│   │   ├── page_scripts/
│   │   └── components/
│   ├── mock_server/
│   ├── datasetList.json
│   └── DESIGN_PROCESS.md
│
├── example_master_01/              # Master + Page 예제
│   ├── master/
│   │   ├── common_component/
│   │   └── components/
│   ├── page/
│   │   ├── page_scripts/
│   │   └── components/
│   ├── mock_server/
│   ├── datasetList.json
│   └── README.md
│
├── CLAUDE.md                       # 상세 기술 문서
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

## 상세 문서

- [CLAUDE.md](./CLAUDE.md) - 프레임워크 상세 기술 문서
- [example_basic_01/DESIGN_PROCESS.md](./example_basic_01/DESIGN_PROCESS.md) - Page Only 설계 문서
- [example_master_01/README.md](./example_master_01/README.md) - Master + Page 설계 문서

---

## 버전

- **문서 버전**: 1.0.0
- **최종 업데이트**: 2025-11-28
