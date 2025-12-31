# Tutorial Dashboard - 교육용 예제

> RNBT 아키텍처 학습을 위한 교육용 대시보드 예제

## 목적

이 예제는 RNBT 아키텍처의 핵심 패턴을 학습하기 위해 설계되었습니다.

- **패턴 중심**: 복잡한 기능보다 아키텍처 패턴이 선명하게 드러남
- **역할 분명**: 컴포넌트와 페이지의 책임이 명확히 구분됨
- **기본에 충실**: 확장 가능한 기본 구조 제시

---

## 아키텍처 구조

```
example_tutorial/
├── mock_server/                    # Express API 서버 (port 3003)
│   ├── server.js
│   └── package.json
│
├── master/                         # MASTER 레이어 (앱 전역)
│   └── page/
│       ├── page_scripts/
│       │   ├── before_load.js      # 이벤트 핸들러 등록
│       │   ├── loaded.js           # 데이터 매핑 및 발행
│       │   └── before_unload.js    # 리소스 정리
│       └── components/
│           ├── Header/             # 사용자 정보
│           └── Sidebar/            # 네비게이션 메뉴
│
├── page/                           # PAGE 레이어 (페이지별)
│   ├── page_scripts/
│   │   ├── before_load.js          # 이벤트 핸들러 + currentParams
│   │   ├── loaded.js               # 데이터 매핑 + 인터벌
│   │   └── before_unload.js        # 리소스 정리
│   └── components/
│       ├── StatsCards/             # 통계 카드 (Summary Config)
│       ├── DataTable/              # 데이터 테이블 (Table Config + Tabulator)
│       └── TrendChart/             # 트렌드 차트 (Chart Config + ECharts)
│
├── datasetList.json                # API 엔드포인트 정의
└── README.md
```

---

## 생명주기

### Master 생명주기

| 시점 | 파일 | 책임 |
|------|------|------|
| 앱 시작 | `before_load.js` | 이벤트 핸들러 등록 |
| 앱 시작 | `loaded.js` | 데이터 매핑 등록 및 발행 |
| 앱 종료 | `before_unload.js` | 리소스 정리 |

### Page 생명주기

| 시점 | 파일 | 책임 |
|------|------|------|
| 페이지 진입 | `before_load.js` | 이벤트 핸들러 등록, currentParams 초기화 |
| 페이지 진입 | `loaded.js` | 데이터 매핑 등록, 초기 발행, 인터벌 시작 |
| 페이지 이탈 | `before_unload.js` | 인터벌 정지, 리소스 정리 |

### 컴포넌트 생명주기

| 시점 | 파일 | 책임 |
|------|------|------|
| 초기화 | `register.js` | 구독 등록, 이벤트 바인딩, 렌더 함수 정의 |
| 제거 | `beforeDestroy.js` | 구독 해제, 이벤트 해제, 인스턴스 정리 |

---

## 핵심 패턴

### 1. 역할 분리

```
컴포넌트: 렌더링만 담당
   ↓ 이벤트 발행 (@eventName)
페이지: 오케스트레이션 담당
   ↓ 파라미터 변경 후 데이터 재발행
GlobalDataPublisher → 컴포넌트로 데이터 전달
```

### 2. 구독 패턴

```javascript
// register.js
this.subscriptions = {
    topicName: ['renderFunction1', 'renderFunction2']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);
```

### 3. 이벤트 패턴

```javascript
// 컴포넌트: 이벤트 발행
this.customEvents = {
    click: { '.button': '@buttonClicked' }
};
bindEvents(this, this.customEvents);

// 페이지: 이벤트 처리
this.eventBusHandlers = {
    '@buttonClicked': ({ event }) => {
        // 처리 로직
    }
};
onEventBusHandlers(this.eventBusHandlers);
```

### 4. Config 패턴

