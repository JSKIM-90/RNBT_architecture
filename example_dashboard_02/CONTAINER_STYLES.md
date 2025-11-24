# Container Style Guide - Normal Flow Layout

example_dashboard_02를 위한 **Normal Flow 기반 Container 스타일 가이드**입니다.

---

## Container란?

애플리케이션이 자동으로 생성하는 `<div id="..." class="component-wrapper">` 요소로, **모든 컴포넌트의 외부 래퍼** 역할을 합니다.

```html
<!-- 애플리케이션이 자동 생성 -->
<div id="header-123" class="component-wrapper" style="...패널에서 설정한 inline style...">
  <!-- views/Header.html 내용 삽입 -->
  <div class="dashboard-header">...</div>
</div>
```

### CSS와 Container ID 연결

모든 CSS 선택자는 `#component-id`로 시작합니다. 실제 사용 시 Container의 실제 ID로 교체해야 합니다:

```css
/* styles/Header.css (원본) */
#component-id .dashboard-header { ... }

/* 실제 사용 (Container ID: header-123) */
#header-123 .dashboard-header { ... }
```

---

## 핵심 원칙: Normal Flow Layout

❌ **사용하지 않는 것**:
- `position: absolute`
- `position: fixed`
- `position: sticky`

✅ **사용하는 것**:
- Flexbox (`display: flex`)
- CSS Grid (`display: grid`)
- Normal document flow

---

## 전체 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Page Container (Flexbox Column, height: 100vh)              │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Header Wrapper (flex: 0 0 auto)                       │   │
│ └───────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ Body Wrapper (flex: 1, Flexbox Row)                   │   │
│ │ ┌──────────┬────────────────────────────────────────┐ │   │
│ │ │ Sidebar  │ Main Wrapper (flex: 1, Grid)           │ │   │
│ │ │ Wrapper  │ ┌────────────────────────────────────┐ │ │   │
│ │ │ (flex:   │ │ Stats Wrapper (grid-row: 1)        │ │ │   │
│ │ │  0 0     │ └────────────────────────────────────┘ │ │   │
│ │ │  250px)  │ ┌────────────────────────────────────┐ │ │   │
│ │ │          │ │ Chart Wrapper (grid-row: 2)        │ │ │   │
│ │ │          │ └────────────────────────────────────┘ │ │   │
│ │ │          │ ┌────────────────────────────────────┐ │ │   │
│ │ │          │ │ List Wrapper (grid-row: 3, flex:1) │ │ │   │
│ │ │          │ └────────────────────────────────────┘ │ │   │
│ │ └──────────┴────────────────────────────────────────┘ │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Page Container (페이지 전체)

**필수**: 모든 wrapper의 부모 요소

```css
/* 패널에서 페이지 전체에 설정 */
body,
#page-root {
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}
```

**설명**:
- `height: 100vh` - 뷰포트 전체 높이
- `display: flex` - Flexbox 레이아웃
- `flex-direction: column` - 세로 방향 (Header → Body)
- `overflow: hidden` - 페이지 전체 스크롤 방지 (컴포넌트별 스크롤)

---

## 2. Header Wrapper

**컴포넌트**: Header
**파일**: views/Header.html

### Container Inline Style (패널에서 설정)

```css
/* Header wrapper */
flex: 0 0 auto;
width: 100%;
```

**설명**:
- `flex: 0 0 auto` - 콘텐츠 크기만큼만 차지 (Header 내용에 따라 자동 높이)
- `width: 100%` - 전체 너비

**Alternative (고정 높이)**:
```css
flex: 0 0 80px;  /* 80px 고정 높이 */
width: 100%;
```

---

## 3. Body Wrapper

**역할**: Sidebar와 Main을 좌우로 배치하는 컨테이너

### Container Inline Style (패널에서 설정)

```css
/* Body wrapper */
flex: 1;
display: flex;
flex-direction: row;
overflow: hidden;
```

**설명**:
- `flex: 1` - Header를 제외한 남은 공간 전부 차지
- `display: flex` - Flexbox로 자식 배치
- `flex-direction: row` - 가로 방향 (Sidebar | Main)
- `overflow: hidden` - Body 자체는 스크롤 없음

---

## 4. Sidebar Wrapper

**컴포넌트**: Sidebar
**파일**: views/Sidebar.html

### Container Inline Style (패널에서 설정)

```css
/* Sidebar wrapper */
flex: 0 0 250px;
height: 100%;
overflow-y: auto;
```

**설명**:
- `flex: 0 0 250px` - 250px 고정 너비
- `height: 100%` - Body wrapper 전체 높이
- `overflow-y: auto` - 세로 스크롤 (메뉴가 많을 때)

---

## 5. Main Wrapper

**역할**: Stats, Chart, List를 세로로 배치하는 컨테이너

### Container Inline Style (패널에서 설정)

```css
/* Main wrapper */
flex: 1;
display: grid;
grid-template-rows: auto auto 1fr;
gap: 1rem;
padding: 1rem;
overflow: hidden;
```

