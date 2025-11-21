# Container Style Guide

런타임 웹 제작 애플리케이션의 **패널에서 설정해야 할 Container 스타일** 가이드입니다.

---

## Container란?

애플리케이션이 자동으로 생성하는 `<div id="..." class="component-container">` 요소로, **모든 컴포넌트의 외부 컨테이너** 역할을 합니다.

**중요**: 각 Container는 반드시 **고유한 ID**를 가져야 합니다!

```html
<!-- 애플리케이션이 자동 생성 -->
<div id="header-123" class="component-container" style="...패널에서 설정한 inline style...">
  <!-- views/*.html 내용 삽입 -->
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

## 전체 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header Container (height: 80px, z-index: 100)               │
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Sidebar    │  Content Area                                 │
│  Container  │  (Charts, Stats, Tables, 3D Viewer)           │
│  (width:    │                                               │
│   240px,    │                                               │
│   z-index:  │                                               │
│   50)       │                                               │
│             │                                               │
│             │                                               │
└─────────────┴───────────────────────────────────────────────┘
```

---

## Container 스타일 설정

### 1. Header Container

**컴포넌트**: Header
**파일**: views/Header.html

**Container Inline Style** (패널에서 설정):
```css
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 80px;
z-index: 100;
background: transparent;  /* Header.css에서 제어 */
```

**설명**:
- `position: absolute` - 페이지 최상단 고정
- `width: 100%` - 전체 너비
- `height: 80px` - 헤더 높이
- `z-index: 100` - 다른 요소 위에 표시

---

### 2. Sidebar Container

**컴포넌트**: Sidebar
**파일**: views/Sidebar.html

**Container Inline Style** (패널에서 설정):
```css
position: fixed;
top: 80px;          /* Header 높이만큼 아래에서 시작 */
left: 0;
width: 240px;
height: calc(100vh - 80px);  /* Header 제외한 전체 높이 */
z-index: 50;
background: transparent;  /* Sidebar.css에서 제어 */
```

**설명**:
- `position: fixed` - 스크롤 시에도 고정
- `top: 80px` - Header 바로 아래부터 시작
- `width: 240px` - 사이드바 너비
- `height: calc(100vh - 80px)` - 화면 전체 높이에서 Header 빼기

---

### 3. SalesChart Container

**컴포넌트**: SalesChart
**파일**: views/SalesChart.html

**Container Inline Style** (패널에서 설정):
```css
position: absolute;
top: 100px;         /* Header + 여백 */
left: 260px;        /* Sidebar + 여백 */
width: calc(50% - 280px);  /* 2열 그리드 */
height: 400px;
padding: 0;
background: transparent;  /* SalesChart.css에서 제어 */
```

**설명**:
- `top: 100px` - Header(80px) + 여백(20px)
- `left: 260px` - Sidebar(240px) + 여백(20px)
- `width: calc(50% - 280px)` - 화면 절반에서 Sidebar와 여백 제외
- `height: 400px` - 차트 높이

---

### 4. SalesStats Container

**컴포넌트**: SalesStats
**파일**: views/SalesStats.html

**Container Inline Style** (패널에서 설정):
```css
position: absolute;
top: 100px;
left: calc(50% + 10px);  /* SalesChart 오른쪽 */
width: calc(50% - 270px);
height: 400px;
padding: 0;
background: transparent;  /* SalesStats.css에서 제어 */
```

**설명**:
- `left: calc(50% + 10px)` - 화면 절반 + 여백
- SalesChart와 같은 높이로 나란히 배치

---

### 5. ProductList Container

**컴포넌트**: ProductList
**파일**: views/ProductList.html

**Container Inline Style** (패널에서 설정):
```css
position: absolute;
top: 520px;         /* SalesChart 아래 */
left: 260px;
width: calc(60% - 280px);
height: 500px;
padding: 0;
background: transparent;  /* ProductList.css에서 제어 */
```

**설명**:
- `top: 520px` - SalesChart(400px) + Header(100px) + 여백(20px)
- `width: calc(60% - 280px)` - 테이블은 더 넓게

---

### 6. Product3DViewer Container

**컴포넌트**: Product3DViewer
**파일**: views/Product3DViewer.html

