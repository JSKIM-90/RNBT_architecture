# WEventBus 상세 명세

## 개요

Pub-Sub (발행-구독) 패턴 기반의 이벤트 버스로, 컴포넌트 간 느슨한 결합(loose coupling)을 통한 통신을 지원합니다.

## 아키텍처

### IIFE 패턴 (즉시 실행 함수)

```javascript
const WEventBus = (() => {
  // Private 상태
  const listeners = new Map();

  // Public API 반환
  return { on, off, emit, once };
})();
```

**목적**: 클로저를 이용해 `listeners` 상태를 캡슐화하고 외부에서 직접 접근 불가능하게 만듦

---

## 내부 상태

### listeners
**타입**: `Map<string, Array<Function>>`

**용도**: 이벤트명별 콜백 함수 목록 관리

**구조**:
```javascript
listeners = Map {
  '@buttonClicked' => [
    callback1,  // 첫 번째 구독자
    callback2,  // 두 번째 구독자
    callback3   // 세 번째 구독자
  ],
  '@userSelected' => [
    callback4
  ]
}
```

**생성 시점**: `on()` 또는 `once()` 호출 시
**사용 시점**: `emit()` 에서 콜백 실행 시
**제거 시점**: `off()` 호출 시 또는 페이지 unload 시

**왜 Map<Array>를 사용하는가?**
- **Map**: 이벤트명(문자열)으로 O(1) 조회
- **Array**: 등록 순서 보장 (FIFO), 동일 콜백 중복 등록 가능
- **Set 대신 Array**: 의도적인 중복 구독 허용 (같은 핸들러를 여러 번 등록 가능)

---

## 메서드 상세

### 1. on(event, callback)

#### 시그니처
```javascript
on(
  event: string,      // 이벤트명 (관례: '@' 접두사)
  callback: Function  // 이벤트 발생 시 실행할 콜백
): void
```

#### 목적
특정 이벤트에 콜백 함수를 구독자로 등록

---

#### 동작 흐름 (소스 레벨)

**코드** (WEventbus.js:6-11):
```javascript
on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(callback);
}
```

**동작**:
1. `listeners` Map에 이벤트가 없으면 빈 배열 생성
2. 이벤트의 배열에 callback 추가 (push)

**단계별 분석**:

**1단계: 이벤트 존재 확인**
```javascript
if (!listeners.has(event))
```
- Map의 `has()` 메서드로 O(1) 조회
- 해당 이벤트가 처음 등록되는지 확인

**2단계: 빈 배열 초기화**
```javascript
listeners.set(event, []);
```
- 새 이벤트면 콜백을 담을 빈 배열 생성
- 기존 이벤트면 이 단계 스킵

**3단계: 콜백 추가**
```javascript
listeners.get(event).push(callback);
```
- 배열의 끝에 callback 추가 (FIFO 순서 보장)
- `push()`는 배열을 변경하고 새 length 반환

**예시**:
```javascript
// 첫 번째 구독
WEventBus.on('@buttonClicked', handler1);

// listeners 내부:
// Map {
//   '@buttonClicked' => [handler1]
// }

// 두 번째 구독 (같은 이벤트)
WEventBus.on('@buttonClicked', handler2);

// listeners 내부:
// Map {
//   '@buttonClicked' => [handler1, handler2]
// }

// 중복 구독 허용!
WEventBus.on('@buttonClicked', handler1);

// listeners 내부:
// Map {
//   '@buttonClicked' => [handler1, handler2, handler1]  // 중복됨!
// }
```

**중복 구독 처리**:
- **Array 사용**: 동일 콜백을 여러 번 등록 가능
- **의도적 설계**: 특정 시나리오에서 같은 핸들러를 여러 번 실행해야 할 수 있음
- **주의**: 의도치 않은 중복 등록 시 핸들러가 여러 번 실행됨

