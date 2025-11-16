# WKit.bind3DEvents

## 위치
`WKit.js:51-57`

## 시그니처
```javascript
WKit.bind3DEvents(instance: Instance, customEvents: CustomEvents3DSchema): void
```

## 역할
3D 컴포넌트(appendElement)에 이벤트 핸들러를 등록합니다.

**주요 기능**:
1. `instance.appendElement.eventListener` 객체 초기화
2. customEvents의 각 이벤트 타입에 대해 핸들러 생성
3. Raycasting에서 호출될 eventListener 설정

이 API는 **3D 객체가 클릭되었을 때 WEventBus로 이벤트를 발행**하는 역할을 합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- Three.js 객체는 DOM 이벤트 시스템을 사용할 수 없음
- Raycasting과 연동하여 3D 객체 클릭 감지 필요
- 2D 컴포넌트의 `bindEvents`와 동일한 패턴으로 일관성 유지

## 사용 예시
```javascript
// 3D Component - register
const { bind3DEvents } = WKit;

this.customEvents = getCustomEvents();
this.dataMapping = getDataMapping.call(this);
init.call(this);

function init() {
  bind3DEvents(this, this.customEvents);
}

function getCustomEvents() {
  return {
    click: '@myClickEvent',
    mousedown: '@mouseDownEvent'
  };
}
```

## 데이터 흐름
```
customEvents 스키마
  {
    click: '@myClickEvent',
    mousedown: '@mouseDownEvent'
  }
  ↓
instance.appendElement.eventListener = {} 초기화
  ↓
fx.map으로 각 이벤트 타입 순회
  ↓
  ├─ make3DHandler(instance) → 핸들러 함수 생성
  └─ instance.appendElement.eventListener['click'] = handler
  ↓
사용자가 3D 객체 클릭 (캔버스에서)
  ↓
initThreeRaycasting의 raycaster가 교차 검사
  ↓
해당 3D 객체(appendElement) 찾기
  ↓
appendElement.eventListener['click'](event) 호출
  ↓
make3DHandler에서 생성된 핸들러 실행
  ↓
WEventBus.emit('@myClickEvent', { event, targetInstance })
```

## 구현 분석

### 현재 코드
```javascript
// WKit.js:51-57
WKit.bind3DEvents = function (instance, customEvents) {
  instance.appendElement.eventListener = {};
  fx.map((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};

// WKit.js:312-321
function make3DHandler(targetInstance) {
  return function (event) {
    const { customEvents } = targetInstance;
    console.log('@eventHandler', customEvents[event.type]);
    WEventBus.emit(customEvents[event.type], {
      event,
      targetInstance,
    });
  };
}
```

### 잘된 점 ✅
1. **간결한 API**: 2D의 bindEvents와 유사한 인터페이스
2. **클로저 활용**: make3DHandler가 targetInstance를 기억
3. **WEventBus 통합**: 2D 이벤트와 동일한 방식으로 이벤트 발행

### 개선점 ⚠️

#### 1. eventListener 객체 덮어쓰기
**현재 코드**:
```javascript
instance.appendElement.eventListener = {};  // 기존 핸들러 전부 삭제
```

**문제점**:
- `bind3DEvents`를 여러 번 호출하면 이전 핸들러가 모두 사라짐
- 다른 곳에서 추가한 eventListener도 삭제됨

**개선안**:
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  // 기존 eventListener 유지하거나 초기화
  if (!instance.appendElement.eventListener) {
    instance.appendElement.eventListener = {};
  }

  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

#### 2. fx.map의 반환값 미사용
**현재 코드**:
```javascript
fx.map((browserEvent) => {  // ← 반환값 사용 안 함
  const eventHandler = make3DHandler(instance);
  instance.appendElement.eventListener[browserEvent] = eventHandler;
}, Object.keys(customEvents));
```

**문제점**:
- `fx.map`은 변환 함수인데 부수효과만 발생
- `fx.each` 사용이 더 적절

**개선안**:
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  if (!instance.appendElement.eventListener) {
    instance.appendElement.eventListener = {};
  }

  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

#### 3. instance.appendElement 존재 확인 없음
**문제점**:
- `instance.appendElement`가 없으면 에러
- 2D 컴포넌트에 잘못 호출할 수 있음

**개선안**:
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  if (!instance || !instance.appendElement) {
    throw new Error('instance.appendElement is required for 3D events');
  }

  if (!instance.appendElement.eventListener) {
    instance.appendElement.eventListener = {};
  }

  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

