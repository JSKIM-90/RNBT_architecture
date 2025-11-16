# WKit.bindEvents

## 위치
`WKit.js:14-24`

## 시그니처
```javascript
WKit.bindEvents(instance: Instance, customEvents: CustomEventsSchema): void
```

## 역할
컴포넌트의 DOM 요소에 **이벤트 위임 패턴**을 사용하여 이벤트 리스너를 등록합니다.

**주요 기능**:
1. `customEvents` 스키마를 순회하며 각 이벤트-셀렉터 조합에 대한 핸들러 생성
2. `delegate` 패턴으로 동적 DOM에 대응
3. 핸들러가 실행되면 WEventBus로 커스텀 이벤트 emit

이 API는 **사용자의 DOM 인터랙션을 애플리케이션 이벤트로 변환**하는 역할을 합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- 동적으로 생성되는 DOM 요소에도 이벤트 처리 필요 (이벤트 위임 패턴)
- 사용자가 에디터에서 선언적으로 "이 버튼 클릭하면 이 이벤트 발생"을 설정
- DOM 이벤트와 비즈니스 로직(WEventBus) 분리로 유지보수성 향상

## 사용 예시
```javascript
// Component - register
const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
  this.customEvents = {
    click: {
      '.submit-btn': '@submitForm',
      '.cancel-btn': '@cancelForm'
    },
    submit: {
      'form': '@formSubmit'
    }
  };

  bindEvents(this, this.customEvents);
}
```

## 데이터 흐름
```
customEvents 스키마
  {
    click: {
      '.submit-btn': '@submitForm',
      '.cancel-btn': '@cancelForm'
    }
  }
  ↓
fx.go + fx.map (이벤트 타입별 순회)
  ↓
  ├─ makeHandler(instance, '.submit-btn') → handler 함수 생성
  ├─ delegate(instance, 'click', '.submit-btn', handler) → 이벤트 위임 등록
  └─ instance.element.addEventListener('click', emitEvent)
  ↓
사용자가 .submit-btn 클릭
  ↓
emitEvent 실행 (qsAll로 매칭 확인)
  ↓
handler 실행
  ↓
event.preventDefault()
  ↓
WEventBus.emit('@submitForm', { event, targetInstance })
```

## 구현 분석

### 현재 코드
```javascript
// WKit.js:14-24
WKit.bindEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.map(([eventName, selectorList]) => {
      fx.map((selector) => {
        const handler = makeHandler(instance, selector);
        delegate(instance, eventName, selector, handler);
      }, Object.keys(selectorList));
    })
  );
};

// WKit.js:272-285 (makeHandler)
function makeHandler(targetInstance, selector) {
  return function (event) {
    event.preventDefault();
    const { customEvents } = targetInstance;
    const triggerEvent = customEvents?.[event.type]?.[selector];
    if (triggerEvent) {
      console.log('@eventHandler', customEvents[event.type][selector]);
      WEventBus.emit(triggerEvent, {
        event,
        targetInstance,
      });
    }
  };
}

// WKit.js:365-380 (delegate)
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    const potentialElements = qsAll(selector, instance.element);
    for (const potentialElement of potentialElements) {
      if (potentialElement === event.target) {
        return handler.call(event.target, event);
      }
    }
  };

  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;

  instance.element.addEventListener(eventName, emitEvent);
}

// WKit.js:359-363 (qsAll)
function qsAll(selector, scope = document) {
  if (!selector) throw 'no selector';
  return Array.from(scope.querySelectorAll(selector));
}
```

### 잘된 점 ✅
1. **이벤트 위임 패턴**: 동적으로 추가/제거되는 DOM 요소에도 작동
2. **핸들러 저장**: `instance.userHandlerList`에 핸들러 저장 → 나중에 removeCustomEvents에서 사용
3. **함수형 파이프라인**: `fx.go` + `fx.map`으로 깔끔한 순회
4. **컨텍스트 전달**: WEventBus에 `event`와 `targetInstance` 모두 전달
5. **디버깅 지원**: 콘솔에 '@eventHandler' 로그 출력

### 개선점 ⚠️

#### 1. 중첩된 fx.map의 반환값 무시
**현재 코드**:
```javascript
fx.go(
  Object.entries(customEvents),
  fx.map(([eventName, selectorList]) => {
    fx.map((selector) => {  // ← 이 fx.map의 결과가 무시됨
      const handler = makeHandler(instance, selector);
      delegate(instance, eventName, selector, handler);
    }, Object.keys(selectorList));
  })
);
```