**사용 패턴**:
```javascript
// Page - before_load
this.eventBusHandlers = {
  '@buttonClicked': async ({ event, targetInstance }) => {
    console.log('Button clicked:', targetInstance.name);
  },
  '@userSelected': async ({ userId }) => {
    const user = await WKit.fetchData(this, 'users', { id: userId });
    console.log('User:', user);
  }
};

// 일괄 등록
WKit.onEventBusHandlers(this.eventBusHandlers);
```

---

### 2. off(event, callback)

#### 시그니처
```javascript
off(
  event: string,      // 구독 해제할 이벤트명
  callback: Function  // 제거할 콜백 함수
): void
```

#### 목적
특정 이벤트에서 콜백 함수를 구독 해제 (메모리 누수 방지)

---

#### 동작 흐름 (소스 레벨)

**코드** (WEventbus.js:13-17):
```javascript
off(event, callback) {
  if (!listeners.has(event)) return;
  const newList = listeners.get(event).filter((cb) => cb !== callback);
  listeners.set(event, newList);
}
```

**동작**:
1. 이벤트가 등록되어 있지 않으면 조기 종료
2. 배열에서 일치하는 콜백을 제외한 새 배열 생성 (`filter`)
3. 새 배열로 교체

**단계별 분석**:

**1단계: 방어 코드**
```javascript
if (!listeners.has(event)) return;
```
- 등록되지 않은 이벤트에서 구독 해제 시도 시 안전하게 종료
- 에러 발생 방지

**2단계: 콜백 필터링**
```javascript
const newList = listeners.get(event).filter((cb) => cb !== callback);
```
- `filter()`로 일치하지 않는 콜백만 유지
- `===` 참조 비교로 동일 함수 확인
- 원본 배열은 변경하지 않고 새 배열 생성

**3단계: 새 배열로 교체**
```javascript
listeners.set(event, newList);
```
- Map에 필터링된 배열로 업데이트
- 기존 배열은 GC 대상이 됨

**예시**:
```javascript
// 초기 상태
listeners.get('@buttonClicked') = [handler1, handler2, handler1];

// handler1 제거
WEventBus.off('@buttonClicked', handler1);

// 내부 동작:
// 1) filter((cb) => cb !== handler1)
// 2) newList = [handler2]  // 모든 handler1이 제거됨!
// 3) listeners.set('@buttonClicked', [handler2])

// 최종 상태
listeners.get('@buttonClicked') = [handler2];
```

**주의사항 - 모든 중복 제거**:
```javascript
// 중복 등록
WEventBus.on('@click', handler);
WEventBus.on('@click', handler);
WEventBus.on('@click', handler);

// listeners.get('@click') = [handler, handler, handler]

// 한 번 off() 호출
WEventBus.off('@click', handler);

// listeners.get('@click') = []  // 모두 제거됨!
```

**왜 filter()를 사용하는가?**
- 배열에서 특정 요소를 모두 제거하는 간결한 방법
- 중복된 콜백을 한 번에 모두 제거 (의도적 설계)
- 불변성 유지 (원본 배열 변경하지 않음)

**사용 패턴**:
```javascript
// Page - before_unload
function clearEventBus() {
  WKit.offEventBusHandlers.call(this, this.eventBusHandlers);
  this.eventBusHandlers = null;
}
```

---

### 3. emit(event, data)

#### 시그니처
```javascript
emit(
  event: string,   // 발행할 이벤트명
  data: any        // 콜백에 전달할 데이터
): void
```

#### 목적
특정 이벤트를 발행하여 모든 구독자의 콜백을 순차 실행

---

#### 동작 흐름 (소스 레벨)

**코드** (WEventbus.js:19-24):
```javascript
emit(event, data) {
  if (!listeners.has(event)) return;
  for (const callback of listeners.get(event)) {
    callback(data);
  }
}
```

**동작**:
1. 이벤트가 등록되어 있지 않으면 조기 종료
2. 등록된 모든 콜백을 순차 실행

**단계별 분석**:

**1단계: 방어 코드**
```javascript
if (!listeners.has(event)) return;
```
- 구독자가 없는 이벤트 발행 시 안전하게 종료
- 빈 배열도 아닌 `undefined` 상태 방지

