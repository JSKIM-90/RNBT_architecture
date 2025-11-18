# RENOBIT 표준 패턴 아키텍처

## 문제 인식

**RENOBIT의 현재 문제점**:
- 페이지/컴포넌트 영역, 라이프사이클별 코드 패턴이 표준화되지 않음
- 각 개발자가 제각각 구현 → 일관성 부재
- 프론트엔드 가치 희박 (범용 컴포넌트만 제공)

**해결 방향**:
- **표준 패턴** 정립
- **도메인 컴포넌트** 라이브러리 구축
- AI/MCP Server 기반 자동화

---

## 핵심 아키텍처 원칙

### 1. 단방향 데이터 흐름

```
페이지 (Data Publisher)
  ↓ 데이터 전달
컴포넌트 (Data Subscriber)
  ↓ 이벤트 발산
페이지 (Event Handler)
  ↓ 메소드 호출 / 데이터 전달
컴포넌트 (Business Logic 실행)
```

**규칙**:
- ✅ 페이지만 데이터를 fetch
- ❌ 컴포넌트는 fetch 금지
- ✅ 컴포넌트는 데이터 구독만
- ✅ 컴포넌트는 이벤트 발산만 (처리 금지)

---

### 2. 역할 분리

#### 페이지의 역할

```javascript
[before_load]
- 전역 데이터 등록 (GlobalDataPublisher.registerMapping)
- 데이터 fetch & 발행 (fetchAndPublish)

[loaded]
- 이벤트 핸들러 등록 (WEventBus.on)
- 컴포넌트 메소드 호출
- 데이터 전달 (구독 or 이벤트 기반)

[before_unload]
- 리소스 정리
```

**페이지 = 데이터 관리자 + 이벤트 오케스트레이터**

---

#### 컴포넌트의 역할

```javascript
[register]
- 구독 메타정보 정의 (this.subscriptions)
- 이벤트 메타정보 정의 (this.customEvents)
- 데이터 매핑 메타정보 정의 (this.dataMapping)
- 비즈니스 메소드 구현

[destroy]
- 리소스 정리
```

**컴포넌트 = 데이터 구독자 + 이벤트 발산자 + 비즈니스 로직 보유자**

---

### 3. 컴포넌트 클래스 구조

```javascript
// 도메인 컴포넌트 예시: EquipmentMonitor
class EquipmentMonitor {
  // 메타정보: 어떤 데이터를 구독할 것인가
  subscriptions = {
    equipmentStatus: ['renderTable', 'updateAlertBadge']
  }

  // 메타정보: 어떤 이벤트를 발산할 것인가
  customEvents = {
    click: {
      '.equipment-row': '@equipmentClicked',
      '.alert-button': '@alertButtonClicked'
    }
  }

  // 비즈니스 로직
  renderTable(data) {
    // 설비 상태 테이블 렌더링
  }

  updateAlertBadge(data) {
    // 알람 배지 업데이트
  }
}
```

**컴포넌트는 "무엇을" 정의, "언제" 실행은 페이지가 결정**

---

## Utils의 역할

### GlobalDataPublisher.js
**전역 데이터 퍼블리싱 시스템**

```javascript
// 페이지에서
GlobalDataPublisher.registerMapping({ topic, datasetInfo });
GlobalDataPublisher.fetchAndPublish('users', page);

// 컴포넌트에서
GlobalDataPublisher.subscribe('users', this, this.renderTable);
```

**역할**:
- 페이지 레벨 데이터 관리
- Topic 기반 구독 패턴
- 단방향 데이터 전파

---

### WEventBus.js
**컴포넌트 간 통신**

```javascript
// 컴포넌트: 이벤트 발산만
WEventBus.emit('@equipmentClicked', { event, targetInstance });

// 페이지: 이벤트 처리
WEventBus.on('@equipmentClicked', async ({ targetInstance }) => {
  const data = await pipeForDataMapping(targetInstance);
  targetInstance.showDetail(data);
});
```

**역할**:
- 컴포넌트의 이벤트 발산
- 페이지의 이벤트 수신 및 처리
- 느슨한 결합

---

### WKit.js
**통합 유틸리티**