**문제점**:
- 내부 `fx.map`의 반환값이 사용되지 않음
- `fx.go`가 완료를 기다리지만, 실제로는 부수효과(side-effect)만 발생
- 함수형 스타일과 명령형 스타일이 섞여 있음

**개선안 1** (fx.each 사용):
```javascript
WKit.bindEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = makeHandler(instance, selector);
        delegate(instance, eventName, selector, handler);
      }, Object.keys(selectorList));
    })
  );
};
```

**개선안 2** (명령형 스타일):
```javascript
WKit.bindEvents = function (instance, customEvents) {
  for (const [eventName, selectorList] of Object.entries(customEvents)) {
    for (const selector of Object.keys(selectorList)) {
      const handler = makeHandler(instance, selector);
      delegate(instance, eventName, selector, handler);
    }
  }
};
```

#### 2. makeHandler의 무조건 preventDefault
**현재 코드**:
```javascript
function makeHandler(targetInstance, selector) {
  return function (event) {
    event.preventDefault();  // ← 항상 실행
    // ...
  };
}
```

**문제점**:
- 모든 이벤트에 대해 무조건 `preventDefault()` 호출
- form submit은 막아야 하지만, 일반 click은 막을 필요 없을 수 있음
- 링크(`<a>`) 클릭 시 기본 동작을 막고 싶지 않은 경우도 있음

**개선안 1** (조건부 preventDefault):
```javascript
function makeHandler(targetInstance, selector) {
  return function (event) {
    const { customEvents } = targetInstance;
    const triggerEvent = customEvents?.[event.type]?.[selector];

    if (triggerEvent) {
      // submit, form 관련 이벤트만 preventDefault
      if (event.type === 'submit' || event.target.tagName === 'FORM') {
        event.preventDefault();
      }

      console.log('@eventHandler', customEvents[event.type][selector]);
      WEventBus.emit(triggerEvent, {
        event,
        targetInstance,
      });
    }
  };
}
```

**개선안 2** (스키마에 옵션 추가):
```javascript
// 사용 예시
this.customEvents = {
  click: {
    '.submit-btn': { event: '@submitForm', preventDefault: true },
    '.link': { event: '@navigate', preventDefault: false }
  }
};

function makeHandler(targetInstance, selector) {
  return function (event) {
    const { customEvents } = targetInstance;
    const config = customEvents?.[event.type]?.[selector];

    if (config) {
      const eventName = typeof config === 'string' ? config : config.event;
      const shouldPreventDefault = typeof config === 'string' ? false : config.preventDefault;

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      console.log('@eventHandler', eventName);
      WEventBus.emit(eventName, {
        event,
        targetInstance,
      });
    }
  };
}
```

#### 3. delegate의 이벤트 매칭 로직
**현재 코드**:
```javascript
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    const potentialElements = qsAll(selector, instance.element);
    for (const potentialElement of potentialElements) {
      if (potentialElement === event.target) {  // ← 정확히 일치하는 경우만
        return handler.call(event.target, event);
      }
    }
  };
  // ...
}
```

**문제점**:
- `event.target === potentialElement`만 체크 → 자식 요소 클릭 시 동작 안 함
- 예: `<button><span>클릭</span></button>`에서 `<span>` 클릭 시 버튼 이벤트 안 잡힘

**개선안** (closest 사용):
```javascript
function delegate(instance, eventName, selector, handler) {
  const emitEvent = (event) => {
    // event.target에서 시작해서 상위로 올라가며 selector와 매칭 확인
    const matchedElement = event.target.closest(selector);

    // instance.element 내부인지 확인
    if (matchedElement && instance.element.contains(matchedElement)) {
      return handler.call(matchedElement, event);
    }
  };

  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;

  instance.element.addEventListener(eventName, emitEvent);
}
```

#### 4. qsAll의 에러 처리
**현재 코드**:
```javascript
function qsAll(selector, scope = document) {
  if (!selector) throw 'no selector';  // ← 문자열 throw
  return Array.from(scope.querySelectorAll(selector));
}
```

**문제점**:
- 문자열을 throw (Error 객체가 아님)
- 스택 트레이스가 제대로 안 나옴
- 잘못된 selector 문법 시 querySelectorAll이 throw하는데 catch 안 함

