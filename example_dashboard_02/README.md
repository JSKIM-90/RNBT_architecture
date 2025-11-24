# Dashboard Example 02 - Normal Flow Layout

## Overview

This is a dashboard example built with **normal flow layout** using Flexbox and CSS Grid, **without using `position: absolute`, `position: fixed`, or `position: sticky`**.

## Design Principles

### Normal Flow Based Layout
- All elements follow the document flow
- Flexbox for 1D layouts (Header, Sidebar)
- CSS Grid for 2D layouts (Stats cards, Dashboard widgets)
- No absolute/fixed positioning
- Loading/Empty states use Flexbox centering instead of absolute positioning

### Component Architecture
- **Header**: Flexbox-based horizontal layout (Logo, Filter, User info)
- **Sidebar**: Flexbox column layout with navigation
- **SalesStats**: CSS Grid for stat cards
- **SalesChart**: ECharts integration
- **ProductList**: Scrollable table with normal flow

## File Structure

```
example_dashboard_02/
├── views/
│   ├── Header.html
│   ├── Sidebar.html
│   ├── SalesStats.html
│   ├── SalesChart.html
│   └── ProductList.html
├── styles/
│   ├── Header.css
│   ├── Sidebar.css
│   ├── SalesStats.css
│   ├── SalesChart.css
│   └── ProductList.css
├── scripts/
│   ├── components/
│   │   ├── Header_register.js
│   │   ├── Header_destroy.js
│   │   ├── Sidebar_register.js
│   │   ├── Sidebar_destroy.js
│   │   ├── SalesStats_register.js
│   │   ├── SalesStats_destroy.js
│   │   ├── SalesChart_register.js
│   │   ├── SalesChart_destroy.js
│   │   ├── ProductList_register.js
│   │   └── ProductList_destroy.js
│   └── page/
│       ├── before_load.js
│       ├── loaded.js
│       └── before_unload.js
└── README.md
```

## Layout Structure

```
┌─────────────────────────────────────────┐
│            Header (Flexbox)              │
├──────────┬──────────────────────────────┤
│          │  Main Content (Grid/Flex)    │
│ Sidebar  │  ┌────────┬────────┐        │
│ (Flex)   │  │ Stats  │ Stats  │        │
│          │  ├────────┴────────┤        │
│          │  │  Sales Chart    │        │
│          │  ├─────────────────┤        │
│          │  │  Product List   │        │
│          │  └─────────────────┘        │
└──────────┴──────────────────────────────┘
```

## Page Layout (Wrapper Structure)

**중요**: 이 대시보드는 툴이 자동 생성하는 **wrapper div**에 스타일을 설정해야 합니다.

각 컴포넌트는 다음과 같이 wrapper로 감싸집니다:

```html
<!-- 툴이 자동 생성 -->
<div id="header-123" class="component-wrapper" style="...인라인 스타일...">
  <!-- views/Header.html 내용 -->
  <div class="dashboard-header">...</div>
</div>
```

### 전체 구조

```
body (Flexbox Column, height: 100vh)
├── Header Wrapper (flex: 0 0 auto)
│   └── Header Component
└── Body Wrapper (flex: 1, Flexbox Row)
    ├── Sidebar Wrapper (flex: 0 0 250px)
    │   └── Sidebar Component
    └── Main Wrapper (flex: 1, Grid)
        ├── Stats Wrapper (grid-row: 1)
        │   └── SalesStats Component
        ├── Chart Wrapper (grid-row: 2)
        │   └── SalesChart Component
        └── List Wrapper (grid-row: 3)
            └── ProductList Component
```

**자세한 설정 방법은 [`CONTAINER_STYLES.md`](CONTAINER_STYLES.md)를 참조하세요.**

## Key Features

### 1. Normal Flow Notification Badge
Instead of absolute positioning, the notification badge is placed next to the icon using Flexbox gap.

**Before (absolute):**
```css
.notification-badge {
    position: absolute;
    top: 4px;
    right: 4px;
}
```

**After (normal flow):**
```css
.notification-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}
```

### 2. Flexbox-Based Loading State
Instead of absolute centering, use Flexbox for loading/empty states.

**Before (absolute):**
```css
.table-loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
```

**After (flexbox):**
```css
.table-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}
```

### 3. Normal Flow Table Header
Table header scrolls with content instead of being sticky.

**Before (sticky):**
```css
.product-table thead {
    position: sticky;
    top: 0;
}
```

**After (normal flow):**
```css
.product-table thead {
    background: #f9fafb;
}
```

## Data Flow

1. **Page - before_load**: Register event handlers
2. **Components - register**: Subscribe to GlobalDataPublisher topics
3. **Page - loaded**: Register data mappings and fetch data
4. **Components**: Receive data and update UI
5. **User Interaction**: Trigger events via WEventBus
6. **Page - before_unload**: Clean up resources

## Events

### Header Events
- `@periodChanged`: Period filter changed
- `@notificationClicked`: Notification icon clicked
- `@userProfileClicked`: User profile clicked

### Sidebar Events
- `@navLinkClicked`: Navigation link clicked

### ProductList Events
- `@productEditClicked`: Edit product
- `@productDeleteClicked`: Delete product
- `@addProductClicked`: Add new product
- `@paginationClicked`: Change page
- `@searchInputChanged`: Search products

## Data Topics

### salesData
- **Source**: dummyjson API (products endpoint)
- **Subscribers**: SalesStats, SalesChart, ProductList
- **Updates**: Real-time statistics and product list

## Testing

1. Set up a mock server (see `example_dashboard_01/mock_server.js`)
2. Configure the page with the container structure above
3. Assign components to their respective containers
4. Load the page and verify data flow

## Comparison with example_dashboard_01

| Feature | dashboard_01 | dashboard_02 |
|---------|-------------|-------------|
| Notification Badge | Absolute | Normal Flow (Flexbox) |
| Dropdown Menu | Absolute | Not implemented |
| Table Header | Sticky | Normal Flow |
| Loading State | Absolute + Transform | Flexbox |
| Layout | Mixed | Pure Flexbox/Grid |

## Advantages of Normal Flow

1. **Simpler CSS**: No complex positioning calculations
2. **Better Responsive**: Flexbox/Grid handle responsive naturally
3. **Easier Debugging**: Elements follow document flow
4. **Maintainable**: Less brittle to layout changes
5. **Accessible**: Better screen reader support

## Trade-offs

1. **No Sticky Headers**: Table headers scroll with content
2. **No Dropdown Menus**: Would require rethinking UI patterns
3. **Less "Fixed" Elements**: No floating notifications or modals

## Next Steps

- Add responsive breakpoints for mobile
- Implement search and filter functionality
- Add real pagination logic
- Create modal dialogs using normal flow (overlay with flexbox)