**설명**:
- `flex: 1` - Sidebar를 제외한 남은 공간
- `display: grid` - CSS Grid 레이아웃
- `grid-template-rows: auto auto 1fr` - 3개 행 (Stats, Chart, List)
  - `auto` - Stats 높이 (콘텐츠 크기)
  - `auto` - Chart 높이 (콘텐츠 크기)
  - `1fr` - List 높이 (남은 공간 전부)
- `gap: 1rem` - 위젯 간 간격
- `padding: 1rem` - 가장자리 여백

---

## 6. SalesStats Wrapper

**컴포넌트**: SalesStats
**파일**: views/SalesStats.html

### Container Inline Style (패널에서 설정)

```css
/* SalesStats wrapper */
grid-row: 1;
min-height: 200px;
```

**설명**:
- `grid-row: 1` - 첫 번째 행에 배치
- `min-height: 200px` - 최소 높이 보장
- 높이는 콘텐츠에 따라 자동 조정 (stats cards)

---

## 7. SalesChart Wrapper

**컴포넌트**: SalesChart
**파일**: views/SalesChart.html

### Container Inline Style (패널에서 설정)

```css
/* SalesChart wrapper */
grid-row: 2;
min-height: 300px;
```

**설명**:
- `grid-row: 2` - 두 번째 행에 배치
- `min-height: 300px` - 차트 최소 높이
- ECharts가 내부에서 100% 높이 사용

---

## 8. ProductList Wrapper

**컴포넌트**: ProductList
**파일**: views/ProductList.html

### Container Inline Style (패널에서 설정)

```css
/* ProductList wrapper */
grid-row: 3;
overflow: hidden;
```

**설명**:
- `grid-row: 3` - 세 번째 행에 배치
- `overflow: hidden` - wrapper 자체는 스크롤 없음 (내부 table-container에서 스크롤)
- `1fr` 높이 (Main wrapper의 grid-template-rows)로 남은 공간 전부 차지

---

## 완성된 HTML 구조 예시

```html
<body style="margin: 0; padding: 0; height: 100vh; display: flex; flex-direction: column; overflow: hidden;">

  <!-- Header Wrapper -->
  <div id="header-wrapper" style="flex: 0 0 auto; width: 100%;">
    <div class="dashboard-header">
      <!-- Header.html 내용 -->
    </div>
  </div>

  <!-- Body Wrapper -->
  <div id="body-wrapper" style="flex: 1; display: flex; flex-direction: row; overflow: hidden;">

    <!-- Sidebar Wrapper -->
    <div id="sidebar-wrapper" style="flex: 0 0 250px; height: 100%; overflow-y: auto;">
      <div class="dashboard-sidebar">
        <!-- Sidebar.html 내용 -->
      </div>
    </div>

    <!-- Main Wrapper -->
    <div id="main-wrapper" style="flex: 1; display: grid; grid-template-rows: auto auto 1fr; gap: 1rem; padding: 1rem; overflow: hidden;">

      <!-- Stats Wrapper -->
      <div id="stats-wrapper" style="grid-row: 1; min-height: 200px;">
        <div class="sales-stats-widget">
          <!-- SalesStats.html 내용 -->
        </div>
      </div>

      <!-- Chart Wrapper -->
      <div id="chart-wrapper" style="grid-row: 2; min-height: 300px;">
        <div class="sales-chart-widget">
          <!-- SalesChart.html 내용 -->
        </div>
      </div>

      <!-- List Wrapper -->
      <div id="list-wrapper" style="grid-row: 3; overflow: hidden;">
        <div class="product-list-widget">
          <!-- ProductList.html 내용 -->
        </div>
      </div>

    </div>
  </div>

</body>
```

---

## 스타일 우선순위

### ✅ Container가 제어하는 속성 (패널 inline style)

**레이아웃 속성**:
- `display` (flex, grid)
- `flex`, `flex-direction`, `flex-grow`, `flex-shrink`, `flex-basis`
- `grid-row`, `grid-column`, `grid-template-*`
- `width`, `height`, `min-height`, `max-height`
- `gap`, `padding` (wrapper 외부 간격)
- `overflow`

### ✅ Component CSS가 제어하는 속성 (styles/*.css)

**내부 스타일**:
- `background`, `color`
- `border`, `box-shadow`, `border-radius`
- `padding`, `margin` (컴포넌트 내부 요소)
- `font-*`, `text-*`
- 내부 요소의 `display`, `flex`, `grid`
- 모든 자식 요소 스타일

---

## 반응형 대응

### 태블릿 (768px ~ 1024px)

```css
/* Main wrapper - 2열 대신 1열 */
#main-wrapper {
    grid-template-rows: auto auto 1fr;  /* 동일 */
}

/* Sidebar - 좁게 */
#sidebar-wrapper {
    flex: 0 0 200px;  /* 250px → 200px */
}
```

### 모바일 (< 768px)

```css
/* Body wrapper - 세로 배치 */
#body-wrapper {
    flex-direction: column;  /* row → column */
}

/* Sidebar - 접힘 */
#sidebar-wrapper {
    flex: 0 0 60px;  /* 아이콘만 표시 */
    overflow-y: visible;
}

/* 또는 완전 숨김 */
#sidebar-wrapper {
    display: none;
}
```