**개선안**:
```javascript
function qsAll(selector, scope = document) {
  if (!selector) {
    throw new Error('selector is required');
  }

  try {
    return Array.from(scope.querySelectorAll(selector));
  } catch (err) {
    throw new Error(`Invalid selector: "${selector}". ${err.message}`);
  }
}
```

#### 5. 중복 이벤트 등록 방지 없음
**문제점**:
- `bindEvents`를 여러 번 호출하면 같은 이벤트가 중복 등록됨
- 메모리 누수 가능성

**개선안** (중복 체크):
```javascript
function delegate(instance, eventName, selector, handler) {
  // 기존 핸들러 제거
  const existingHandler = instance.userHandlerList?.[eventName]?.[selector];
  if (existingHandler) {
    instance.element.removeEventListener(eventName, existingHandler);
  }

  const emitEvent = (event) => {
    const matchedElement = event.target.closest(selector);
    if (matchedElement && instance.element.contains(matchedElement)) {
      return handler.call(matchedElement, event);
    }
  };

  instance.userHandlerList = instance.userHandlerList || {};
  instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
  instance.userHandlerList[eventName][selector] = emitEvent;

  instance.element.addEventListener(eventName, emitEvent);
}
```

#### 6. 타입 검증 부족
**문제점**:
- `customEvents`가 올바른 스키마인지 검증 없음
- `instance.element`가 DOM 요소인지 확인 안 함

**개선안**:
```javascript
WKit.bindEvents = function (instance, customEvents) {
  // 검증
  if (!instance || !instance.element) {
    throw new Error('instance.element is required');
  }
  if (!(instance.element instanceof HTMLElement)) {
    throw new Error('instance.element must be a DOM element');
  }
  if (!customEvents || typeof customEvents !== 'object') {
    throw new Error('customEvents must be an object');
  }

  // 기존 로직
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = makeHandler(instance, selector);
        delegate(instance, eventName, selector, handler);
      }, Object.keys(selectorList));
    })
  );
};
```

## 개선 우선순위
1. **High**: delegate의 이벤트 매칭 로직 개선 (closest 사용)
2. **Medium**: 중첩된 fx.map을 fx.each로 변경
3. **Medium**: 중복 이벤트 등록 방지
4. **Low**: preventDefault 조건부 적용
5. **Low**: qsAll 에러 처리 개선
6. **Low**: 타입 검증 추가

## 관련 함수
- `makeHandler()` - Internal (`WKit.js:272-285`)
- `delegate()` - Internal (`WKit.js:365-380`)
- `qsAll()` - Internal (`WKit.js:359-363`)
- `WKit.removeCustomEvents()` - Public API (`WKit.js:26-38`)
- `WEventBus.emit()` - External (`WEventBus.js:19-24`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스
const instance = {
  element: document.querySelector('#my-component'),
  customEvents: {
    click: {
      '.submit-btn': '@submitForm'
    }
  }
};

WKit.bindEvents(instance, instance.customEvents);
// 사용자가 .submit-btn 클릭 → WEventBus에 '@submitForm' emit

// 2. 자식 요소 클릭 (현재 버그)
// HTML: <button class="submit-btn"><span>제출</span></button>
// 사용자가 <span> 클릭 → 현재: 이벤트 안 잡힘
// 개선 후: closest 사용으로 이벤트 잡힘

// 3. 중복 등록 (현재 메모리 누수)
WKit.bindEvents(instance, instance.customEvents);
WKit.bindEvents(instance, instance.customEvents);
// 현재: 같은 이벤트가 2번 등록됨
// 개선 후: 기존 핸들러 제거 후 재등록

// 4. 잘못된 스키마
WKit.bindEvents(instance, null);
// 현재: 런타임 에러
// 개선 후: 명확한 에러 메시지
```

## 실제 사용 흐름 예시
```javascript
// 1. 컴포넌트 등록 시
const instance = {
  element: document.querySelector('#product-list'),
  customEvents: {
    click: {
      '.product-card': '@productClicked',
      '.add-to-cart': '@addToCart'
    }
  }
};

WKit.bindEvents(instance, instance.customEvents);

// 2. 페이지에서 이벤트 핸들러 등록
this.eventBusHandlers = {
  '@productClicked': ({ event, targetInstance }) => {
    console.log('Product clicked:', event.target);
  },
  '@addToCart': async ({ event, targetInstance }) => {
    const productId = event.target.dataset.productId;
    // 장바구니에 추가 로직
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);

// 3. 사용자가 UI 조작
// .product-card 클릭 → '@productClicked' emit → eventHandler 실행
```