#### 4. customEvents 스키마 구조 차이
**현재 스키마**:
```javascript
// 3D
{
  click: '@myClickEvent',
  mousedown: '@mouseDownEvent'
}

// 2D (비교)
{
  click: {
    '.selector': '@myClickEvent'
  }
}
```

**문제점**:
- 3D는 셀렉터가 없어서 단순 문자열
- 2D와 스키마 구조가 달라 혼란 가능
- 3D에서는 하나의 이벤트 타입에 하나의 핸들러만 가능

**개선 고려사항**:
- 현재 구조가 3D의 특성상 합리적 (3D 객체는 하나의 appendElement)
- 일관성을 위해 문서화 강화 필요

#### 5. make3DHandler가 매번 새로운 함수 생성
**현재 코드**:
```javascript
fx.map((browserEvent) => {
  const eventHandler = make3DHandler(instance);  // 매번 새 함수
  instance.appendElement.eventListener[browserEvent] = eventHandler;
}, Object.keys(customEvents));
```

**문제점**:
- 같은 instance에 대해 매번 다른 핸들러 함수 생성
- 사실 모든 이벤트 타입에 대해 동일한 로직인데 함수만 다름

**개선안 1** (현재 방식 유지):
```javascript
// 현재 방식이 사실 문제는 아님 (각 이벤트 타입마다 독립적 핸들러)
```

**개선안 2** (하나의 핸들러 공유 - 권장하지 않음):
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  if (!instance.appendElement.eventListener) {
    instance.appendElement.eventListener = {};
  }

  const sharedHandler = make3DHandler(instance);

  fx.each((browserEvent) => {
    instance.appendElement.eventListener[browserEvent] = sharedHandler;
  }, Object.keys(customEvents));
};
```

#### 6. 이벤트 타입 검증 없음
**문제점**:
- customEvents에 이상한 값이 들어와도 체크 안 함
- null, undefined 등에 대한 방어 없음

**개선안**:
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  if (!instance || !instance.appendElement) {
    throw new Error('instance.appendElement is required for 3D events');
  }

  if (!customEvents || typeof customEvents !== 'object') {
    throw new Error('customEvents must be an object');
  }

  if (!instance.appendElement.eventListener) {
    instance.appendElement.eventListener = {};
  }

  fx.each((browserEvent) => {
    const eventName = customEvents[browserEvent];

    if (!eventName || typeof eventName !== 'string') {
      console.warn(`[WKit.bind3DEvents] Invalid event name for ${browserEvent}`);
      return;
    }

    if (!eventName.startsWith('@')) {
      console.warn(`[WKit.bind3DEvents] Event name should start with @: ${eventName}`);
    }

    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

#### 7. 정리(cleanup) 메소드 없음
**문제점**:
- 2D는 `removeCustomEvents`가 있는데 3D는 없음
- `dispose3DTree`에서 정리하긴 하지만 명시적 API가 없음

**개선안** (새 API 추가):
```javascript
WKit.remove3DEvents = function (instance) {
  if (!instance || !instance.appendElement) {
    return;
  }

  if (instance.appendElement.eventListener) {
    // 모든 핸들러 제거
    Object.keys(instance.appendElement.eventListener).forEach((eventType) => {
      delete instance.appendElement.eventListener[eventType];
    });

    // 또는 완전히 제거
    instance.appendElement.eventListener = undefined;
  }
};

// 사용
function onInstanceUnLoad() {
  WKit.remove3DEvents(this);
}
```

## 개선 우선순위
1. **High**: eventListener 덮어쓰기 방지
2. **Medium**: instance.appendElement 존재 확인
3. **Medium**: fx.map을 fx.each로 변경
4. **Low**: remove3DEvents API 추가
5. **Low**: 이벤트 타입 검증

## 관련 함수
- `make3DHandler()` - Internal (`WKit.js:312-321`)
- `WKit.initThreeRaycasting()` - Public API (`WKit.js:42-49`)
- `WKit.dispose3DTree()` - Public API (`WKit.js:60-98`)
- `makeRaycastingFn()` - Internal (`WKit.js:289-310`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스
const instance = {
  appendElement: new THREE.Group(),
  customEvents: {
    click: '@3dObjectClicked',
    mousedown: '@3dMouseDown'
  }
};

WKit.bind3DEvents(instance, instance.customEvents);

// 결과:
// instance.appendElement.eventListener = {
//   click: handlerFunction1,
//   mousedown: handlerFunction2
// }

// 2. 중복 호출 (현재 문제)
WKit.bind3DEvents(instance, { click: '@event1' });
WKit.bind3DEvents(instance, { mousedown: '@event2' });

// 현재: 두 번째 호출이 click 핸들러를 제거함
// instance.appendElement.eventListener = { mousedown: ... }

// 개선 후: 두 핸들러 모두 유지
// instance.appendElement.eventListener = { click: ..., mousedown: ... }

// 3. appendElement 없는 경우
const badInstance = { customEvents: { click: '@event' } };
WKit.bind3DEvents(badInstance, badInstance.customEvents);

// 현재: 에러 발생
// 개선 후: 명확한 에러 메시지

// 4. Raycasting과 통합
// Page에서
WKit.initThreeRaycasting(canvas, 'click', wemb.threeElements);

// 3D Component에서
WKit.bind3DEvents(this, { click: '@myEvent' });

// 사용자가 3D 객체 클릭
// → raycaster가 appendElement 찾기
// → appendElement.eventListener['click'](event) 호출
// → WEventBus.emit('@myEvent', {...})
```

