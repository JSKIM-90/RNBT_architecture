# Container Style Guide - Master + Page Layer

example_master_01을 위한 **Master와 Page 레이어가 겹쳐진 구조**의 Container 스타일 가이드입니다.

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
│ │ 250px)   │                                          │ │
│ └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                    ↓ 겹침 (Page가 아래)
┌─────────────────────────────────────────────────────────┐
│ Page Layer (z-index: 1)                                 │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ (padding-top: 60px)                                 │ │
│ ├──────────┬──────────────────────────────────────────┤ │
│ │(padding- │     StatsPanel (50%)                     │ │
│ │ left:    │─────────────────────────────────────────│ │
│ │ 250px)   │     VisitorChart (50%)                  │ │
│ └──────────┴──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙

### Master Layer
- Header와 Sidebar는 `position: fixed`로 화면에 고정
- z-index가 높아 항상 Page 위에 표시
- 투명 영역을 통해 Page 컨텐츠가 보임

### Page Layer
- `padding-top: 60px`, `padding-left: 250px`로 Master 영역 회피
- 실제 컨텐츠가 표시되는 영역
- 독립적인 Normal Flow 사용

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

**설명**:
- `position: fixed` - 스크롤해도 상단 고정
- `height: 60px` - 고정 높이
- `z-index: 100` - Page 위에 표시

---

## 2. Master - Sidebar Wrapper

### Container Inline Style (패널에서 설정)

```css
position: fixed;
top: 60px;
left: 0;
width: 250px;
height: calc(100vh - 60px);
z-index: 100;
overflow-y: auto;
```

**설명**:
- `top: 60px` - Header 아래에 위치
- `width: 250px` - 고정 너비
- `height: calc(100vh - 60px)` - Header 제외한 전체 높이

---

## 3. Page - Root Container

### Container Inline Style (패널에서 설정)

```css
padding-top: 60px;
padding-left: 250px;
min-height: 100vh;
box-sizing: border-box;
```

**설명**:
- `padding-top: 60px` - Header 높이만큼 여백
- `padding-left: 250px` - Sidebar 너비만큼 여백
- 이 여백으로 Master 요소와 겹치지 않음

---

## 4. Page - StatsPanel Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 100%;
height: calc((100vh - 60px) / 2);
```

**설명**:
- Page 영역의 50% 높이
- VisitorChart와 수직으로 나란히 배치

---

## 5. Page - VisitorChart Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 100%;
height: calc((100vh - 60px) / 2);
```

**설명**:
- Page 영역의 50% 높이
- StatsPanel 아래에 배치
- ECharts 차트가 컨테이너 크기에 맞게 리사이즈됨

---

## 빠른 참조 테이블

| Layer | Component | position | top/left | width/height | z-index |
|-------|-----------|----------|----------|--------------|---------|
| Master | Header | fixed | 0, 0 | 100%, 60px | 100 |
| Master | Sidebar | fixed | 60px, 0 | 250px, calc(100vh-60px) | 100 |
| Page | Root | static | - | padding: 60px 0 0 250px | 1 |
| Page | StatsPanel | static | - | 100%, 50% | - |
| Page | VisitorChart | static | - | 100%, 50% | - |

---

## Component CSS 역할

### Master - Header.css
```css
#component-id .header {
    height: 100%;  /* Container가 60px 제공 */
    display: flex;
    /* 내부 레이아웃, 색상, 스타일 */
}
```

### Master - Sidebar.css
```css
#component-id .sidebar {
    height: 100%;  /* Container가 calc(100vh-60px) 제공 */
    display: flex;
    flex-direction: column;
    /* 내부 레이아웃, 색상, 스타일 */
}
```

### Page - StatsPanel.css
```css
#component-id .stats-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 내부 레이아웃, 색상, 스타일 */
}
```

### Page - VisitorChart.css
```css
#component-id .visitor-chart-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* ECharts 컨테이너가 flex: 1로 남은 공간 차지 */
}

#component-id .chart-container {
    flex: 1;
    min-height: 200px;
    /* ResizeObserver로 크기 변화 감지 → ECharts resize */
}
```

---

## Template 기반 동적 렌더링

각 컴포넌트는 `<template>` 태그를 사용하여 동적 콘텐츠를 렌더링합니다.

### 패턴
```html
<!-- Template 정의 -->
<template id="item-template">
    <div class="item" data-id="">
        <span class="item-label"></span>
    </div>
</template>

<!-- 렌더링 대상 -->
<div class="item-list"></div>
```

```javascript
function renderItems(items) {
    const template = this.element.querySelector('#item-template');
    const container = this.element.querySelector('.item-list');

    container.innerHTML = '';

    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.item').dataset.id = item.id;
        clone.querySelector('.item-label').textContent = item.label;
        container.appendChild(clone);
    });
}
```

---

## 적용된 컴포넌트

| 컴포넌트 | Template ID | 동적 데이터 |
|----------|-------------|------------|
| Header | `#nav-item-template` | menu (메뉴 항목) |
| Sidebar | `#notification-item-template` | notifications (알림) |
| StatsPanel | `#stat-card-template` | stats (통계) |
| VisitorChart | - (ECharts) | chartData (차트 데이터) |

---

## 주의사항

### Master Layer
- `pointer-events`를 적절히 설정하여 투명 영역 클릭이 Page로 전달되도록
- z-index 충돌 주의

### Page Layer
- Master 영역의 크기 변경 시 padding 값도 함께 조정
- 반응형 대응 시 Master와 동기화 필요

---

**버전**: 1.0.0
**작성일**: 2025-11-28