```javascript
// 데이터 매핑 파이프라인
pipeForDataMapping(targetInstance)

// 이벤트 바인딩
bindEvents(instance, customEvents)

// 데이터 fetch (페이지만 사용)
fetchData(page, datasetName, param)

// 인스턴스 검색
getInstanceByName(name, iterator)
```

**역할**:
- 데이터 매핑 자동화
- 이벤트 바인딩 추상화
- 헬퍼 함수 제공

---

## 표준 패턴 구현

### 패턴 1: 전역 데이터 구독

**페이지 (before_load)**:
```javascript
this.globalDataMappings = [
  {
    topic: 'equipmentStatus',
    datasetInfo: {
      datasetName: 'factoryApi',
      param: { endpoint: '/equipment/status' }
    }
  }
];

fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```

**컴포넌트 (register)**:
```javascript
this.subscriptions = {
  equipmentStatus: ['renderTable', 'updateChart']
};

fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, fnList]) =>
    fx.each(fn => GlobalDataPublisher.subscribe(topic, this, this[fn]), fnList)
  )
);

function renderTable(data) {
  // 비즈니스 로직
}
```

---

### 패턴 2: 이벤트 기반 데이터 매핑

**컴포넌트 (register)**:
```javascript
this.customEvents = {
  click: {
    '.equipment-row': '@equipmentClicked'
  }
};

this.dataMapping = [
  {
    ownerId: this.id,
    visualInstanceList: ['DetailChart'],
    datasetInfo: {
      datasetName: 'factoryApi',
      param: { endpoint: '/equipment/detail', id: this.id }
    }
  }
];

WKit.bindEvents(this, this.customEvents);
```

**페이지 (loaded)**:
```javascript
this.eventBusHandlers = {
  '@equipmentClicked': async ({ targetInstance }) => {
    const [mappingResult] = await WKit.pipeForDataMapping(targetInstance);
    const { data, visualInstanceList } = mappingResult;

    // 시각화 컴포넌트에 데이터 전달
    visualInstanceList[0]?.updateChart(data);
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);
```

---

### 패턴 3: 컴포넌트 메소드 호출

**페이지가 컴포넌트 제어**:
```javascript
// 페이지 이벤트 핸들러에서
this.eventBusHandlers = {
  '@refreshButtonClicked': async () => {
    // 1. 데이터 fetch
    const data = await WKit.fetchData(this, 'factoryApi', { endpoint: '/latest' });

    // 2. 컴포넌트 찾기
    const tableComponent = WKit.getInstanceByName(
      'EquipmentTable',
      WKit.makeIterator(this)
    );

    // 3. 컴포넌트 메소드 호출
    tableComponent?.renderTable(data);
  }
};
```

---

## 도메인 컴포넌트 라이브러리 전략

### 컴포넌트 설계 원칙

**1. 메타정보 중심**:
```javascript
// ❌ 데이터를 직접 fetch
async function loadData() {
  const data = await fetch('/api/equipment');
  // ...
}

// ✅ 데이터 요구사항을 메타정보로 정의
this.dataMapping = [
  {
    ownerId: this.id,
    visualInstanceList: ['Chart'],
    datasetInfo: { datasetName: 'equipment', param: { id: this.id } }
  }
];
```

**2. 비즈니스 로직 캡슐화**:
```javascript
class EquipmentMonitor {
  renderTable(data) {
    // 설비별 렌더링 로직
    const rows = data.map(item => this.createRow(item));
    this.updateDOM(rows);
  }

  createRow(item) {
    // 도메인 특화 로직
    const status = this.getStatusBadge(item.status);
    const alert = this.checkAlert(item);
    return { ...item, status, alert };
  }

  getStatusBadge(status) {
    // 제조 도메인 지식
    const badges = {
      running: 'success',
      idle: 'warning',
      error: 'danger'
    };
    return badges[status] || 'secondary';
  }
}
```

**3. 재사용 가능한 구조**:
```javascript
// 기본 컴포넌트
class DataTable {
  renderTable(data) { /* 범용 테이블 로직 */ }
}

// 도메인 컴포넌트 (상속)
class EquipmentTable extends DataTable {
  renderTable(data) {
    // 도메인 특화 전처리
    const processed = this.processEquipmentData(data);
    super.renderTable(processed);
  }

  processEquipmentData(data) {
    // 설비 데이터 특화 로직
  }
}
```

