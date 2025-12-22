# ServerMonitor Component

Shadow DOM 기반 탭 팝업을 가진 3D 서버 모니터 컴포넌트 예제입니다.

## 구조

```
ServerMonitor/
├── views/component.html    # 탭 팝업 템플릿
├── styles/component.css    # 다크 테마 스타일
├── scripts/
│   ├── register.js         # 컴포넌트 로직
│   └── destroy.js          # 리소스 정리
├── preview.html            # 독립 실행 프리뷰
└── README.md
```

## 기능

- **탭 UI**: Overview (테이블) + Performance (차트)
- **Tabulator 테이블**: 프로세스 목록 표시
- **ECharts 차트**: CPU/Memory 이중 시리즈 라인 차트
- **Stats Bar**: CPU/Memory/Disk/OS/Uptime 요약

---

## Shadow DOM에서 Tabulator CSS 사용하기

### 문제

Shadow DOM은 외부 스타일시트와 격리됩니다. 따라서 메인 페이지에서 Tabulator CSS를 import해도 Shadow DOM 내부에는 적용되지 않습니다.

```javascript
// main page에서 import해도 Shadow DOM에는 적용 안됨
import 'tabulator-tables/dist/css/tabulator_midnight.min.css';
```

### 해결 방법: CSS 파일 Fetch 후 주입

`applyTabulatorMixin`에서 CSS 파일을 fetch하여 Shadow DOM에 `<style>` 태그로 주입합니다.

```javascript
// Mixin.js - applyTabulatorMixin
const TABULATOR_CSS_PATH = 'client/common/libs/tabulator/tabulator_midnight.min.css';

async function injectTabulatorCSS(shadowRoot) {
    const response = await fetch(TABULATOR_CSS_PATH);
    const cssText = await response.text();

    const style = document.createElement('style');
    style.textContent = cssText;
    shadowRoot.appendChild(style);
}
```

### Preview에서의 방법 (CDN 사용)

독립 실행 preview에서는 `<link>` 태그로 CDN에서 직접 로드합니다.

```javascript
const tabulatorLink = document.createElement('link');
tabulatorLink.rel = 'stylesheet';
tabulatorLink.href = 'https://unpkg.com/tabulator-tables@6.3.1/dist/css/tabulator_midnight.min.css';
shadowRoot.appendChild(tabulatorLink);
```

---

## Tabulator CSS 커스터마이징 가이드

### 원칙: 최소 오버라이드

midnight 테마가 이미 다크 모드를 지원하므로, 필수적인 스타일만 오버라이드합니다.

### 권장 커스텀 스타일

```css
/* 1. 테이블 컨테이너 */
.table-container .tabulator {
    border-radius: 8px;    /* 둥근 모서리 */
    font-size: 12px;       /* 폰트 사이즈 */
}

/* 2. 헤더 강조선 (브랜드 컬러) */
.table-container .tabulator-header {
    border-bottom: 2px solid #3b82f6;
}

/* 3. 컬럼 타이틀 정렬 */
.table-container .tabulator-header .tabulator-col .tabulator-col-title {
    padding-right: 0 !important;
}

/* 4. 배경 투명화 (부모 배경 활용) */
.table-container .tabulator .tabulator-table {
    background: transparent;
}

/* 5. 행 스타일 */
.table-container .tabulator-row {
    background: transparent !important;
    min-height: 40px;
    height: 40px;
}

/* 6. 셀 텍스트 오버플로우 처리 */
.table-container .tabulator-row .tabulator-cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
```

### 피해야 할 오버라이드

midnight 테마가 이미 처리하므로 불필요합니다:

- 배경색 (`background-color`)
- 테두리 색상 (`border-color`)
- 텍스트 색상 (`color`)
- 스크롤바 스타일
- hover 효과
- placeholder 스타일

---

## 탭 전환 시 차트 리사이즈

### 문제

ECharts는 초기화 시점에 컨테이너 크기를 계산합니다. Performance 탭이 `display: none` 상태에서 초기화되면 크기가 0으로 계산되어 차트가 보이지 않습니다.

### 해결

탭 전환 시 `chart.resize()` 호출:

```javascript
shadowRoot.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        // ... 탭 전환 로직 ...

        // Performance 탭 전환 시 차트 리사이즈
        if (tabName === 'performance' && chart) {
            setTimeout(() => chart.resize(), 10);
        }
    });
});
```

---

## 관련 파일

- `Mixin.js`: `applyTabulatorMixin` 구현
- `tabulator_midnight.min.css`: Shadow DOM 주입용 CSS 파일
- `TemperatureSensor/`: 단일 차트 컴포넌트 예제 (비교용)
