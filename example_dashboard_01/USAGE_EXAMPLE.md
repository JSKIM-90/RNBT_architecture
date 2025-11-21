# 사용 예시 - 단계별 가이드

Component ID 스코프를 활용한 완전한 사용 예시입니다.

---

## 전체 흐름

```
1. Container 생성 (애플리케이션) → ID 부여
2. HTML 삽입 (사용자)
3. CSS 커스터마이징 (사용자) → #component-id를 실제 ID로 교체
4. CSS 로드 (사용자)
5. JavaScript 등록 (사용자)
```

---

## 예시: Header 컴포넌트 통합

### Step 1: Container 생성 및 설정

**애플리케이션이 자동 생성하는 Container**:
```html
<div id="header-main" class="component-container" style="
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 100;
">
  <!-- 여기에 HTML 삽입 -->
</div>
```

### Step 2: HTML 삽입

**views/Header.html 전체 내용 복사** → **Container 내부에 붙여넣기**:

```html
<div id="header-main" class="component-container" style="...">

  <!-- ↓ 여기부터 views/Header.html 내용 ↓ -->
  <div class="dashboard-header">
    <div class="header-left">
      <div class="logo">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect width="32" height="32" fill="#4F46E5" rx="6"/>
          <text x="16" y="22" text-anchor="middle" fill="white" font-size="18" font-weight="bold">S</text>
        </svg>
      </div>
      <h1 class="header-title">Sales Dashboard</h1>
    </div>

    <div class="header-center">
      <div class="filter-group">
        <label for="period-filter">Period:</label>
        <select id="period-filter" class="period-select">
          <option value="24h">Last 24 Hours</option>
          <option value="7d" selected>Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
    </div>

    <div class="header-right">
      <div class="notification-wrapper">
        <button class="notification-icon" aria-label="Notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          </svg>
          <span class="notification-badge" style="display: none;">0</span>
        </button>
        <div class="notification-dropdown" style="display: none;"></div>
      </div>

      <div class="user-profile">
        <div class="user-avatar">
          <div class="avatar-placeholder"></div>
        </div>
        <div class="user-info">
          <div class="user-name">Loading...</div>
          <div class="user-role">-</div>
        </div>
      </div>
    </div>
  </div>

  <template id="notification-item-template">
    <div class="notification-item" data-notification-id="">
      <div class="notification-content">
        <div class="notification-title"></div>
        <div class="notification-message"></div>
      </div>
    </div>
  </template>

  <template id="user-avatar-template">
    <img class="user-avatar-img" src="" alt="" />
  </template>
  <!-- ↑ 여기까지 views/Header.html 내용 ↑ -->

</div>
```

### Step 3: CSS 커스터마이징

#### 방법 A: sed 명령어 (자동화)

```bash
# styles/Header.css의 #component-id를 #header-main으로 교체
sed 's/#component-id/#header-main/g' styles/Header.css > Header-main.css
```

#### 방법 B: 텍스트 에디터 (수동)

**styles/Header.css** 열기 → 찾기/바꾸기:
- 찾기: `#component-id`
- 바꾸기: `#header-main`
- 모두 바꾸기 → **Header-main.css**로 저장

**결과 (Header-main.css)**:
```css
/* Before: #component-id .dashboard-header */
/* After:  #header-main .dashboard-header */

#header-main .dashboard-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

#header-main .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

/* ... 나머지 스타일 ... */
```

### Step 4: CSS 로드

```html
<head>
  <!-- 커스터마이징된 CSS 로드 -->
  <link rel="stylesheet" href="Header-main.css">
</head>
```

또는 **동적 로드** (추천):
```javascript
// CSS 자동 변환 및 로드 함수
function loadComponentCSS(cssFile, containerId) {
    fetch(cssFile)
        .then(response => response.text())
        .then(css => {
            const customCSS = css.replace(/#component-id/g, `#${containerId}`);
            const style = document.createElement('style');
            style.textContent = customCSS;
            document.head.appendChild(style);
        });
}

