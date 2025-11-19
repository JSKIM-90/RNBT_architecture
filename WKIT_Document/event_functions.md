# WKit Event Functions

WEventBus 연동 및 이벤트 발행/구독 관련 함수들입니다.

---

## WKit.emitEvent

### 위치
`WKit.js:143-148`

### 시그니처
```javascript
WKit.emitEvent(eventName: string, targetInstance: Instance): void
```

### 역할
특정 인스턴스에 대한 이벤트를 WEventBus로 발행합니다.

### 필요성
⭐⭐⭐ 필요함

### 사용 예시
```javascript
// 코드에서 직접 이벤트 발생
const targetComp = WKit.getInstanceByName('DataTable', WKit.makeIterator(page));
WKit.emitEvent('@refreshData', targetComp);
```

### 구현
```javascript
WKit.emitEvent = function (eventName, targetInstance) {
  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    targetInstance,
  });
};
```

### 잘된 점 ✅
- **간단함**: WEventBus.emit의 얇은 래퍼
- **디버깅**: 콘솔 로그로 코드에서 발생한 이벤트 추적 가능
- **일관성**: event 객체에 targetInstance 포함

### 개선점 ⚠️

#### 1. event 객체에 event 속성 없음
**문제점**:
- DOM 이벤트는 `{ event, targetInstance }`인데 이건 `{ targetInstance }`만
- 일관성 부족

**개선안**:
```javascript
WKit.emitEvent = function (eventName, targetInstance, additionalData = {}) {
  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    event: null,  // 코드에서 발생했으므로 DOM 이벤트 없음
    targetInstance,
    ...additionalData
  });
};

// 사용
WKit.emitEvent('@refreshData', comp, { reason: 'user-action' });
```

#### 2. 파라미터 검증 없음
```javascript
WKit.emitEvent = function (eventName, targetInstance, additionalData = {}) {
  if (!eventName) {
    console.warn('[WKit.emitEvent] eventName is required');
    return;
  }

  if (!targetInstance) {
    console.warn('[WKit.emitEvent] targetInstance is required');
    return;
  }

  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    event: null,
    targetInstance,
    ...additionalData
  });
};
```

---

## ~~WKit.triggerEventToTargetInstance~~ (DEPRECATED)

> **⚠️ 이 API는 v1.1.0에서 제거되었습니다**
>
> **제거 이유**: Primitive Building Blocks 원칙 적용
> - 단순히 `getInstanceByName` + `emitEvent` 조합
> - 사용자가 2-3줄로 직접 작성 가능
> - fx.range(1) 안티패턴 포함
>
> **대안**: 아래 "제거 후 사용 방법" 참고

### 위치
~~`WKit.js:150-160`~~ - **제거됨**

### 시그니처
```javascript
WKit.triggerEventToTargetInstance(
  targetInstanceName: string,
  eventName: string,
  iter?: Iterator<Instance>
): void
```

### 역할 (제거 전)
이름으로 인스턴스를 찾아 이벤트를 발행합니다. `getInstanceByName` + `emitEvent`를 결합한 유틸리티.

### 제거 이유

1. **단순 조합**: primitive 2개만 조합 (`getInstanceByName` + `emitEvent`)
2. **불필요한 래핑**: 사용자가 직접 작성하면 2-3줄
3. **fx.range(1) 안티패턴**: 불필요한 더미 값 생성
4. **명확성**: 직접 작성이 오히려 더 읽기 쉬움

### 제거 후 사용 방법

**Before (제거 전)**:
```javascript
const { triggerEventToTargetInstance } = WKit;
triggerEventToTargetInstance('DataMappedComponent', '@myClickEvent');
```

**After (제거 후)**:
```javascript
const { getInstanceByName, makeIterator, emitEvent } = WKit;

// primitive 조합으로 명확함
const iter = makeIterator(wemb.mainPageComponent);
const targetInstance = getInstanceByName('DataMappedComponent', iter);
if (targetInstance) {
    emitEvent('@myClickEvent', targetInstance);
}
```

**장점**:
- ✅ 코드 흐름이 명확함
- ✅ 인스턴스 찾지 못했을 때 처리 가능
- ✅ fx.range(1) 안티패턴 제거됨
- ✅ 디버깅 용이

