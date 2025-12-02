# Container Style Guide - Card Company Dashboard

example_master_02를 위한 **카드회사 대시보드** Container 스타일 가이드입니다.

---

## 레이어 구조

Master 영역과 Page 영역은 **독립적인 flow**를 가지며 서로 겹쳐져 있습니다.

```
┌─────────────────────────────────────────────────────────┐
│ Master Layer (z-index: 100)                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Header (position: fixed, top: 0, height: 60px)      │ │
│ ├──────────┬──────────────────────────────────────────┤ │
│ │ Sidebar  │                                          │ │
│ │ (fixed,  │        (투명 영역)                        │ │
│ │ 280px)   │                                          │ │
│ └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                    ↓ 겹침 (Page가 아래)
┌─────────────────────────────────────────────────────────┐
│ Page Layer (z-index: 1)                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ (padding-top: 60px, padding-left: 280px)            │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │           SummaryPanel (height: 140px)              │ │
│ ├──────────────────────────┬──────────────────────────┤ │
│ │   TransactionTable       │     SpendingChart        │ │
│ │   (60%, Tabulator)       │     (40%, ECharts)       │ │
│ └──────────────────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙

### Master Layer
- Header와 Sidebar는 `position: fixed`로 화면에 고정
- z-index가 높아 항상 Page 위에 표시
- Sidebar 너비 280px (example_master_01보다 넓음)

### Page Layer
- `padding-top: 60px`, `padding-left: 280px`로 Master 영역 회피
- SummaryPanel 고정 높이 + 하단 영역 flex 배치

---

## 1. Master - Header Wrapper

### Container Inline Style (패널에서 설정)

```css
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 60px;
z-index: 100;
```

---

## 2. Master - Sidebar Wrapper

### Container Inline Style (패널에서 설정)

```css
position: fixed;
top: 60px;
left: 0;
width: 280px;
height: calc(100vh - 60px);
z-index: 100;
overflow-y: auto;
```

---

## 3. Page - Root Container

### Container Inline Style (패널에서 설정)

```css
padding-top: 60px;
padding-left: 280px;
min-height: 100vh;
box-sizing: border-box;
background: #f1f5f9;
```

---

## 4. Page - SummaryPanel Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 100%;
height: 140px;
padding: 1rem;
box-sizing: border-box;
```

**설명**:
- 고정 높이 140px
- 카드 사용 요약 정보 표시

---

## 5. Page - TransactionTable Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 60%;
height: 100%;
```

**설명**:
- Tabulator 테이블 컴포넌트
- 거래 내역 표시

---

## 6. Page - SpendingChart Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 40%;
height: 100%;
```

**설명**:
- ECharts 차트 컴포넌트
- 카테고리별 소비 분석

---

## 빠른 참조 테이블

| Layer | Component | position | width/height | 특징 |
|-------|-----------|----------|--------------|------|
| Master | Header | fixed | 100%, 60px | 상단 고정 |
| Master | Sidebar | fixed | 280px, calc(100vh-60px) | 좌측 고정 |
| Page | Root | static | padding: 60px/280px | 배경 #f1f5f9 |
| Page | SummaryPanel | static | 100%, 140px | 요약 카드 |
| Page | TransactionTable | static | 60%, 남은 높이 | Tabulator |
| Page | SpendingChart | static | 40%, 남은 높이 | ECharts |

---

## Component CSS 역할

### Master - Header.css
```css
#component-id .header {
    height: 100%;
    display: flex;
    align-items: center;
    /* 내부 레이아웃, 색상, 스타일 */
}
```

### Master - Sidebar.css
```css
#component-id .sidebar {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 알림 목록 스타일 */
}
```

### Page - SummaryPanel.css
```css
#component-id .summary-panel {
    height: 100%;
    display: flex;
    gap: 1rem;
    /* 요약 카드 그리드 */
}
```

### Page - TransactionTable.css
```css
#component-id .transaction-table {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* Tabulator 컨테이너 */
}

#component-id .table-container {
    flex: 1;
    min-height: 0;
    /* Tabulator가 이 영역을 채움 */
}
```

### Page - SpendingChart.css
```css
#component-id .spending-chart {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* ECharts 컨테이너 */
}

#component-id .chart-container {
    flex: 1;
    min-height: 200px;
}
```

---

## 데이터 흐름

```
Master Layer (common_component)
├── cardInfo (1회) → Header (카드 정보)
└── alerts (10s) → Sidebar (알림)

Page Layer (page_scripts)
├── summary (30s) → SummaryPanel (사용 요약)
├── transactions (30s) → TransactionTable (거래 내역)
└── spending (60s) → SpendingChart (소비 분석)
```

---

## 적용된 컴포넌트

| 컴포넌트 | 라이브러리 | 동적 데이터 | Refresh |
|----------|-----------|------------|---------|
| Header | - | cardInfo | 1회 |
| Sidebar | - | alerts | 10s |
| SummaryPanel | - | summary | 30s |
| TransactionTable | Tabulator | transactions | 30s |
| SpendingChart | ECharts | spending | 60s |

---

**버전**: 1.0.0
**작성일**: 2025-12-02
