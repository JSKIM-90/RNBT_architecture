# Component Structure Guide

컴포넌트 자산을 쌓기 위한 구조 가이드입니다.

---

## 핵심 구조

```
컴포넌트 = 컨테이너 + 내부 요소 (함께 배포됨)
├─ 컨테이너: 독립적인 HTML 단위로 그려짐
└─ 내부 요소: 컨테이너를 기준으로 레이아웃 (height: 100% 등)
```

```html
<div id="component-container">       <!-- 컨테이너 -->
    <div class="transaction-table">  <!-- 내부 요소 -->
        ...
    </div>
</div>
```

---

## 설계 철학

### 컨테이너는 컴포넌트의 일부

- 컨테이너는 외부에서 컴포넌트를 감싸는 것이 아님
- 컨테이너는 컴포넌트의 일부로서 함께 움직임
- 컨테이너의 크기 스타일은 CONTAINER_STYLES.md에서 관리
- 내부 요소의 스타일은 컴포넌트 CSS에서 정의

### 박스 단위 조합

컨테이너가 있으면 조합이 단순해집니다:

```html
<!-- 컨테이너 없이 -->
<button>Click</button>
<!-- 조합 시 버튼 자체 스타일이 레이아웃에 간섭 -->

<!-- 컨테이너 있음 -->
<div class="button-container">
    <button>Click</button>
</div>
<!-- 박스끼리 조합 → 내부는 신경 안 써도 됨 -->
```

- 외부에서 보면: 그냥 박스
- 내부에서 보면: 버튼이든 테이블이든 상관없음
- 조합하는 쪽에서 내부 구현을 알 필요 없음

### CSS Box Model과의 일관성

- 컨테이너 = Containing Block 역할
- 내부 요소의 `height: 100%`가 자연스럽게 동작
- 컨테이너가 명시적 크기를 가지므로 % 기반 레이아웃 가능

---

## 런타임 동작

현재 런타임 애플리케이션에서:

```
사용자가 컴포넌트 HTML 작성
    ↓
container.innerHTML = 사용자 정의 HTML
    ↓
외부에서 보면 container 하나
```

- 사용자가 컴포넌트 단위로 HTML을 작성
- HTML이 컨테이너의 innerHTML로 포함됨
- 사용자 정의 HTML이 얼마나 복잡하든, 외부에서는 container 하나로 취급

---

## 파일 구성

하나의 컴포넌트는 다음 파일들로 구성됩니다:

| 파일 | 역할 |
|------|------|
| `ComponentName.html` | 내부 요소 HTML (views/) |
| `ComponentName.css` | 내부 요소 스타일 (styles/) |
| `ComponentName_register.js` | 초기화 로직 (scripts/) |
| `ComponentName_destroy.js` | 정리 로직 (scripts/) |
| `ComponentName_preview.html` | 독립 테스트용 (optional) |

컨테이너 스타일은 `CONTAINER_STYLES.md`에서 통합 관리합니다.

---

## 컴포넌트 템플릿

### HTML (views/ComponentName.html)

```html
<div class="component-name">
    <!-- 내부 구조 -->
</div>
```

### CSS (styles/ComponentName.css)

```css
#component-id .component-name {
    height: 100%;
    display: flex;
    flex-direction: column;
    /* 내부 스타일링 */
}
```

### Preview (ComponentName_preview.html)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Container Inline Style */
        #component-container {
            width: 100%;
            height: 500px;
        }

        /* Component CSS */
        #component-container .component-name {
            height: 100%;
            /* ... */
        }
    </style>
</head>
<body>
    <!-- 컴포넌트만 배치 (page-root 없이) -->
    <div id="component-container">
        <div class="component-name">
            ...
        </div>
    </div>
</body>
</html>
```

---

## 트레이드오프

### 장점

- **독립성**: 각 컴포넌트가 자신의 경계 안에서 완결됨
- **조합성**: 컨테이너 크기만 조정하면 어떤 레이아웃에도 배치 가능
- **예측 가능성**: 일관된 구조로 유지보수 용이
- **캡슐화**: 내부 복잡도가 외부에 노출되지 않음

### 단점

- **DOM 깊이 증가**: 모든 컴포넌트마다 컨테이너 div 추가
- **단순 컴포넌트 오버헤드**: 아이콘 하나도 컨테이너 필요
- **CONTAINER_STYLES.md 비대화**: 컴포넌트가 많아지면 파일이 커질 수 있음

### 결론

비주얼 빌더에서는 **예측 가능한 구조**의 가치가 트레이드오프보다 큽니다.
일관된 구조를 유지하면 컴포넌트를 자산으로 쌓을 수 있습니다.

---

**버전**: 1.0.0
**작성일**: 2025-12-02
