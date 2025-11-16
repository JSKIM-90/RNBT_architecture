# WKit.removeCustomEvents

## 위치
`WKit.js:26-38`

## 시그니처
```javascript
WKit.removeCustomEvents(instance: Instance, customEvents: CustomEventsSchema): void
```

## 역할
`WKit.bindEvents`로 등록한 이벤트 리스너를 제거합니다.

**주요 기능**:
1. `instance.userHandlerList`에서 저장된 핸들러 조회
2. `removeEventListener`로 이벤트 리스너 제거
3. 메모리 누수 방지

이 API는 **컴포넌트 destroy 시 이벤트 리스너 정리**를 담당합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- SPA 환경에서 컴포넌트가 동적으로 생성/제거됨
- 이벤트 리스너를 제거하지 않으면 메모리 누수 발생
- 페이지 전환 시 이전 페이지의 이벤트가 계속 실행될 수 있음

## 사용 예시
```javascript
// Component - destroy
const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    removeCustomEvents(this, this.customEvents);
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
instance.userHandlerList['click']['.submit-btn'] 조회
  ↓
handler 존재하면
  ↓
instance.element.removeEventListener('click', handler)
```

## 구현 분석

### 현재 코드
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.map(([eventName, selectorList]) => {
      fx.map((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
        }
      }, Object.keys(selectorList));
    })
  );
};
```

### 잘된 점 ✅
1. **안전한 접근**: Optional chaining (`?.`)으로 안전하게 핸들러 조회
2. **존재 확인**: handler가 있을 때만 제거
3. **bindEvents와 대칭**: 등록과 제거가 같은 구조

### 개선점 ⚠️

#### 1. 핸들러 제거 후 정리 누락
**현재 코드**:
```javascript
if (handler) {
  instance.element.removeEventListener(eventName, handler);
}
// userHandlerList에서 제거 안 함!
```

**문제점**:
- `removeEventListener`는 했지만 `userHandlerList`에서 핸들러 참조가 남아있음
- 메모리 누수 가능성 (핸들러 함수가 GC 안 될 수 있음)
- 나중에 다시 `bindEvents` 호출 시 혼란 가능

**개선안**:
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);

          // userHandlerList에서도 제거
          delete instance.userHandlerList[eventName][selector];

          // 빈 객체면 정리
          if (Object.keys(instance.userHandlerList[eventName]).length === 0) {
            delete instance.userHandlerList[eventName];
          }
        }
      }, Object.keys(selectorList));
    })
  );
};
```

#### 2. 중첩된 fx.map 사용 (bindEvents와 동일한 문제)
**현재 코드**:
```javascript
fx.map(([eventName, selectorList]) => {
  fx.map((selector) => {  // ← 반환값 미사용
    // side-effect만 발생
  }, Object.keys(selectorList));
})
```

**문제점**:
- `fx.map`은 변환 함수인데 부수효과(removeEventListener)만 발생
- 함수형 스타일과 명령형 스타일 혼재

**개선안**:
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
          delete instance.userHandlerList[eventName][selector];

          if (Object.keys(instance.userHandlerList[eventName]).length === 0) {
            delete instance.userHandlerList[eventName];
          }
        }
      }, Object.keys(selectorList));
    })
  );
};
```

#### 3. instance.element 존재 확인 없음
**문제점**:
- `instance.element`가 이미 제거되었거나 null일 수 있음
- DOM 요소가 제거된 후 destroy 호출 시 에러 가능성

**개선안**:
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  if (!instance || !instance.element) {
    console.warn('[WKit.removeCustomEvents] instance.element가 없습니다.');
    return;
  }

  if (!instance.userHandlerList) {
    return; // 등록된 핸들러가 없으면 조기 리턴
  }

  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
          delete instance.userHandlerList[eventName][selector];

          if (Object.keys(instance.userHandlerList[eventName]).length === 0) {
            delete instance.userHandlerList[eventName];
          }
        }
      }, Object.keys(selectorList));
    })
  );
};
```

#### 4. customEvents 파라미터 의존
**문제점**:
- destroy 시 `this.customEvents`를 전달해야 함
- customEvents가 수정되었거나 없어지면 제거 실패
- userHandlerList에 있는 모든 핸들러를 제거하는 게 더 안전할 수도

**개선안 1** (현재 방식 유지 - customEvents 기반):
```javascript
// 사용자가 명시적으로 어떤 이벤트를 제거할지 지정
WKit.removeCustomEvents(this, this.customEvents);
```

**개선안 2** (userHandlerList 기반으로 모든 핸들러 제거):
```javascript
WKit.removeAllEvents = function (instance) {
  if (!instance || !instance.element || !instance.userHandlerList) {
    return;
  }

  for (const [eventName, selectorMap] of Object.entries(instance.userHandlerList)) {
    for (const [selector, handler] of Object.entries(selectorMap)) {
      instance.element.removeEventListener(eventName, handler);
    }
  }

  // 전체 정리
  instance.userHandlerList = {};
};

// 사용
function onInstanceUnLoad() {
  WKit.removeAllEvents(this);
}
```

