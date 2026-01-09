# Components

API나 Figma 없이 단독으로 개발된 컴포넌트 모음.

## 원칙

### 컴포넌트는 이벤트를 발생시키기만 한다

```javascript
// ❌ 잘못된 예: 컴포넌트가 직접 동작 처리
this.appendElement.querySelector('.btn-clear').addEventListener('click', this.clearLogs);

// ✅ 올바른 예: 이벤트만 발생, 처리는 페이지에서
this.customEvents = {
    click: {
        '.btn-clear': '@clearClicked'
    }
};
bindEvents(this, this.customEvents);
```

컴포넌트는 버튼이 클릭되면 `@clearClicked` 이벤트를 발생시킬 뿐, 실제로 무엇을 할지는 페이지가 결정한다.

> 예외가 있을 수 있다. 단, 기본 생산 원칙은 "이벤트 발생만"이다.

### 외부 인터페이스만 TBD

미리 정할 수 없는 것 (외부 인터페이스):
- `subscriptions`의 topic명 - 데이터 입력
- `config`의 key - API 필드명
- `customEvents`의 이벤트명 - 이벤트 출력

미리 완성 가능한 것:
- HTML/CSS 구조
- 이벤트 바인딩 로직
- 렌더 함수 로직
- beforeDestroy 정리 로직

## 컴포넌트 구조

```
ComponentName/
├── views/component.html
├── styles/component.css
├── scripts/
│   ├── register.js
│   └── beforeDestroy.js
└── preview.html
```

### preview.html

런타임 웹빌더 없이 컴포넌트를 단독으로 테스트하기 위한 파일.

- Mock 의존성(`GlobalDataPublisher`, `Wkit`, `fx`)을 제공
- `register.js`와 `beforeDestroy.js` 코드를 그대로 복사하여 실행
- 초기 데이터 렌더링, 사용자 인터랙션, destroy까지 실제 라이프사이클 재현

TBD 값만 실제 값으로 바꾸면 register/beforeDestroy와 동일한 코드로 테스트 가능.

## 컴포넌트 목록

| 이름 | 용도 |
|------|------|
| LogViewer | 실시간 로그 표시 |
| AssetTree | 계층형 자산 트리 (검색 기능 포함) |

---