---

## height: 100% 작동 원리

컴포넌트 CSS에서 `height: 100%`가 작동하는 이유:

```
body (height: 100vh)
  └─ Header wrapper (flex: 0 0 auto)
  └─ Body wrapper (flex: 1)  ← 명시적 높이 계산됨
      └─ Sidebar wrapper (height: 100%)  ← Body의 100%
      └─ Main wrapper (flex: 1)  ← 명시적 높이 계산됨
          └─ List wrapper (grid-row: 3, 1fr)  ← 명시적 높이 계산됨
              └─ .product-list-widget (height: 100%)  ✅ 작동!
```

**핵심**: Flexbox와 Grid가 자식 요소의 높이를 명시적으로 계산하므로, `height: 100%`가 정상 작동합니다.

---

## 빠른 참조 테이블

| Wrapper | display | flex/grid | width/height | overflow |
|---------|---------|-----------|--------------|----------|
| Page (body) | flex | column | 100vh | hidden |
| Header | - | 0 0 auto | 100% / auto | - |
| Body | flex | 1, row | auto / 100% | hidden |
| Sidebar | - | 0 0 250px | - / 100% | auto (y) |
| Main | grid | 1 | auto / 100% | hidden |
| Stats | - | (grid-row: 1) | auto / auto | - |
| Chart | - | (grid-row: 2) | auto / auto | - |
| List | - | (grid-row: 3) | auto / 1fr | hidden |

---

## 주의사항

### ❌ Component CSS에서 피해야 할 것

```css
/* styles/ProductList.css - 잘못된 예시 */
.product-list-widget {
    position: absolute;  /* ❌ Normal flow 위반 */
    width: 500px;        /* ❌ Wrapper가 제어함 */
    flex: 1;             /* ❌ Wrapper가 제어함 */
}
```

### ✅ Component CSS에서 권장

```css
/* styles/ProductList.css - 올바른 예시 */
.product-list-widget {
    height: 100%;            /* ✅ Wrapper의 높이 상속 */
    display: flex;           /* ✅ 내부 레이아웃 */
    flex-direction: column;  /* ✅ 내부 구조 */
    background: white;       /* ✅ 배경색 */
    border-radius: 0.5rem;   /* ✅ 모서리 */
}
```

---

## 실전 체크리스트

### 페이지 설정
- [ ] body에 `display: flex`, `flex-direction: column`, `height: 100vh` 설정
- [ ] body에 `overflow: hidden` 설정 (전체 페이지 스크롤 방지)

### Header Wrapper
- [ ] `flex: 0 0 auto` 설정
- [ ] `width: 100%` 설정

### Body Wrapper 생성
- [ ] `flex: 1` 설정
- [ ] `display: flex`, `flex-direction: row` 설정

### Sidebar Wrapper
- [ ] `flex: 0 0 250px` 설정
- [ ] `height: 100%` 설정
- [ ] `overflow-y: auto` 설정

### Main Wrapper 생성
- [ ] `flex: 1` 설정
- [ ] `display: grid` 설정
- [ ] `grid-template-rows: auto auto 1fr` 설정
- [ ] `gap: 1rem`, `padding: 1rem` 설정

### 각 위젯 Wrapper
- [ ] Stats: `grid-row: 1`, `min-height: 200px`
- [ ] Chart: `grid-row: 2`, `min-height: 300px`
- [ ] List: `grid-row: 3`, `overflow: hidden`

---

## 01번 예제와의 차이점

| 항목 | 01번 (absolute/fixed) | 02번 (normal flow) |
|------|----------------------|-------------------|
| 위치 지정 | absolute/fixed + top/left | flex/grid |
| 높이 계산 | 명시적 px 값 | auto, 1fr, 100% |
| 스크롤 | position: fixed로 고정 | overflow: auto로 자연스럽게 |
| 반응형 | calc() 계산 복잡 | flex/grid가 자동 조정 |
| 유지보수 | 레이아웃 변경 시 재계산 | 구조 변경만으로 대응 |

---

## 트러블슈팅

### height: 100%가 작동하지 않을 때

**증상**: 컴포넌트 높이가 0이거나 매우 작음

**원인 체크**:
1. [ ] body에 `height: 100vh` 설정되었나?
2. [ ] Body wrapper에 `flex: 1` 설정되었나?
3. [ ] Main wrapper에 `display: grid` 설정되었나?
4. [ ] List wrapper에 `grid-row: 3` 설정되었나?

**해결**:
- 부모 체인 전체를 확인: body → Body wrapper → Main wrapper → List wrapper
- 각 단계마다 명시적 높이가 계산되어야 함

### 스크롤이 작동하지 않을 때

**증상**: ProductList 테이블이 스크롤되지 않음

**원인**:
- List wrapper에 `overflow: hidden` 누락
- `.table-container`에 `overflow-y: auto` 누락

**해결**:
```css
/* ProductList.css */
.table-container {
    flex: 1;
    overflow-y: auto;  /* 필수! */
}
```

---

**버전**: 1.0.0
**작성일**: 2025-11-24
**작성자**: Claude Code