**Container Inline Style** (패널에서 설정):
```css
position: absolute;
top: 520px;
left: calc(60% - 10px);  /* ProductList 오른쪽 */
width: calc(40% - 10px);
height: 500px;
padding: 0;
background: transparent;  /* Product3DViewer.css에서 제어 */
```

**설명**:
- ProductList와 같은 높이로 나란히 배치
- 3D 뷰어는 정사각형에 가깝게

---

## 반응형 대안

### 모바일 (화면 너비 < 768px)

```css
/* Header - 동일 */
position: absolute;
top: 0;
width: 100%;
height: 60px;  /* 높이 축소 */

/* Sidebar - 숨김 또는 햄버거 메뉴 */
position: fixed;
left: -240px;  /* 화면 밖으로 */
width: 240px;
transition: left 0.3s;

/* Content - 전체 너비 */
position: absolute;
top: 80px;
left: 20px;
width: calc(100% - 40px);  /* Sidebar 없이 */
```

---

## 스타일 우선순위

### ✅ Container가 제어하는 속성 (패널 inline style)
- `position`
- `top`, `left`, `right`, `bottom`
- `width`, `height`
- `z-index`
- `padding` (외부 여백)

### ✅ Component CSS가 제어하는 속성 (styles/*.css)
- `display`, `flex`, `grid`
- `background`, `color`
- `border`, `box-shadow`
- `padding` (내부 간격)
- `font-*`, `text-*`
- 모든 내부 요소 스타일

---

## 실전 예시

### Dashboard 레이아웃 (1920x1080 기준)

```javascript
// 패널에서 각 컴포넌트 Container에 설정할 스타일

const containerStyles = {
  header: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '80px',
    zIndex: '100'
  },

  sidebar: {
    position: 'fixed',
    top: '80px',
    left: '0',
    width: '240px',
    height: 'calc(100vh - 80px)',
    zIndex: '50'
  },

  salesChart: {
    position: 'absolute',
    top: '100px',
    left: '260px',
    width: 'calc(50% - 280px)',
    height: '400px'
  },

  salesStats: {
    position: 'absolute',
    top: '100px',
    left: 'calc(50% + 10px)',
    width: 'calc(50% - 270px)',
    height: '400px'
  },

  productList: {
    position: 'absolute',
    top: '520px',
    left: '260px',
    width: 'calc(60% - 280px)',
    height: '500px'
  },

  product3DViewer: {
    position: 'absolute',
    top: '520px',
    left: 'calc(60% - 10px)',
    width: 'calc(40% - 10px)',
    height: '500px'
  }
};
```

---

## 주의사항

### ❌ Component CSS에서 피해야 할 것

```css
/* styles/Header.css - 잘못된 예시 */
.dashboard-header {
  position: absolute;  /* ❌ Container가 제어함 */
  top: 0;              /* ❌ Container가 제어함 */
  width: 100%;         /* ❌ Container가 제어함 */
  z-index: 100;        /* ❌ Container가 제어함 */
}
```

### ✅ Component CSS에서 권장

```css
/* styles/Header.css - 올바른 예시 */
.dashboard-header {
  display: flex;           /* ✅ 내부 레이아웃 */
  align-items: center;     /* ✅ 내부 정렬 */
  padding: 1rem 2rem;      /* ✅ 내부 간격 */
  background: #ffffff;     /* ✅ 배경색 */
  border-bottom: 1px solid #e5e7eb;  /* ✅ 테두리 */
}
```

---

## 빠른 참조 테이블

| 컴포넌트 | position | top | left | width | height | z-index |
|---------|----------|-----|------|-------|--------|---------|
| Header | absolute | 0 | 0 | 100% | 80px | 100 |
| Sidebar | fixed | 80px | 0 | 240px | calc(100vh - 80px) | 50 |
| SalesChart | absolute | 100px | 260px | calc(50% - 280px) | 400px | - |
| SalesStats | absolute | 100px | calc(50% + 10px) | calc(50% - 270px) | 400px | - |
| ProductList | absolute | 520px | 260px | calc(60% - 280px) | 500px | - |
| Product3DViewer | absolute | 520px | calc(60% - 10px) | calc(40% - 10px) | 500px | - |

---

**버전**: 1.0.0
**작성일**: 2025-11-21