**2단계: 콜백 순차 실행**
```javascript
for (const callback of listeners.get(event)) {
  callback(data);
}
```
- `for...of`로 배열 순회 (등록 순서 보장)
- 각 콜백에 `data` 전달
- **동기 실행**: 비동기 콜백이어도 기다리지 않음

**예시**:
```javascript
// 구독 등록
WEventBus.on('@buttonClicked', ({ targetInstance }) => {
  console.log('Handler 1:', targetInstance.name);
});

WEventBus.on('@buttonClicked', ({ targetInstance }) => {
  console.log('Handler 2:', targetInstance.name);
});

// 이벤트 발행
WEventBus.emit('@buttonClicked', {
  event: clickEvent,
  targetInstance: buttonComponent
});

// 콘솔 출력 (순서 보장):
// Handler 1: MyButton
// Handler 2: MyButton
```

**비동기 콜백 처리**:
```javascript
// 비동기 콜백 등록
WEventBus.on('@dataFetch', async (params) => {
  const data = await fetch('/api/users');  // 비동기
  console.log('Data fetched');
});

WEventBus.on('@dataFetch', () => {
  console.log('Sync handler');
});

// 이벤트 발행
WEventBus.emit('@dataFetch', { id: 1 });

// 콘솔 출력 순서:
// Sync handler  // 즉시 출력
// (fetch 완료 후)
// Data fetched  // 나중에 출력

// emit()은 비동기 콜백을 기다리지 않음!
```

**에러 처리**:
```javascript
// 콜백에서 에러 발생
WEventBus.on('@event', () => {
  throw new Error('Boom!');
});

WEventBus.on('@event', () => {
  console.log('This will NOT execute');  // 실행 안됨!
});

// 발행
WEventBus.emit('@event', {});
// => Error: Boom!
// => 두 번째 콜백은 실행되지 않음 (에러 전파)
```

**사용 패턴**:
```javascript
// Component - 이벤트 발행
WKit.delegate(instance, 'click', '.my-button', (event) => {
  WEventBus.emit('@buttonClicked', {
    event,
    targetInstance: instance
  });
});
```

---

### 4. once(event, callback)

#### 시그니처
```javascript
once(
  event: string,      // 이벤트명
  callback: Function  // 한 번만 실행할 콜백
): void
```

#### 목적
이벤트를 한 번만 구독하고 실행 후 자동 해제

---

#### 동작 흐름 (소스 레벨)

**코드** (WEventbus.js:26-32):
```javascript
once(event, callback) {
  const wrapper = (data) => {
    callback(data);
    this.off(event, wrapper);
  };
  this.on(event, wrapper);
}
```

**동작**:
1. 원본 콜백을 감싸는 `wrapper` 함수 생성
2. `wrapper`가 실행되면:
   - 원본 `callback` 실행
   - 자기 자신(`wrapper`)을 구독 해제
3. `wrapper`를 이벤트에 등록

**단계별 분석**:

**1단계: Wrapper 함수 생성**
```javascript
const wrapper = (data) => {
  callback(data);
  this.off(event, wrapper);
};
```
- 클로저로 원본 `callback`과 `event` 캡처
- `callback(data)` 실행 후 `this.off(event, wrapper)` 호출
- `this`는 `WEventBus` 객체를 가리킴 (리턴된 객체)

**2단계: Wrapper 등록**
```javascript
this.on(event, wrapper);
```
- 원본 콜백 대신 `wrapper`를 등록
- `listeners`에는 `wrapper` 참조가 저장됨

**실행 흐름**:
```javascript
// once 등록
WEventBus.once('@init', (data) => {
  console.log('Initialized:', data);
});

// listeners 내부:
// Map {
//   '@init' => [wrapper]  // wrapper 함수가 등록됨
// }

// 첫 번째 발행
WEventBus.emit('@init', { status: 'ready' });
// 실행 순서:
// 1) wrapper 실행
// 2) callback({ status: 'ready' }) 실행
//    => 콘솔: Initialized: { status: 'ready' }
// 3) this.off('@init', wrapper) 실행
//    => listeners.get('@init') = []

// 두 번째 발행
WEventBus.emit('@init', { status: 'ready' });
// 아무 일도 일어나지 않음 (구독자 없음)
```