---

## 과거 평가 (참고용)

### 필요성 (제거 전)
⭐⭐⭐⭐ 자주 사용 → **불필요** ❌

### 사용 예시
```javascript
// completed 훅에서 다른 컴포넌트에 이벤트 전달
const { triggerEventToTargetInstance } = WKit;
const { targetInstanceName, eventName } = getDefaultEventTarget();

triggerEventToTargetInstance(targetInstanceName, eventName);

function getDefaultEventTarget() {
  return {
    targetInstanceName: 'DataMappedComponent',
    eventName: '@myClickEvent'
  }
}
```

### 구현
```javascript
WKit.triggerEventToTargetInstance = function (
  targetInstanceName,
  eventName,
  iter = WKit.makeIterator(wemb.mainPageComponent)
) {
  fx.go(
    fx.range(1),
    (_) => WKit.getInstanceByName(targetInstanceName, iter),
    fx.curry(WKit.emitEvent)(eventName)
  );
};
```

### 잘된 점 ✅
- **편의성**: 인스턴스 찾기와 이벤트 발행을 하나의 함수로
- **기본 iterator**: iter 생략 가능
- **함수형 파이프라인**: fx.go로 단계 명확

### 개선점 ⚠️

#### 1. fx.range(1) 불필요
**현재 코드**:
```javascript
fx.go(
  fx.range(1),  // [0] 생성 - 불필요
  (_) => WKit.getInstanceByName(targetInstanceName, iter),
  fx.curry(WKit.emitEvent)(eventName)
);
```

**문제점**:
- `fx.range(1)`은 [0]을 생성하는데 사용하지 않음
- 단지 파이프라인 시작을 위한 더미 값

**개선안**:
```javascript
WKit.triggerEventToTargetInstance = function (
  targetInstanceName,
  eventName,
  iter = WKit.makeIterator(wemb.mainPageComponent)
) {
  const targetInstance = WKit.getInstanceByName(targetInstanceName, iter);

  if (targetInstance) {
    WKit.emitEvent(eventName, targetInstance);
  } else {
    console.warn(
      `[WKit.triggerEventToTargetInstance] Instance "${targetInstanceName}" not found`
    );
  }
};
```

#### 2. 인스턴스 못 찾을 때 처리 없음
**현재 코드**:
```javascript
const targetInstance = WKit.getInstanceByName(targetInstanceName, iter);
// undefined일 수 있음
fx.curry(WKit.emitEvent)(eventName)(targetInstance);
// targetInstance가 undefined면 이벤트는 발행되지만 의미 없음
```

**문제점**:
- 인스턴스를 찾지 못해도 조용히 실패
- 디버깅 어려움

**개선안**: (위 개선안에 포함됨)

#### 3. wemb.mainPageComponent 의존성
**문제점**:
- 전역 객체 `wemb`에 의존
- 기본값이 항상 mainPageComponent

**개선안**:
```javascript
WKit.triggerEventToTargetInstance = function (
  targetInstanceName,
  eventName,
  iter
) {
  // iter가 없으면 경고
  if (!iter) {
    console.warn('[WKit.triggerEventToTargetInstance] iterator is required');
    return;
  }

  const targetInstance = WKit.getInstanceByName(targetInstanceName, iter);

  if (targetInstance) {
    WKit.emitEvent(eventName, targetInstance);
  } else {
    console.warn(
      `[WKit.triggerEventToTargetInstance] Instance "${targetInstanceName}" not found`
    );
  }
};

// 사용
WKit.triggerEventToTargetInstance(
  'MyComponent',
  '@event',
  WKit.makeIterator(wemb.mainPageComponent)  // 명시적 전달
);
```

---

## WKit.onEventBusHandlers

### 위치
`WKit.js:163-168`

### 시그니처
```javascript
WKit.onEventBusHandlers(eventBusHandlers: Object): void
```

### 역할
여러 이벤트 핸들러를 한 번에 WEventBus에 등록합니다.

### 필요성
⭐⭐⭐⭐⭐ 매우 필요함