#### 5. 디버깅 정보 부족
**문제점**:
- 어떤 이벤트가 제거되는지 로그 없음
- 제거 실패 시 알 수 없음

**개선안**:
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  if (!instance || !instance.element) {
    console.warn('[WKit.removeCustomEvents] instance.element가 없습니다.');
    return;
  }

  if (!instance.userHandlerList) {
    return;
  }

  let removedCount = 0;

  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
          delete instance.userHandlerList[eventName][selector];
          removedCount++;

          if (Object.keys(instance.userHandlerList[eventName]).length === 0) {
            delete instance.userHandlerList[eventName];
          }
        }
      }, Object.keys(selectorList));
    })
  );

  console.log(`[WKit.removeCustomEvents] ${removedCount}개 이벤트 리스너 제거됨`);
};
```

## 개선 우선순위
1. **High**: userHandlerList에서 핸들러 참조 제거 (메모리 누수 방지)
2. **Medium**: instance.element 존재 확인
3. **Medium**: fx.map을 fx.each로 변경
4. **Low**: removeAllEvents 추가 고려
5. **Low**: 디버깅 로그 추가

## 관련 함수
- `WKit.bindEvents()` - Public API (`WKit.js:14-24`)
- `delegate()` - Internal (`WKit.js:365-380`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스
const instance = {
  element: document.querySelector('#my-component'),
  customEvents: {
    click: {
      '.submit-btn': '@submitForm'
    }
  },
  userHandlerList: {
    click: {
      '.submit-btn': handlerFunction
    }
  }
};

WKit.removeCustomEvents(instance, instance.customEvents);
// 예상: 이벤트 리스너 제거됨
// 현재 문제: userHandlerList에 handlerFunction 참조 남음
// 개선 후: userHandlerList에서도 제거됨

// 2. 이미 제거된 경우
WKit.removeCustomEvents(instance, instance.customEvents);
WKit.removeCustomEvents(instance, instance.customEvents); // 두 번 호출
// 예상: 에러 없이 안전하게 처리

// 3. element가 null인 경우
instance.element = null;
WKit.removeCustomEvents(instance, instance.customEvents);
// 현재: 에러 발생 가능
// 개선 후: 경고 로그 출력 후 안전하게 종료

// 4. customEvents와 실제 등록된 핸들러 불일치
instance.customEvents.click['.new-btn'] = '@newEvent';
WKit.removeCustomEvents(instance, instance.customEvents);
// 예상: '.submit-btn'만 제거, '.new-btn'는 없으므로 무시

// 5. 메모리 누수 확인
let count = 0;
for (let i = 0; i < 1000; i++) {
  const inst = {
    element: document.createElement('div'),
    customEvents: { click: { '.btn': '@click' } }
  };
  WKit.bindEvents(inst, inst.customEvents);
  WKit.removeCustomEvents(inst, inst.customEvents);

  // 현재: userHandlerList에 핸들러 참조 남음 → 메모리 증가
  // 개선 후: 완전히 정리됨 → 메모리 일정
}
```

## 실제 사용 흐름
```javascript
// Component 라이프사이클

// 1. Register
function initComponent() {
  this.customEvents = {
    click: {
      '.submit-btn': '@submitForm'
    }
  };

  WKit.bindEvents(this, this.customEvents);
  // → userHandlerList에 핸들러 저장
}

// 2. 사용자 인터랙션
// .submit-btn 클릭 → 핸들러 실행 → WEventBus.emit

// 3. Destroy
function onInstanceUnLoad() {
  WKit.removeCustomEvents(this, this.customEvents);
  // → 이벤트 리스너 제거
  // → (개선 필요) userHandlerList 정리

  this.customEvents = null;
  this.userHandlerList = null; // 명시적 정리 필요
}
```

## 보완 제안: removeAllEvents
```javascript
// 더 안전한 대안 API
WKit.removeAllEvents = function (instance) {
  if (!instance || !instance.element) {
    return;
  }

  if (!instance.userHandlerList) {
    return;
  }

  let removedCount = 0;

  for (const [eventName, selectorMap] of Object.entries(instance.userHandlerList)) {
    for (const [selector, handler] of Object.entries(selectorMap)) {
      instance.element.removeEventListener(eventName, handler);
      removedCount++;
    }
  }

  // 완전히 초기화
  instance.userHandlerList = {};

  console.log(`[WKit.removeAllEvents] ${removedCount}개 이벤트 리스너 제거됨`);
};

// 사용 (더 간단하고 안전)
function onInstanceUnLoad() {
  WKit.removeAllEvents(this);
}
```