---

### 도메인별 컴포넌트 라이브러리

**제조 (Manufacturing)**:
```
@company/manufacturing-components
├── EquipmentMonitor
├── ProcessFlowDiagram
├── ProductionStatusBoard
├── MaintenanceScheduler
└── QualityControlChart
```

**물류 (Logistics)**:
```
@company/logistics-components
├── InventoryTracker
├── ShipmentTracker
├── WarehouseHeatmap
├── DeliveryRouteMap
└── OrderStatusBoard
```

**에너지 (Energy)**:
```
@company/energy-components
├── PowerConsumptionChart
├── FacilityController
├── SolarPanelMonitor
├── BatteryStatusGauge
└── EnergyFlowDiagram
```

---

### 라이브러리 축적 프로세스

```
프로젝트 A 수행
↓
설비 모니터링 컴포넌트 개발
↓
표준 패턴 준수 검증
↓
도메인 컴포넌트 라이브러리 등록
↓
프로젝트 B에서 재사용
↓
피드백 반영 및 개선
↓
라이브러리 버전업
```

**핵심**: 프로젝트마다 컴포넌트가 쌓이고, 다음 프로젝트는 더 빠르게

---

## AI/MCP Server 활용 전략

### MCP Server로 도메인 컴포넌트 퍼블리싱

```
개발자: "제조 설비 모니터링 화면 만들어줘"
  ↓
AI + MCP Server:
  1. 도메인 컴포넌트 라이브러리 검색
  2. EquipmentMonitor 컴포넌트 발견
  3. 페이지 before_load 스크립트 자동 생성
  4. 컴포넌트 배치 및 연결
  5. 이벤트 핸들러 스크립트 생성
  ↓
개발 시간: 2일 → 2시간
```

**MCP Server 역할**:
- 도메인 컴포넌트 카탈로그 관리
- 표준 패턴 코드 생성
- 컴포넌트 배치 자동화
- 데이터 매핑 스크립트 생성

---

## 가치 제안

### 현재 (패턴 없음)
```
프로젝트마다 처음부터 구현
├── Bootstrap 컴포넌트 배치
├── 비즈니스 로직 수동 작성
├── 이벤트 처리 수동 작성
└── 데이터 연동 수동 작성

개발 시간: 100% (기준)
재사용률: 0%
```

### 표준 패턴 + 도메인 컴포넌트
```
라이브러리에서 컴포넌트 선택
├── 설정만으로 80% 구현
├── 커스터마이징 20%만 필요
└── 패턴 준수로 유지보수 용이

개발 시간: 30%
재사용률: 70%
```

### 표준 패턴 + 도메인 컴포넌트 + AI
```
AI가 자동 구성
├── 도메인 컴포넌트 자동 선택
├── 표준 패턴 코드 자동 생성
└── 개발자는 검토 및 미세 조정만

개발 시간: 10%
재사용률: 90%
```

---

## 구현 로드맵

### Phase 1: 표준 패턴 정립 (현재)
- [x] Utils 구현 (GlobalDataPublisher, WEventBus, WKit)
- [ ] 패턴 문서화
- [ ] 샘플 프로젝트 구축

### Phase 2: 도메인 컴포넌트 축적
- [ ] 첫 번째 프로젝트로 5개 도메인 컴포넌트 개발
- [ ] 컴포넌트 라이브러리 구조 확립
- [ ] 버전 관리 및 배포 프로세스

### Phase 3: AI 통합
- [ ] MCP Server 개발 (도메인 컴포넌트 카탈로그)
- [ ] 코드 생성 프롬프트 최적화
- [ ] Claude Code와 통합

---

## 결론

**RENOBIT의 진정한 가치는 이제부터**:

```
범용 컴포넌트 (낮은 가치)
  ↓
표준 패턴 정립 (토대)
  ↓
도메인 컴포넌트 축적 (핵심 가치)
  ↓
AI 자동화 (차별화)
```

**이 전략이 없으면**: RENOBIT ≈ Bootstrap + Three.js
**이 전략이 있으면**: RENOBIT = 도메인 특화 저코드 플랫폼

---

**문서 버전**: 1.0.0
**작성일**: 2025-11-18
