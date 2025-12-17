# Component Structure Guide

컴포넌트 자산을 쌓기 위한 구조 가이드입니다.

---

## 핵심 원칙

**Figma 선택 요소 = 컨테이너**

```
┌─────────────────────────────────────────────────────────────────────┐
│  Figma 링크 제공 = 컴포넌트 단위 선택                                  │
│                                                                      │
│  사용자가 Figma 링크를 제공하면:                                       │
│  - 선택된 요소의 가장 바깥 = div 컨테이너                              │
│  - 선택된 요소의 크기 = 컨테이너 크기                                  │
│  - 내부 요소 = innerHTML (Figma 스타일 그대로)                        │
└─────────────────────────────────────────────────────────────────────┘
```

```html
<div id="component-container">       <!-- Figma 선택 요소 크기 -->
    <div class="transaction-table">  <!-- Figma 내부 요소 (스타일 그대로) -->
        ...
    </div>
</div>
```

---

## 웹 빌더 기본 구조

웹 빌더는 컴포넌트마다 **div 컨테이너**를 기본 단위로 가집니다.

```
웹 빌더에서 컴포넌트를 배치하면:

<div id="component-xxx">   ← 웹 빌더가 자동 생성하는 컨테이너
    <!-- innerHTML -->     ← 사용자 정의 내용
</div>
```

따라서 Figma 선택 요소의 크기가 곧 컨테이너 크기가 되어야 스타일링이 그대로 유지됩니다.

---

## 컨테이너 크기 규칙

**컨테이너 크기 = Figma 선택 요소 크기**

```css
/* Container: Figma 선택 요소 크기 */
#component-container {
    width: 524px;   /* Figma 선택 요소 width */
    height: 350px;  /* Figma 선택 요소 height */
    overflow: auto; /* 동적 렌더링 대응 */
}
```

- Figma에서 선택한 요소의 크기가 곧 컨테이너 크기
- 레이아웃 조립 시 크기 조정은 **에디터가 담당**
- preview.html은 Figma 크기로 디자인 검증 목적

---

## 설계 철학

### Figma 스타일 그대로 유지

- 컨테이너 크기 = Figma 선택 요소 크기
- 내부 요소 스타일 = Figma에서 추출한 그대로
- **임의로 width: 100%, height: 100%로 변경하지 않음**

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
- 컨테이너가 명시적 크기를 가지므로 레이아웃 예측 가능
- overflow: auto로 동적 콘텐츠 대응

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

하나의 컴포넌트는 다음 구조로 구성됩니다:

```
ComponentName/
├─ views/component.html       # 내부 요소 HTML
├─ styles/component.css       # 내부 요소 스타일
├─ scripts/
│   ├─ register.js            # 초기화 로직
│   └─ destroy.js             # 정리 로직
└─ preview.html               # 독립 테스트
```

| 파일 | 역할 |
|------|------|
| `views/component.html` | 내부 요소 HTML |
| `styles/component.css` | 내부 요소 스타일 |
| `scripts/register.js` | 초기화 로직 |
| `scripts/destroy.js` | 정리 로직 |
| `preview.html` | 독립 테스트용 |

> **Note**: 컴포넌트 폴더명이 이미 ComponentName이므로 내부 파일명에 중복 불필요

---

## 컴포넌트 템플릿

### HTML (views/component.html)

```html
<div class="component-name">
    <!-- Figma 내부 구조 그대로 -->
</div>
```

### CSS (styles/component.css)

```css
/* 컨테이너 ID 중심 nesting 구조 */
#component-id {
    .component-name {
        /* Figma에서 추출한 스타일 그대로 적용 */
        display: flex;
        flex-direction: column;
        /* ... */
    }
}
```

### Preview (preview.html)

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* Container: Figma 선택 요소 크기 */
        #component-container {
            width: 524px;   /* Figma 크기 */
            height: 350px;
            overflow: auto;
        }

        /* Component CSS - Figma 스타일 그대로 */
        #component-container {
            .component-name {
                /* Figma에서 추출한 스타일 그대로 */
            }
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

- **디자인 일관성**: Figma 스타일을 그대로 유지
- **독립성**: 각 컴포넌트가 자신의 경계 안에서 완결됨
- **조합성**: 컨테이너 크기만 조정하면 어떤 레이아웃에도 배치 가능
- **예측 가능성**: 일관된 구조로 유지보수 용이
- **캡슐화**: 내부 복잡도가 외부에 노출되지 않음

### 단점

- **DOM 깊이 증가**: 모든 컴포넌트마다 컨테이너 div 추가
- **단순 컴포넌트 오버헤드**: 아이콘 하나도 컨테이너 필요

### 결론

비주얼 빌더에서는 **Figma 스타일 유지**와 **예측 가능한 구조**의 가치가 트레이드오프보다 큽니다.
일관된 구조를 유지하면 컴포넌트를 자산으로 쌓을 수 있습니다.

---

**버전**: 2.3.0
**작성일**: 2025-12-17
**변경사항**:
- v2.3.0: CONTAINER_STYLES.md 제거 - Figma 크기 = 컨테이너 크기로 단순화, 레이아웃 조립은 에디터 담당
- v2.1.0: 파일 구조 통일 (scripts/ 폴더, 파일명 간결화)
- v2.0.0: Figma 스타일 그대로 유지 원칙 명확화, height: 100% 패턴 제거