**예시**:
```javascript
// 초기화 이벤트는 한 번만 필요
WEventBus.once('@pageLoaded', () => {
  console.log('Page loaded');
  initializeApp();
});

// 페이지 로드 완료
WEventBus.emit('@pageLoaded', {});
// => 콘솔: Page loaded
// => initializeApp() 실행
// => 자동으로 구독 해제됨

// 다시 발행해도 실행 안됨
WEventBus.emit('@pageLoaded', {});
// => (아무 일도 일어나지 않음)
```

**왜 wrapper를 사용하는가?**
- **자동 정리**: 사용자가 `off()`를 직접 호출할 필요 없음
- **메모리 안전성**: 한 번 실행 후 참조 해제되어 GC 가능
- **편의성**: 일회성 이벤트 처리 간편화

**주의사항 - 클로저 메모리**:
```javascript
const largeData = new Array(1000000).fill('data');

WEventBus.once('@event', (data) => {
  console.log(largeData.length);  // 클로저로 largeData 캡처
});

// wrapper가 실행되기 전까지 largeData가 메모리에 유지됨
// 이벤트가 발행되지 않으면 메모리 누수 가능!
```

---

## 설계 의도

### 왜 Map<Array>인가?

**Map 사용 이유**:
- 이벤트명(문자열)으로 빠른 조회 (O(1))
- 동적으로 이벤트 추가/제거 용이
- `has()`, `get()`, `set()` 메서드의 가독성

**Array 사용 이유** (Set 대신):
- **등록 순서 보장**: 콜백 실행 순서 예측 가능
- **중복 허용**: 의도적으로 같은 핸들러를 여러 번 등록 가능
- **단순성**: Set보다 직관적

**GlobalDataPublisher와의 차이**:
```javascript
// GlobalDataPublisher: Map<Set>
subscriberTable = Map {
  'users' => Set([...])  // 중복 방지
}

// WEventBus: Map<Array>
listeners = Map {
  '@click' => [...]  // 중복 허용, 순서 보장
}
```

---

### 왜 filter()로 모두 제거하는가?

**설계 선택**:
```javascript
// off() 구현
const newList = listeners.get(event).filter((cb) => cb !== callback);
```

**장점**:
- 간결한 코드 (한 줄로 모든 중복 제거)
- 의도치 않은 중복 등록으로 인한 버그 방지

**단점**:
- 중복 등록 시 한 번 `off()` 호출로 모두 제거됨
- 세밀한 제어 불가 (N개 중 1개만 제거 불가)

**대안 (splice 사용)**:
```javascript
// 첫 번째 일치 항목만 제거
const index = callbacks.indexOf(callback);
if (index !== -1) {
  callbacks.splice(index, 1);
}
```

---

## 사용 패턴

### 패턴 1: 페이지 이벤트 핸들러

```javascript
// Page - before_load
this.eventBusHandlers = {
  '@buttonClicked': async ({ event, targetInstance }) => {
    const { datasetInfo } = targetInstance;
    if (datasetInfo) {
      const { datasetName, param } = datasetInfo;
      const data = await WKit.fetchData(this, datasetName, param);
      console.log('Data:', data);
    }
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);
```

### 패턴 2: 컴포넌트 이벤트 발행

```javascript
// Component - register
WKit.bindEvents(this, {
  click: {
    '.my-button': '@myButtonClicked'
  }
});

// WKit 내부에서 발행
WEventBus.emit('@myButtonClicked', {
  event,
  targetInstance
});
```

### 패턴 3: 일회성 초기화

```javascript
// 한 번만 실행되는 초기화
WEventBus.once('@appReady', () => {
  console.log('App initialized');
  loadUserPreferences();
});

// 초기화 완료 시 발행
WEventBus.emit('@appReady', {});
```