## 실제 사용 흐름
```javascript
// 1. Page - loaded (Raycasting 초기화)
function initPageController() {
  this.raycastingEventType = 'click';
  this.raycastingEventHandler = WKit.initThreeRaycasting(
    this.element,
    this.raycastingEventType,
    wemb.threeElements
  );

  this.eventBusHandlers = {
    '@3dObjectClicked': async ({ event, targetInstance }) => {
      console.log('3D object clicked!', event.intersects);
      const data = await WKit.pipeForDataMapping(targetInstance);
      // 데이터 처리
    }
  };

  WKit.onEventBusHandlers(this.eventBusHandlers);
}

// 2. 3D Component - register
function init() {
  // Three.js 객체 생성
  this.appendElement = new THREE.Group();
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  );
  this.appendElement.add(cube);
  wemb.threeElements.scene.add(this.appendElement);

  // 이벤트 바인딩
  this.customEvents = {
    click: '@3dObjectClicked'
  };

  WKit.bind3DEvents(this, this.customEvents);
}

// 3. 사용자 인터랙션
// 캔버스 클릭
//   ↓
// initThreeRaycasting의 핸들러 실행
//   ↓
// raycaster.intersectObjects(scene.children, true)
//   ↓
// appendElement 찾기 (eventListener 가진 객체)
//   ↓
// appendElement.eventListener['click']({ ...event, intersects })
//   ↓
// make3DHandler 실행
//   ↓
// WEventBus.emit('@3dObjectClicked', { event, targetInstance })
//   ↓
// Page의 eventBusHandlers['@3dObjectClicked'] 실행

// 4. Cleanup
// Component - destroy는 dispose3DTree에서 자동 처리
// Page - before_unload
function onPageUnLoad() {
  // Raycasting 핸들러 제거
  this.element.removeEventListener(
    this.raycastingEventType,
    this.raycastingEventHandler
  );

  // 3D 객체 정리 (eventListener도 함께 정리됨)
  fx.go(
    WKit.makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
  );
}
```

## 2D bindEvents와의 비교
```javascript
// 2D bindEvents
WKit.bindEvents(instance, {
  click: {
    '.submit-btn': '@submitForm',    // 셀렉터 기반
    '.cancel-btn': '@cancelForm'     // 여러 셀렉터 가능
  }
});

// 3D bind3DEvents
WKit.bind3DEvents(instance, {
  click: '@3dObjectClicked',         // 직접 이벤트명
  mousedown: '@3dMouseDown'          // 3D 객체당 하나씩
});

// 차이점:
// - 2D: 셀렉터로 여러 DOM 요소 구분
// - 3D: appendElement 자체가 하나의 객체
// - 2D: delegate 패턴 사용
// - 3D: Raycasting으로 직접 찾기
```

## 디버깅 팁
```javascript
// 3D 이벤트가 안 잡힐 때 확인사항

// 1. appendElement에 eventListener가 등록되었는지
console.log(instance.appendElement.eventListener);
// { click: function() {...} }

// 2. Raycasting 초기화 확인
console.log(this.raycastingEventHandler);
// function(event) {...}

// 3. 3D 객체가 scene에 추가되었는지
console.log(wemb.threeElements.scene.children);

// 4. Raycasting이 객체를 찾는지
// makeRaycastingFn 내부에 로그 추가
console.log('intersects:', intersects);
console.log('found target:', target);

// 5. customEvents 스키마 확인
console.log(instance.customEvents);
// { click: '@3dObjectClicked' }
```
