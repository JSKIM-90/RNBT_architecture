# 카드회사 대시보드 예제

런타임 프레임워크의 **Master + Page 레이어 아키텍처**와 **Tabulator 라이브러리**를 검증하기 위한 카드회사 대시보드 예제

---

## 목표

**핵심 검증 사항**:
- Master 레이어와 Page 레이어의 **독립적인 데이터 흐름**
- **Tabulator** 라이브러리 통합 패턴
- **ECharts** 라이브러리 통합 패턴
- Master의 `common_component`가 페이지 스크립트 역할 대체
- 컴포넌트 정형화 패턴

**명시적 범위**:
- Master: 공통 UI (Header, Sidebar) - 카드 정보, 알림
- Page: 페이지별 콘텐츠 - 사용 요약, 거래 내역 (Tabulator), 소비 분석 (ECharts)

---

## 아키텍처 구조

```
example_master_02/
├── master/                    # Master 레이어
│   ├── common_component/      # 페이지 스크립트 대체
│   │   ├── register.js        # 이벤트 핸들러 등록
│   │   ├── completed.js       # 데이터 발행
│   │   └── beforeDestroy.js   # 리소스 정리
│   ├── views/
│   │   ├── Header.html        # 카드 정보, 메뉴
│   │   └── Sidebar.html       # 거래 알림
│   ├── styles/
│   │   ├── Header.css
│   │   └── Sidebar.css
│   └── components/
│       ├── Header_register.js
│       ├── Header_beforeDestroy.js
│       ├── Header_preview.html
│       ├── Sidebar_register.js
│       ├── Sidebar_beforeDestroy.js
│       └── Sidebar_preview.html
│
├── page/                      # Page 레이어
│   ├── page_scripts/
│   │   ├── before_load.js     # 이벤트 핸들러 등록
│   │   ├── loaded.js          # 데이터 발행
│   │   └── before_unload.js   # 리소스 정리
│   ├── views/
│   │   ├── SummaryPanel.html  # 사용 요약 카드
│   │   ├── TransactionTable.html  # Tabulator 테이블
│   │   └── SpendingChart.html # ECharts 차트
│   ├── styles/
│   │   ├── SummaryPanel.css
│   │   ├── TransactionTable.css
│   │   └── SpendingChart.css
│   └── components/
│       ├── SummaryPanel_*.js
│       ├── TransactionTable_*.js  # Tabulator 통합
│       ├── SpendingChart_*.js     # ECharts 통합
│       └── *_preview.html
│
└── README.md
```

---

## 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│ Header (60px, fixed)                                    │
│ [CardPay] [**** 1234] [Dashboard] [Transactions] [User] │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ SummaryPanel (140px)                         │
│ (280px)  │ [Balance] [Spending] [Rewards] [Limit]       │
│          ├──────────────────────────────────────────────┤
│ Card     │ TransactionTable    │ SpendingChart          │
│ Alerts   │ (60%, Tabulator)    │ (40%, ECharts)         │
│          │                     │                        │
└──────────┴─────────────────────┴────────────────────────┘
```

---

## 데이터 흐름

### Master 레이어

**Topics**:
| Topic | 구독자 | 갱신 주기 | 설명 |
|-------|--------|----------|------|
| cardInfo | Header | 초기 1회 | 카드 번호, 사용자 정보 |
| menu | Header | 초기 1회 | 네비게이션 메뉴 |
| alerts | Sidebar | 10초 | 거래/보안 알림 |

### Page 레이어

**Topics**:
| Topic | 구독자 | 갱신 주기 | 설명 |
|-------|--------|----------|------|
| summary | SummaryPanel | 30초 | 잔액, 사용금액, 포인트 |
| transactions | TransactionTable | 30초 | 거래 내역 |
| spending | SpendingChart | 60초 | 카테고리별 소비 |

---

## Tabulator 통합 패턴

### 초기화 (TransactionTable_register.js)

```javascript
const tableContainer = this.element.querySelector('#tabulator');

// NOTE: 컨테이너가 CSS 'fit-content' 속성을 가진 경우,
// 'fitColumns'는 무한 resize 루프를 유발할 수 있음.
// 그 경우 'fitData'를 사용할 것.
this.tableInstance = new Tabulator(tableContainer, {
    layout: 'fitColumns',
    height: '100%',
    placeholder: 'No transactions found',
    columns: [
        { title: 'Date', field: 'date', sorter: 'date', ... },
        { title: 'Merchant', field: 'merchant', sorter: 'string' },
        { title: 'Category', field: 'category', ... },
        { title: 'Amount', field: 'amount', sorter: 'number', ... }
    ]
});
```

### 데이터 업데이트

```javascript
function renderTransactions(response) {
    const { data } = response;
    if (!data || !this.tableInstance) return;

    this.tableInstance.setData(data);
}
```

### 정리 (TransactionTable_beforeDestroy.js)

```javascript
if (this.tableInstance) {
    this.tableInstance.destroy();
    this.tableInstance = null;
}
```

---

## ECharts 통합 패턴

### 초기화 (SpendingChart_register.js)

```javascript
const chartContainer = this.element.querySelector('#echarts');
this.chartInstance = echarts.init(chartContainer);

// ResizeObserver로 리사이즈 처리
this.resizeObserver = new ResizeObserver(() => {
    this.chartInstance && this.chartInstance.resize();
});
this.resizeObserver.observe(chartContainer);
```

### 데이터 업데이트

```javascript
function renderChart(response) {
    const { data } = response;
    if (!data || !data.categories) return;

    const option = { /* ECharts 옵션 */ };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[SpendingChart] setOption error:', error);
    }
}
```

### 정리 (SpendingChart_beforeDestroy.js)

```javascript
if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}
```

---

## Preview 파일 사용

각 컴포넌트는 `*_preview.html` 파일로 독립 테스트 가능:

```bash
# Live Server로 미리보기
# VS Code: Right-click → Open with Live Server

# 파일 위치
master/components/Header_preview.html
master/components/Sidebar_preview.html
page/components/SummaryPanel_preview.html
page/components/TransactionTable_preview.html
page/components/SpendingChart_preview.html
```

**Preview 파일 특징**:
- Figma 크기를 컨테이너에 그대로 적용
- Component CSS 파일 그대로 적용 (`#component-id` → `#component-container`)
- Mock 데이터로 렌더링 결과 확인
- 런타임 종속성 없이 독립 실행

---

## 적용된 라이브러리

| 라이브러리 | 버전 | 컴포넌트 | 용도 |
|-----------|------|---------|------|
| Tabulator | 5.5.0 | TransactionTable | 데이터 테이블 |
| ECharts | 5.4.3 | SpendingChart | 파이 차트 |

---

## 베스트 프랙티스

### Tabulator

```javascript
// DO: 명시적 높이 지정
this.tableInstance = new Tabulator(container, {
    height: '100%',  // 또는 구체적인 픽셀 값
    // ...
});

// DON'T: 높이 미지정 (레이아웃 깨짐)
```

### ECharts

```javascript
// DO: ResizeObserver 사용
this.resizeObserver = new ResizeObserver(() => {
    this.chartInstance && this.chartInstance.resize();
});

// DON'T: window.resize 이벤트만 사용 (컨테이너 크기 변화 감지 못함)
```

---

## 작성 일시

- **최초 작성**: 2025-12-02
- **목적**: Tabulator + ECharts 통합 패턴 검증