### 사용 예시
```javascript
// Page - loaded
function initPageController() {
  this.eventBusHandlers = {
    '@myClickEvent': async ({ event, targetInstance }) => {
      const data = await WKit.pipeForDataMapping(targetInstance);
      console.log(data);
    },
    '@submitForm': ({ event }) => {
      event.preventDefault();
      // 처리
    }
  };

  WKit.onEventBusHandlers(this.eventBusHandlers);
}
```

### 구현
```javascript
WKit.onEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.map(([eventName, handler]) => WEventBus.on(eventName, handler))
  );
};
```

### 잘된 점 ✅
- **일괄 등록**: 여러 핸들러를 한 번에
- **간결함**: 함수형 파이프라인

### 개선점 ⚠️

#### 1. fx.map 반환값 미사용
**현재 코드**:
```javascript
fx.map(([eventName, handler]) => WEventBus.on(eventName, handler))
// WEventBus.on의 반환값 사용 안 함
```

**개선안**:
```javascript
WKit.onEventBusHandlers = function (eventBusHandlers) {
  if (!eventBusHandlers || typeof eventBusHandlers !== 'object') {
    console.warn('[WKit.onEventBusHandlers] eventBusHandlers must be an object');
    return;
  }

  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => {
      if (typeof handler !== 'function') {
        console.warn(`[WKit.onEventBusHandlers] Handler for "${eventName}" is not a function`);
        return;
      }
      WEventBus.on(eventName, handler);
    })
  );
};
```

#### 2. 중복 등록 방지 없음
**문제점**:
- 같은 핸들러를 여러 번 등록하면 중복 실행

**개선안**: (WEventBus에서 처리하거나 문서화)

---

## WKit.offEventBusHandlers

### 위치
`WKit.js:170-175`

### 시그니처
```javascript
WKit.offEventBusHandlers(eventBusHandlers: Object): void
```

### 역할
여러 이벤트 핸들러를 한 번에 WEventBus에서 제거합니다.

### 필요성
⭐⭐⭐⭐⭐ 매우 필요함 (메모리 누수 방지)

### 사용 예시
```javascript
// Page - before_unload
function clearEventBus() {
  WKit.offEventBusHandlers(this.eventBusHandlers);
  this.eventBusHandlers = null;
}
```

### 구현
```javascript
WKit.offEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.map(([eventName, handler]) => WEventBus.off(eventName, handler))
  );
};
```

### 잘된 점 ✅
- **onEventBusHandlers와 대칭**: 등록/해제 대칭
- **일괄 제거**: 페이지 unload 시 편리

### 개선점 ⚠️

#### 1. onEventBusHandlers와 동일한 개선 필요
```javascript
WKit.offEventBusHandlers = function (eventBusHandlers) {
  if (!eventBusHandlers || typeof eventBusHandlers !== 'object') {
    console.warn('[WKit.offEventBusHandlers] eventBusHandlers must be an object');
    return;
  }

  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => {
      WEventBus.off(eventName, handler);
    })
  );
};
```

#### 2. 핸들러 참조 동일성 필요
**중요**:
```javascript
// ❌ 작동 안 함
const handlers1 = {
  '@event': () => { console.log('test'); }
};
WKit.onEventBusHandlers(handlers1);

const handlers2 = {
  '@event': () => { console.log('test'); }  // 다른 함수 객체!
};
WKit.offEventBusHandlers(handlers2);  // 제거 안 됨

// ✅ 작동
this.eventBusHandlers = {
  '@event': this.handleEvent.bind(this)
};
WKit.onEventBusHandlers(this.eventBusHandlers);
// ...
WKit.offEventBusHandlers(this.eventBusHandlers);  // 같은 참조로 제거
```

---

## 통합 개선안