```javascript
// Field Config
const config = {
    fields: [
        { key: 'name', selector: '.user-name' },
        { key: 'avatar', selector: '.avatar', attr: 'src' }
    ]
};

// Summary Config
const config = [
    { key: 'revenue', label: 'Revenue', icon: '💰', format: v => `$${v}` }
];

// Table Config
const tableConfig = {
    columns: [...],
    optionBuilder: getTableOptions
};

// Chart Config
const chartConfig = {
    xKey: 'labels',
    seriesKey: 'series',
    optionBuilder: getChartOptions
};
```

### 5. Param 패턴

```javascript
// before_load.js: 상태 초기화
this.currentParams = {
    tableData: { category: 'all' },
    chartData: { period: '7d' }
};

// 이벤트 핸들러: 파라미터 변경 후 재발행
'@filterChanged': ({ event }) => {
    this.currentParams.tableData = { category: event.target.value };
    GlobalDataPublisher.fetchAndPublish('tableData', this, this.currentParams.tableData);
}
```

---

## 데이터셋 정의

| Topic | Dataset | 용도 | 갱신 | 레이어 |
|-------|---------|------|------|--------|
| userInfo | userApi | Header 사용자 정보 | - | MASTER |
| menuList | menuApi | Sidebar 메뉴 | - | MASTER |
| stats | statsApi | StatsCards | 10초 | PAGE |
| tableData | tableApi | DataTable | 30초 | PAGE |
| chartData | chartApi | TrendChart | 15초 | PAGE |

---

## 컴포넌트별 특징

### Header (Master)
- **패턴**: Field Config
- **구독**: userInfo
- **이벤트**: @userMenuClicked

### Sidebar (Master)
- **패턴**: Template 기반 동적 렌더링
- **구독**: menuList
- **이벤트**: @navItemClicked → 콘솔 출력 (페이지 이동)

### StatsCards (Page)
- **패턴**: Summary Config
- **구독**: stats (10초 갱신)
- **이벤트**: @cardClicked

### DataTable (Page)
- **패턴**: Table Config + optionBuilder
- **라이브러리**: Tabulator
- **구독**: tableData (30초 갱신)
- **이벤트**: @filterChanged, @rowClicked
- **Param**: category (all, electronics, clothing, food)

### TrendChart (Page)
- **패턴**: Chart Config + optionBuilder
- **라이브러리**: ECharts
- **구독**: chartData (15초 갱신)
- **이벤트**: @periodChanged
- **Param**: period (24h, 7d, 30d)

---

## 실행 방법

### 1. Mock Server 실행

```bash
cd mock_server
npm install
npm start
# Server running at http://localhost:3003
```

### 2. API 테스트

```bash
# MASTER 엔드포인트
curl http://localhost:3003/api/user
curl http://localhost:3003/api/menu

# PAGE 엔드포인트
curl http://localhost:3003/api/stats
curl http://localhost:3003/api/sales?category=electronics
curl http://localhost:3003/api/trend?period=24h
```

---

## 확장 포인트

이 예제에서 확장 가능한 영역:

### Master 확장
- 실시간 알림 (refreshInterval 추가)
- 사용자 드롭다운 메뉴

### Page 확장
- 페이지네이션 (pageState 추가)
- 정렬 기능 (sortState 추가)
- 상세 모달 (팝업 패턴)

### 컴포넌트 확장
- 차트 타입 변경 (bar, pie, scatter)
- 테이블 셀 편집
- 드래그 앤 드롭

---

## 학습 순서

1. **구조 이해**: 디렉토리 구조와 생명주기 파악
2. **데이터 흐름**: datasetList.json → loaded.js → 컴포넌트 구독
3. **이벤트 흐름**: 컴포넌트 → Page eventBusHandler → 데이터 재발행
4. **Config 패턴**: 각 컴포넌트의 Config 정의 방식 비교
5. **정리 패턴**: beforeDestroy.js의 리소스 정리 패턴

---

*최종 업데이트: 2025-12-31*