// Header 컴포넌트 CSS 로드
loadComponentCSS('styles/Header.css', 'header-main');
```

### Step 5: JavaScript 컴포넌트 등록

**components/Header_register.js** 실행:
```javascript
// 프레임워크가 자동으로 this.element에 Container 할당
// this.element = document.getElementById('header-main')

const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;

// Event binding
this.customEvents = {
    change: {
        '#period-filter': '@periodFilterChanged'
    },
    click: {
        '.notification-icon': '@notificationClicked',
        '.user-profile': '@userProfileClicked'
    }
};

bindEvents(this, this.customEvents);

// Subscribe to data
this.subscriptions = {
    userInfo: ['renderUserInfo'],
    notifications: ['renderNotifications']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => subscribe(topic, this, this[fn]), fnList)
    )
);
```

---

## 전체 통합 예시

### HTML (완성된 페이지)

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>Sales Dashboard</title>
</head>
<body>

<!-- Header Container -->
<div id="header-main" class="component-container" style="position: absolute; top: 0; width: 100%; height: 80px; z-index: 100;">
    <div class="dashboard-header">
        <!-- views/Header.html 내용 -->
        ...
    </div>
</div>

<!-- Sidebar Container -->
<div id="sidebar-nav" class="component-container" style="position: fixed; top: 80px; left: 0; width: 240px; height: calc(100vh - 80px); z-index: 50;">
    <div class="dashboard-sidebar">
        <!-- views/Sidebar.html 내용 -->
        ...
    </div>
</div>

<!-- Content Containers -->
<div id="chart-sales" class="component-container" style="position: absolute; top: 100px; left: 260px; width: calc(50% - 280px); height: 400px;">
    <div class="sales-chart-widget">
        <!-- views/SalesChart.html 내용 -->
        ...
    </div>
</div>

<!-- Scripts -->
<script src="fx.js"></script>
<script src="WEventBus.js"></script>
<script src="GlobalDataPublisher.js"></script>
<script src="WKit.js"></script>

<script>
// CSS 로더
function loadComponentCSS(cssFile, containerId) {
    return fetch(cssFile)
        .then(response => response.text())
        .then(css => {
            const customCSS = css.replace(/#component-id/g, `#${containerId}`);
            const style = document.createElement('style');
            style.textContent = customCSS;
            document.head.appendChild(style);
        });
}

// 모든 컴포넌트 CSS 로드
Promise.all([
    loadComponentCSS('styles/Header.css', 'header-main'),
    loadComponentCSS('styles/Sidebar.css', 'sidebar-nav'),
    loadComponentCSS('styles/SalesChart.css', 'chart-sales')
]).then(() => {
    console.log('All CSS loaded');

    // 컴포넌트 초기화
    initializeComponents();
});
</script>

</body>
</html>
```

---

## 여러 인스턴스 사용 예시

같은 컴포넌트를 여러 번 사용할 경우:

```html
<!-- 첫 번째 SalesChart -->
<div id="chart-sales-today" class="component-container" style="...">
    <div class="sales-chart-widget">...</div>
</div>

<!-- 두 번째 SalesChart -->
<div id="chart-sales-week" class="component-container" style="...">
    <div class="sales-chart-widget">...</div>
</div>

<script>
// 각각 독립적인 CSS 스코프
loadComponentCSS('styles/SalesChart.css', 'chart-sales-today');
loadComponentCSS('styles/SalesChart.css', 'chart-sales-week');
</script>
```

**CSS 충돌 없음!**
```css
/* chart-sales-today용 CSS */
#chart-sales-today .sales-chart-widget { ... }

/* chart-sales-week용 CSS */
#chart-sales-week .sales-chart-widget { ... }
```

---

## 요약

| 단계 | 작업 | 담당 |
|------|------|------|
| 1 | Container 생성 + ID 부여 | 애플리케이션 |
| 2 | HTML 삽입 | 사용자 (views/*.html 복사) |
| 3 | CSS 커스터마이징 (#component-id 교체) | 사용자 (sed 또는 수동) |
| 4 | CSS 로드 | 사용자 (동적 로드 추천) |
| 5 | JavaScript 등록 | 프레임워크 자동 |

---

**버전**: 1.0.0
**작성일**: 2025-11-21