```javascript
// emitEvent
WKit.emitEvent = function (eventName, targetInstance, additionalData = {}) {
  if (!eventName) {
    console.warn('[WKit.emitEvent] eventName is required');
    return;
  }

  if (!targetInstance) {
    console.warn('[WKit.emitEvent] targetInstance is required');
    return;
  }

  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    event: null,  // 코드에서 발생
    targetInstance,
    ...additionalData
  });
};

// triggerEventToTargetInstance
WKit.triggerEventToTargetInstance = function (
  targetInstanceName,
  eventName,
  iter = WKit.makeIterator(wemb.mainPageComponent)
) {
  if (!targetInstanceName || !eventName) {
    console.warn('[WKit.triggerEventToTargetInstance] Parameters are required');
    return;
  }

  const targetInstance = WKit.getInstanceByName(targetInstanceName, iter);

  if (targetInstance) {
    WKit.emitEvent(eventName, targetInstance);
  } else {
    console.warn(
      `[WKit.triggerEventToTargetInstance] Instance "${targetInstanceName}" not found`
    );
  }
};

// onEventBusHandlers
WKit.onEventBusHandlers = function (eventBusHandlers) {
  if (!eventBusHandlers || typeof eventBusHandlers !== 'object') {
    console.warn('[WKit.onEventBusHandlers] eventBusHandlers must be an object');
    return;
  }

  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => {
      if (typeof handler !== 'function') {
        console.warn(`[WKit.onEventBusHandlers] Handler for "${eventName}" is not a function`);
        return;
      }
      WEventBus.on(eventName, handler);
    })
  );
};

// offEventBusHandlers
WKit.offEventBusHandlers = function (eventBusHandlers) {
  if (!eventBusHandlers || typeof eventBusHandlers !== 'object') {
    console.warn('[WKit.offEventBusHandlers] eventBusHandlers must be an object');
    return;
  }

  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => {
      WEventBus.off(eventName, handler);
    })
  );
};
```

---

## 테스트 시나리오

### emitEvent
```javascript
// 1. 정상
const comp = WKit.getInstanceByName('MyComp', WKit.makeIterator(page));
WKit.emitEvent('@refresh', comp);
// WEventBus에 이벤트 발행됨

// 2. 추가 데이터 (개선 후)
WKit.emitEvent('@refresh', comp, { reason: 'data-updated' });

// 3. null 파라미터
WKit.emitEvent(null, comp);
// 개선 후: 경고 로그
```

### triggerEventToTargetInstance
```javascript
// 1. 정상
WKit.triggerEventToTargetInstance('MyComp', '@refresh');
// MyComp를 찾아 이벤트 발행

// 2. 인스턴스 없음
WKit.triggerEventToTargetInstance('NotExist', '@event');
// 개선 후: "Instance not found" 경고

// 3. 커스텀 iterator
WKit.triggerEventToTargetInstance(
  'ThreeComp',
  '@click',
  WKit.makeIterator(page, 'threeLayer')
);
```

### onEventBusHandlers & offEventBusHandlers
```javascript
// Page - loaded
this.eventBusHandlers = {
  '@event1': this.handler1.bind(this),
  '@event2': this.handler2.bind(this)
};

WKit.onEventBusHandlers(this.eventBusHandlers);
// 2개 핸들러 등록됨

// Page - before_unload
WKit.offEventBusHandlers(this.eventBusHandlers);
// 2개 핸들러 제거됨
this.eventBusHandlers = null;
```

---

## 실제 사용 흐름

### 컴포넌트 간 통신
```javascript
// Component A - completed
WKit.triggerEventToTargetInstance('ComponentB', '@dataReady');

// Page - loaded
this.eventBusHandlers = {
  '@dataReady': async ({ targetInstance }) => {
    const data = await WKit.fetchData(page, 'api', {});
    // ComponentB에 데이터 전달
  }
};
WKit.onEventBusHandlers(this.eventBusHandlers);
```

### 프로그래밍 방식 이벤트 발행
```javascript
// API 호출 후 자동으로 이벤트 발행
async function refreshData() {
  const data = await fetchAPI();

  const chart = WKit.getInstanceByName('Chart', WKit.makeIterator(page));
  WKit.emitEvent('@dataUpdated', chart, { data });
}

// 핸들러
this.eventBusHandlers = {
  '@dataUpdated': ({ targetInstance, data }) => {
    targetInstance.updateChart(data);
  }
};
```

---

## 개선 우선순위

### 전체
1. **High**: fx.map을 fx.each로 변경 (부수효과 명시)
2. **High**: triggerEventToTargetInstance의 fx.range(1) 제거
3. **Medium**: 파라미터 검증
4. **Low**: emitEvent의 additionalData 지원