---

## 메모리 관리

### 구독 해제 필요성

**메모리 누수 시나리오**:
```javascript
// Page - before_load
this.eventBusHandlers = {
  '@event': (data) => {
    // this는 페이지 인스턴스를 캡처
    console.log(this.name);
  }
};

WKit.onEventBusHandlers(this.eventBusHandlers);

// 페이지 전환 시 구독 해제하지 않으면:
// - listeners에 콜백 참조 유지
// - 콜백이 페이지 인스턴스를 클로저로 캡처
// - 페이지 인스턴스 GC 불가 (메모리 누수)
```

**올바른 정리**:
```javascript
// Page - before_unload
function clearEventBus() {
  WKit.offEventBusHandlers.call(this, this.eventBusHandlers);
  this.eventBusHandlers = null;
}
```

---

## 제약사항

### 1. 에러 전파

```javascript
// 첫 번째 콜백에서 에러 발생
WEventBus.on('@event', () => {
  throw new Error('Error');
});

WEventBus.on('@event', () => {
  console.log('Never executed');  // 실행 안됨
});

WEventBus.emit('@event', {});
// => Error 발생, 두 번째 콜백 실행 안됨
```

**해결책**:
```javascript
// 각 콜백을 try-catch로 감싸기
emit(event, data) {
  if (!listeners.has(event)) return;
  for (const callback of listeners.get(event)) {
    try {
      callback(data);
    } catch (error) {
      console.error(`[WEventBus] Error in ${event}:`, error);
    }
  }
}
```

### 2. 비동기 콜백 미대기

```javascript
// 비동기 콜백
WEventBus.on('@fetch', async () => {
  await fetch('/api/data');
  console.log('Done');
});

WEventBus.emit('@fetch', {});
console.log('Emitted');

// 출력 순서:
// Emitted  // 즉시
// Done     // fetch 완료 후
```

### 3. 중복 등록 시 모두 제거

```javascript
WEventBus.on('@event', handler);
WEventBus.on('@event', handler);
WEventBus.on('@event', handler);

WEventBus.off('@event', handler);
// => 모든 handler 제거됨 (3개 모두)
```

---

## 디버깅 팁

### listeners 상태 확인

```javascript
// 브라우저 콘솔에서
console.log(WEventBus._debug_listeners);
// => Map {
//      '@buttonClicked' => [callback1, callback2],
//      '@userSelected' => [callback3]
//    }
```

### 구독자 수 확인

```javascript
const callbacks = WEventBus._debug_listeners.get('@myEvent');
console.log(`'@myEvent' 구독자 수: ${callbacks?.length || 0}`);
```

### 이벤트 발행 추적

```javascript
// emit 래핑
const originalEmit = WEventBus.emit;
WEventBus.emit = function(event, data) {
  console.log(`[WEventBus] Emitting: ${event}`, data);
  return originalEmit.call(this, event, data);
};
```

---

## GlobalDataPublisher vs WEventBus

### 차이점

| 특징 | GlobalDataPublisher | WEventBus |
|------|---------------------|-----------|
| **용도** | 데이터 공유 | 이벤트 통신 |
| **구조** | Map<Set> | Map<Array> |
| **중복** | 방지 (Set) | 허용 (Array) |
| **데이터** | fetch & 전파 | 단순 전달 |
| **바인딩** | instance 필요 | callback만 |
| **메모리** | instance 기반 해제 | callback 기반 해제 |

### 사용 선택 기준

**GlobalDataPublisher 사용**:
- 여러 컴포넌트가 동일한 데이터를 구독
- 데이터 fetch 및 자동 전파 필요
- topic 기반 데이터 관리

**WEventBus 사용**:
- 컴포넌트 간 이벤트 통신
- 단순 알림 및 트리거
- 커스텀 워크플로우 구성

---

## 버전 정보

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-20
**관련 파일**: `Utils/WEventbus.js:1-34`
