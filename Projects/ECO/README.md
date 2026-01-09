# ECO (Energy & Cooling Operations) Dashboard

데이터센터 전력/냉방 장비 모니터링 대시보드

## 컴포넌트 구조

```
page/
├── components/
│   ├── AssetList/           # 자산 목록 (일반 2D 컴포넌트)
│   ├── UPS/                 # 무정전 전원장치 (자기완결 3D 컴포넌트)
│   ├── PDU/                 # 분전반 (자기완결 3D 컴포넌트)
│   ├── CRAC/                # 항온항습기 (자기완결 3D 컴포넌트)
│   └── TempHumiditySensor/  # 온습도 센서 (자기완결 3D 컴포넌트)
└── page_scripts/
    ├── before_load.js       # 이벤트 핸들러 등록 + 3D raycasting
    ├── loaded.js            # GlobalDataPublisher 데이터 발행
    └── before_unload.js     # 정리 (구독, 이벤트, 3D 리소스)
```

## 컴포넌트 패턴

### AssetList (일반 2D 컴포넌트)

**역할**: 자산 목록 표시, 검색/필터링 UI

**데이터 흐름**:
- GlobalDataPublisher의 `assets` topic 구독
- 페이지(loaded.js)에서 데이터 발행 → 컴포넌트가 수신하여 렌더링

**이벤트 구분**:
- **내부 이벤트**: 검색, 타입 필터, 상태 필터 (컴포넌트 자체 UI 상태 관리)
- **외부 이벤트**: 새로고침 버튼(`@refreshClicked`), 행 클릭(`@assetSelected`)

### 자기완결 3D 컴포넌트 (UPS, PDU, CRAC, TempHumiditySensor)

**역할**: 3D 모델링된 실제 장비 표현 + 상세 팝업

**특징**:
- 자기 데이터를 스스로 조회 (`fetchData`)
- Shadow DOM 팝업 생성/관리
- `showDetail(assetId?)` - 파라미터로 다른 자산도 팝업 가능

**이벤트 발행**: `@upsClicked`, `@pduClicked`, `@cracClicked`, `@sensorClicked`

## 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  Page (loaded.js)                                                │
│                                                                  │
│  globalDataMappings → GlobalDataPublisher.fetchAndPublish        │
│       ↓                                                          │
│  'assets' topic 발행                                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  AssetList (subscribe)                                           │
│                                                                  │
│  구독: 'assets' → renderTable()                                   │
│  내부: 검색/필터 → 로컬 상태 변경 → 테이블 필터링                      │
│  외부: @refreshClicked → 페이지가 재발행                            │
│        @assetSelected → 페이지가 팝업 컴포넌트 호출                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  3D 오브젝트 클릭                                                 │
│                                                                  │
│  @upsClicked → before_load.js 핸들러                              │
│       → targetInstance.showDetail() (기본 assetId)                │
└─────────────────────────────────────────────────────────────────┘
```

## 이벤트 설계

### 핵심 원칙

```
컴포넌트는 이벤트 발송만 → 페이지가 제어권 보유 → Public API 호출
```

### 페이지 핸들러 (before_load.js)

```javascript
this.eventBusHandlers = {
    // 3D 클릭 이벤트
    '@upsClicked': ({ event, targetInstance }) => {
        if (isDragEvent(event)) return;
        targetInstance.showDetail();  // 기본 assetId
    },

    // AssetList 이벤트
    '@assetSelected': ({ event }) => {
        const { asset } = event;
        const component = findComponent(this.page, COMPONENT_MAP[asset.type]);
        component?.showDetail(asset.id);  // 선택된 assetId
    },

    '@refreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('assets', this, this.currentParams.assets);
    }
};
```

### 내부 vs 외부 이벤트 (AssetList)

```javascript
// 내부 이벤트 - addEventListener로 직접 등록
this._internalHandlers = {
    searchInput: (e) => this.search(e.target.value),
    typeChange: (e) => this.filterByType(e.target.value),
    statusChange: (e) => this.filterByStatus(e.target.value)
};

// 외부 이벤트 - bindEvents + Weventbus.emit
this.customEvents = {
    click: { '.refresh-btn': '@refreshClicked' }
};

// 행 클릭 → 외부 이벤트 발행
Weventbus.emit('@assetSelected', { event: { asset }, targetInstance: this });
```

## Public API

### AssetList

```javascript
search(term)           // 검색어로 필터링 (내부 상태)
filterByType(type)     // 타입으로 필터링 (내부 상태)
filterByStatus(status) // 상태로 필터링 (내부 상태)
```

### 팝업 컴포넌트 (UPS, PDU, CRAC, TempHumiditySensor)

```javascript
showDetail(assetId?)   // 팝업 표시 (동적 assetId 지원)
hideDetail()           // 팝업 숨김
```

## 실행

```bash
cd mock_server
npm install
npm start  # port 3004
```

## API 엔드포인트

| 엔드포인트 | 설명 |
|------------|------|
| GET /api/assets | 전체 자산 목록 |
| GET /api/ups/:id | UPS 상태 |
| GET /api/ups/:id/history | UPS 히스토리 |
| GET /api/pdu/:id | PDU 상태 |
| GET /api/pdu/:id/circuits | PDU 회로 목록 |
| GET /api/pdu/:id/history | PDU 히스토리 |
| GET /api/crac/:id | CRAC 상태 |
| GET /api/crac/:id/history | CRAC 히스토리 |
| GET /api/sensor/:id | 센서 상태 |
| GET /api/sensor/:id/history | 센서 히스토리 |
