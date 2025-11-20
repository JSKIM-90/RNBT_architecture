# 런타임 프레임워크 설계 개요

> READ 중심 대시보드를 위한 이벤트 기반 컴포넌트 프레임워크

---

## 📋 목차

1. [문제 정의](#문제-정의)
2. [설계 철학](#설계-철학)
3. [아키텍처 개요](#아키텍처-개요)
4. [핵심 개념](#핵심-개념)
5. [데이터 흐름](#데이터-흐름)
6. [사용 패턴](#사용-패턴)
7. [차별점](#차별점)

---

## 문제 정의

### 타겟 시나리오

```
┌─────────────────────────────────────────────┐
│         비주얼 웹 빌더 애플리케이션          │
│                                             │
│  • HTML 에디터에서 템플릿 작성              │
│  • 브라우저 런타임에서 동적 실행            │
│  • READ 중심 대시보드 제작 (절대다수)       │
│  • 2D + 3D 통합 지원                        │
└─────────────────────────────────────────────┘
```

### 주요 요구사항

| 요구사항 | 설명 |
|---------|------|
| **컴포넌트 독립성** | 어떤 페이지에 조합되더라도 독립적으로 동작 |
| **이벤트 기반** | 화면 정보를 자동으로 이벤트에 전달 |
| **HTML 템플릿** | 사용자가 HTML 에디터에서 작성 가능 |
| **메모리 안전성** | 동적 스크립트 실행 시 메모리 누수 방지 |
| **2D/3D 통합** | DOM과 Three.js를 단일 이벤트 시스템으로 |

---

## 설계 철학

### 1. 컴포넌트 = 데이터 + 메서드

웹 컴포넌트 표준에서 영감을 받은 설계

```javascript
// 컴포넌트는 클래스처럼 동작
this.users = []                           // 데이터
this.renderTable = renderTable.bind(this) // 메서드

// 각 인스턴스는 독립적인 컨텍스트
function renderTable(data) {
  this.users = data;          // ✅ 자신의 상태
  this.element.innerHTML = ...; // ✅ 자신의 DOM
}
```

### 2. 화면 = 이벤트 데이터

READ 중심 대시보드는 화면에 표시된 정보만으로 충분

```javascript
// 2D: dataset에 정보 저장
<div class="bar" data-region="Seoul" data-sales="1000">

'@barClicked': ({ event }) => {
  const { region, sales } = event.target.dataset;
  showDetail(region, sales); // ✅ 즉시 사용
}

// 3D: userData에 정보 저장
mesh.userData = { equipmentId: 'E001', status: 'running' }

'@equipmentClicked': ({ event }) => {
  const { equipmentId } = event.intersects[0].object.userData;
  showDetail(equipmentId); // ✅ 즉시 사용
}
```

### 3. Primitive Building Blocks

프레임워크는 최소한의 primitive만 제공, 조합은 사용자에게

```javascript
// ✅ 프레임워크가 제공
WKit.fetchData(page, datasetName, param)
WKit.getInstanceByName(name, iter)
WEventBus.emit(eventName, { event, targetInstance })

// ✅ 사용자가 조합
'@userClicked': async ({ event, targetInstance }) => {
  const { userId } = event.target.dataset;
  const data = await WKit.fetchData(this, 'users', { id: userId });
  const panel = WKit.getInstanceByName('DetailPanel', iter);
  panel.showDetail(data);
}
```

---

## 아키텍처 개요

### 전체 구조

```
┌──────────────────────────────────────────────────────────┐
│                    User Script Layer                     │
│  (Component register/destroy, Page lifecycle scripts)   │
│                                                          │
│  Component: 데이터 + 메서드 캡슐화                        │
│  Page: 컴포넌트 조합 + 이벤트 처리                       │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│                  Framework Layer                         │
├──────────────────────────────────────────────────────────┤
│  WKit.js           │ 통합 파사드                         │
│                    │ • 2D 이벤트 위임 (delegate)         │
│                    │ • 3D 이벤트 (raycasting)            │
│                    │ • 리소스 관리 (dispose)             │
│                    │ • 헬퍼 함수 (fetchData, ...)        │
├──────────────────────────────────────────────────────────┤
│  WEventBus.js      │ Pub-Sub 이벤트 버스                 │
│                    │ • 컴포넌트 간 느슨한 결합           │
├──────────────────────────────────────────────────────────┤
│  GlobalDataPublisher.js │ 페이지 레벨 데이터 공유        │
│                    │ • Topic 기반 구독                   │
│                    │ • 자동 갱신 (auto-refresh)          │
├──────────────────────────────────────────────────────────┤
│  fx.js             │ 함수형 프로그래밍 유틸리티           │
│                    │ • 파이프라인 (go, pipe)             │
│                    │ • Lazy Evaluation (L.*)             │
└────────────────────┬─────────────────────────────────────┘
                     │
┌────────────────────┴─────────────────────────────────────┐
│                   Runtime Layer                          │
│  Browser APIs, Three.js, DOM, Data Service               │
└──────────────────────────────────────────────────────────┘
```

### 계층 간 책임

| 계층 | 책임 | 예시 |
|------|------|------|
| **User Script** | 비즈니스 로직 | 이벤트 핸들러, 렌더링 로직 |
| **Framework** | 인프라 제공 | 이벤트 전파, 생명주기 관리 |
| **Runtime** | 실행 환경 | DOM, Three.js, Network |

---

## 핵심 개념

### 1. 컴포넌트 독립성

```
┌─────────────────────────┐    ┌─────────────────────────┐
│   Component Instance A  │    │   Component Instance B  │
│                         │    │                         │
│  this.users = [...]     │    │  this.products = [...]  │
│  this.element = <div>   │    │  this.element = <div>   │
│  this.renderTable()     │    │  this.renderList()      │
│                         │    │                         │
│  ✅ 독립적인 상태        │    │  ✅ 독립적인 상태        │
│  ✅ 독립적인 DOM         │    │  ✅ 독립적인 DOM         │
└─────────────────────────┘    └─────────────────────────┘
```

**보장되는 것:**
- 각 컴포넌트는 독립적인 `this` 컨텍스트
- 데이터와 메서드가 `this`에 바인딩
- 다른 페이지에서 재사용 가능

### 2. 이벤트 기반 통신

```
┌────────────────┐
│   Component    │
│                │
│  customEvents  │
│  { click:      │
│    '.btn':     │
│    '@myEvent'  │──┐
│  }             │  │
└────────────────┘  │
                    │ emit
                    ▼
              ┌──────────────┐
              │  WEventBus   │
              └──────────────┘
                    │
                    │ { event, targetInstance }
                    ▼
              ┌──────────────┐
              │     Page     │
              │              │
              │ '@myEvent':  │
              │   handler    │
              └──────────────┘
```

**프레임워크가 전달하는 것:**

```javascript
{
  event,           // DOM Event | { intersects, ... }
  targetInstance   // 이벤트를 발생시킨 컴포넌트 인스턴스
}
```

**사용자가 선택하는 것:**
- `event.target.dataset` 사용 여부
- `targetInstance` 상태 접근 여부
- 추가 데이터 fetch 여부

### 3. 라이프사이클

```
Component Lifecycle:
┌──────────┐    ┌───────────┐    ┌──────────┐
│ register │───▶│ completed │───▶│ destroy  │
└──────────┘    └───────────┘    └──────────┘
     │               │                 │
     │               │                 │
     ▼               ▼                 ▼
  초기화          사용 가능        정리/해제
  - 메서드 bind   - 렌더링        - 이벤트 제거
  - 이벤트 등록   - 데이터 수신    - 구독 해제
  - 구독 등록     - 상호작용      - 메모리 해제


Page Lifecycle:
┌─────────────┐    ┌────────┐    ┌────────────────┐
│ before_load │───▶│ loaded │───▶│ before_unload  │
└─────────────┘    └────────┘    └────────────────┘
      │                │                  │
      │                │                  │
      ▼                ▼                  ▼
  이벤트 등록     데이터 발행        전체 정리
  - eventBus      - publish          - eventBus off
  - raycasting    - fetch            - unregister
                                     - dispose 3D
```

### 4. 2D/3D 통합

```
                   ┌─────────────────┐
                   │  Browser Event  │
                   │   (click, ...)  │
                   └────────┬────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
                ▼                      ▼
      ┌──────────────────┐   ┌──────────────────┐
      │   2D Delegate    │   │  3D Raycasting   │
      │                  │   │                  │
      │  • querySelectorAll│   │  • intersects    │
      │  • closest()     │   │  • object.userData│
      └────────┬─────────┘   └────────┬─────────┘
               │                      │
               └──────────┬───────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │  WEventBus   │
                  │              │
                  │  emit(       │
                  │    event,    │
                  │    instance  │
                  │  )           │
                  └──────────────┘
```

**동일한 인터페이스:**
```javascript
// 2D
'@chartClicked': ({ event, targetInstance }) => { ... }

// 3D
'@equipmentClicked': ({ event, targetInstance }) => { ... }
```

---

## 데이터 흐름

### READ 중심 대시보드의 전형적인 흐름

```
1. 초기 로드
──────────────────────────────────────────────────────
Page: before_load
  │
  ├─ 이벤트 핸들러 등록 (WEventBus)
  └─ Raycasting 초기화 (3D)

Component: register
  │
  ├─ 메서드 바인딩 (this.render = render.bind(this))
  ├─ 이벤트 바인딩 (customEvents)
  └─ 데이터 구독 (GlobalDataPublisher)

Page: loaded (모든 컴포넌트 completed 후)
  │
  ├─ GlobalDataPublisher.registerMapping()
  └─ GlobalDataPublisher.fetchAndPublish()
       │
       └─▶ 구독한 컴포넌트들에게 자동 전파
            │
            └─▶ Component.render(data)


2. 사용자 상호작용
──────────────────────────────────────────────────────
User: 화면 클릭
  │
  ├─ 2D: event.target.dataset
  └─ 3D: event.intersects[0].object.userData
       │
       └─▶ WEventBus.emit('@customEvent', { event, targetInstance })
            │
            └─▶ Page Event Handler
                 │
                 ├─ 화면 정보 추출 (dataset/userData)
                 ├─ 필요시 추가 데이터 fetch
                 └─ 다른 컴포넌트 업데이트


3. 페이지 이동 (정리)
──────────────────────────────────────────────────────
Page: before_unload
  │
  ├─ WEventBus.off() (이벤트 핸들러 제거)
  ├─ GlobalDataPublisher.unregisterMapping()
  └─ dispose3DTree() (Three.js 리소스)

Component: destroy
  │
  ├─ removeCustomEvents()
  ├─ GlobalDataPublisher.unsubscribe()
  └─ 메서드 null 처리
```

### GlobalDataPublisher 패턴 (페이지 레벨 데이터 공유)

```
Page
────────────────────────────────────────────
registerMapping({
  topic: 'sales',
  datasetInfo: { datasetName: 'api', param: {...} }
})
  │
  ▼
┌─────────────────────────┐
│  GlobalDataPublisher    │
│                         │
│  Topic: 'sales'         │
│    ├─ datasetInfo       │
│    └─ subscribers: [    │
│         Component A,    │
│         Component B,    │
│         Component C     │
│       ]                 │
└─────────────────────────┘
  │
  │ fetchAndPublish('sales', page)
  ▼
Fetch Data ──▶ Publish to all subscribers
                │
                ├─▶ Component A.renderChart(data)
                ├─▶ Component B.renderTable(data)
                └─▶ Component C.updateCount(data)
```

**장점:**
- 한 번 fetch, 여러 컴포넌트 업데이트
- 컴포넌트는 subscribe만 하면 됨
- 필터 변경 시 자동 반영 (param 병합)

---

## 사용 패턴

### 패턴 1: 기본 이벤트 처리

```javascript
// Component: 이벤트 선언
this.customEvents = {
  click: {
    '.chart-bar': '@barClicked'
  }
}

// HTML Template
<div class="chart-bar" data-region="Seoul" data-sales="1000">

// Page: 이벤트 처리
this.eventBusHandlers = {
  '@barClicked': ({ event }) => {
    const { region, sales } = event.target.dataset;
    console.log(`${region}: ${sales}`);
  }
}
```

### 패턴 2: 데이터 구독 및 렌더링

```javascript
// Component: 구독 선언
this.subscriptions = {
  users: ['renderTable', 'updateCount']
}

this.renderTable = function(data) {
  this.users = data;
  this.element.innerHTML = this.template(data);
}.bind(this);

// Page: 데이터 발행
this.globalDataMappings = [{
  topic: 'users',
  datasetInfo: {
    datasetName: 'api',
    param: { limit: 20 }
  }
}];

// loaded 시점에 자동 fetch & publish
fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```

### 패턴 3: 3D 이벤트 처리

```javascript
// Component: 3D 이벤트 선언
this.customEvents = {
  click: '@equipmentClicked'
}

// Three.js Mesh에 정보 저장
mesh.userData = {
  equipmentId: 'E001',
  status: 'running'
}

// Page: 3D 이벤트 처리
this.eventBusHandlers = {
  '@equipmentClicked': ({ event }) => {
    const { equipmentId, status } = event.intersects[0].object.userData;
    detailPanel.showEquipment(equipmentId, status);
  }
}
```

### 패턴 4: 필터 및 동적 갱신

```javascript
// Component: 필터 UI
this.customEvents = {
  change: {
    '.filter-select': '@filterChanged'
  }
}

// Page: 필터 적용 (param 병합)
this.eventBusHandlers = {
  '@filterChanged': ({ event }) => {
    const filter = event.target.value;

    // 기존 param과 병합하여 다시 fetch
    GlobalDataPublisher.fetchAndPublish('sales', this, {
      filter  // limit 등 다른 param은 유지됨
    });
  }
}
```

---

## 차별점

### vs React/Vue (CRUD 중심)

| 항목 | React/Vue | 이 프레임워크 |
|------|-----------|--------------|
| **주요 용도** | CRUD 앱 (상태 변경 빈번) | READ 대시보드 (조회 중심) |
| **데이터 전달** | props, 클로저 | 화면 정보 (dataset/userData) |
| **렌더링** | JSX, Template 디렉티브 | HTML Template 문자열 |
| **이벤트** | 직접 전달 `onClick={handler}` | 이벤트 버스 + 화면 정보 |
| **상태 관리** | 복잡 (useState, Vuex) | 단순 (컴포넌트 내부 상태) |
| **학습 곡선** | 높음 | 낮음 (HTML + JavaScript) |

### vs Alpine.js/HTMX (HTML 중심)

| 항목 | Alpine.js | HTMX | 이 프레임워크 |
|------|-----------|------|--------------|
| **HTML 순수성** | 낮음 (x-* 속성) | 높음 (hx-*) | 높음 (표준 data-*) |
| **3D 지원** | ❌ | ❌ | ✅ 네이티브 |
| **이벤트 시스템** | 템플릿 내 표현식 | 서버 응답 | WEventBus (Pub-Sub) |
| **컴포넌트화** | 제한적 | 제한적 | 완전한 캡슐화 |

### vs Grafana/Power BI (대시보드)

| 항목 | Grafana/Power BI | 이 프레임워크 |
|------|------------------|--------------|
| **커스터마이징** | 제한적 | 완전한 자유 |
| **3D 지원** | ❌ | ✅ |
| **코드 제어** | 플러그인 시스템 | 직접 코드 작성 |
| **비용** | 유료/제한 | 오픈 |

---

## 핵심 강점 요약

### 1. 단순성

```javascript
// ✅ 선언적이고 명확
this.customEvents = { click: { '.btn': '@myEvent' } }
'@myEvent': ({ event }) => { ... }
```

### 2. 독립성

```javascript
// ✅ 컴포넌트는 어디서든 동작
this.renderTable = function(data) {
  this.users = data;
  this.element.innerHTML = ...;
}.bind(this);
```

### 3. 유연성

```javascript
// ✅ Primitive 조합으로 자유로운 로직
const data = await WKit.fetchData(this, 'api', param);
const instance = WKit.getInstanceByName('Panel', iter);
instance.update(data);
```

### 4. 2D/3D 통합

```javascript
// ✅ 동일한 이벤트 패러다임
'@2dClicked': ({ event }) => { event.target.dataset }
'@3dClicked': ({ event }) => { event.intersects[0].object.userData }
```

### 5. 메모리 안전

```javascript
// ✅ 자동 정리
before_unload → dispose3DTree → removeEventListeners → unsubscribe
```

---

## 결론

**이 프레임워크는:**

- ✅ READ 중심 대시보드에 최적화
- ✅ HTML 에디터 기반 비주얼 빌더에 적합
- ✅ 웹 컴포넌트 철학 (데이터 + 메서드)
- ✅ 이벤트 기반 아키텍처 (느슨한 결합)
- ✅ 2D/3D 통합 (독특한 강점)
- ✅ Primitive Building Blocks (유연성)

**비교 대상:**
- ~~React/Vue~~ → CRUD 앱용 (비교 부적절)
- ✅ Grafana/Power BI → 대시보드 (비교 적절)
- ✅ Alpine.js/HTMX → HTML 중심 (비교 적절)

**핵심 메시지:**
> "화면에 표시된 정보 = 이벤트로 전달되는 정보"

**개발자는 데이터를 전달하는 코드를 작성하지 않습니다.**
**프레임워크가 자동으로 `{ event, targetInstance }`를 제공합니다.**

---

## 부록: 코드 샘플

### 완전한 컴포넌트 예제

```javascript
// Component: UserTable
// ──────────────────────────────────────────

// register
const { subscribe } = GlobalDataPublisher;

// 1. 데이터 구조
this.subscriptions = {
  users: ['renderTable']
}

// 2. 이벤트 선언
this.customEvents = {
  click: {
    '.user-row': '@userRowClicked'
  }
}

// 3. 메서드 정의
this.renderTable = function(data) {
  this.users = data;
  this.element.innerHTML = data.map((user, index) => `
    <div class="user-row" data-user-id="${user.id}">
      ${user.name}
    </div>
  `).join('');
}.bind(this);

// 4. 이벤트 바인딩
WKit.bindEvents(this, this.customEvents);

// 5. 데이터 구독
subscribe('users', this, this.renderTable);

// destroy
GlobalDataPublisher.unsubscribe('users', this);
WKit.removeCustomEvents(this, this.customEvents);
```

### 완전한 페이지 예제

```javascript
// Page: Dashboard
// ──────────────────────────────────────────

// before_load
const { fetchData } = WKit;

// 1. 이벤트 핸들러 정의
this.eventBusHandlers = {
  '@userRowClicked': async ({ event }) => {
    const { userId } = event.target.dataset;
    const user = await fetchData(this, 'users', { id: userId });

    const panel = WKit.getInstanceByName('DetailPanel',
      WKit.makeIterator(this));
    panel.showDetail(user);
  },

  '@filterChanged': ({ event }) => {
    const filter = event.target.value;
    GlobalDataPublisher.fetchAndPublish('users', this, { filter });
  }
}

// 2. 이벤트 핸들러 등록
WKit.onEventBusHandlers(this.eventBusHandlers);

// loaded
// 3. 글로벌 데이터 매핑
this.globalDataMappings = [{
  topic: 'users',
  datasetInfo: {
    datasetName: 'api',
    param: { limit: 20 }
  }
}];

// 4. 데이터 발행
fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// before_unload
// 5. 정리
WKit.offEventBusHandlers(this.eventBusHandlers);
fx.go(
  this.globalDataMappings,
  fx.map(({ topic }) => topic),
  fx.each(GlobalDataPublisher.unregisterMapping)
);
```

---

**문서 버전**: 2.0.0
**작성일**: 2025-11-20
**작성자**: 런타임 프레임워크 팀
