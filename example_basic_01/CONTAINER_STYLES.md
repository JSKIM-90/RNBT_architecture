# Container Style Guide - Basic Single Page

example_basic_01을 위한 **Master 없는 단일 Page 구조**의 Container 스타일 가이드입니다.

---

## 레이어 구조

Master 영역 없이 Page 영역만 존재하는 기본 구조입니다.

```
┌─────────────────────────────────────────────────────────┐
│ Page Layer (전체 화면)                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │                 SensorPanel (40%)                   │ │
│ │              Real-time sensor grid                  │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │   AlertList (30%)    │     TrendChart (30%)        │ │
│ │   Active alerts      │     24h temperature trend   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 핵심 원칙

### Single Page Structure
- Master 레이어 없음 (Header/Sidebar 고정 요소 없음)
- 전체 화면을 Page 컨텐츠가 사용
- 컴포넌트들이 Normal Flow로 배치

### Component 독립성
- 각 컴포넌트는 자체 데이터 구독
- 독립적인 auto-refresh interval
- 컴포넌트 간 느슨한 결합

---

## 1. Page - Root Container

### Container Inline Style (패널에서 설정)

```css
width: 100%;
min-height: 100vh;
padding: 1.5rem;
box-sizing: border-box;
background: #f1f5f9;
```

**설명**:
- 전체 화면 사용 (Master 영역 없음)
- padding으로 컨텐츠 여백 제공

---

## 2. Page - SensorPanel Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 100%;
height: 40vh;
margin-bottom: 1.5rem;
```

**설명**:
- 화면 상단 40% 높이
- 센서 데이터 그리드 표시

---

## 3. Page - AlertList Wrapper

### Container Inline Style (패널에서 설정)

```css
width: 35%;
height: 100%;
```

**설명**:
- 하단 왼쪽 35% 너비
- 활성 알림 목록

---

## 4. Page - TrendChart Wrapper

### Container Inline Style (패널에서 설정)

```css
flex: 1;
height: 100%;
```

**설명**:
- 하단 나머지 공간
- ECharts 트렌드 차트

---

## 빠른 참조 테이블

| Component | width | height | 특징 |
|-----------|-------|--------|------|
| Root | 100% | min 100vh | 전체 화면, padding: 1.5rem |
| SensorPanel | 100% | 40vh | 센서 그리드 |
| AlertList | 35% | 60vh - gap | 알림 목록 |
| TrendChart | flex: 1 | 60vh - gap | ECharts 차트 |

---

## Component CSS 역할

### SensorPanel.css
```css
#component-id .sensor-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 센서 카드 그리드, 스타일링 */
}
```

### AlertList.css
```css
#component-id .alert-list-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 알림 목록, 스타일링 */
}
```

### TrendChart.css
```css
#component-id .trend-chart-panel {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* ECharts 컨테이너 */
}

#component-id .chart-container {
    flex: 1;
    min-height: 250px;
    /* ResizeObserver로 크기 변화 감지 */
}
```

---

## 데이터 흐름

```
Page (loaded.js)
├── sensors (5s interval) → SensorPanel
├── alerts (5s interval) → AlertList
└── trend (60s interval) → TrendChart
```

---

## 적용된 컴포넌트

| 컴포넌트 | Template ID | 동적 데이터 | Refresh |
|----------|-------------|------------|---------|
| SensorPanel | `#sensor-card-template` | sensors | 5s |
| AlertList | `#alert-item-template` | alerts | 5s |
| TrendChart | - (ECharts) | trend | 60s |

---

## example_master_01과 비교

| 항목 | example_basic_01 | example_master_01 |
|------|------------------|-------------------|
| Master Layer | ❌ 없음 | ✅ Header, Sidebar |
| Page Padding | 1.5rem (전방향) | 60px top, 250px left |
| 구조 복잡도 | 단순 | 복잡 (2개 레이어) |
| common_component | ❌ 불필요 | ✅ Master의 page 역할 |

---

**버전**: 1.0.0
**작성일**: 2025-11-28
