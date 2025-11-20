# WKit 상세 명세

## 개요

통합 유틸리티 킷으로, 2D/3D 이벤트 바인딩, 리소스 관리, 데이터 fetch, 인스턴스 검색 등 다양한 기능을 제공하는 Facade 패턴 기반 모듈입니다.

## 아키텍처

### 네임스페이스 패턴

```javascript
const WKit = {};

// Public API 추가
WKit.bindEvents = function(...) { ... };
WKit.fetchData = function(...) { ... };
// ...
```

**목적**: 전역 스코프 오염 방지, 관련 기능을 하나의 네임스페이스로 그룹화

---

## 메서드 분류

### 1. 2D 이벤트 바인딩
- `bindEvents` - DOM 이벤트 바인딩
- `removeCustomEvents` - DOM 이벤트 제거

### 2. 3D 이벤트 바인딩
- `initThreeRaycasting` - Raycasting 초기화
- `bind3DEvents` - 3D 객체 이벤트 바인딩

### 3. 3D 리소스 관리
- `dispose3DTree` - 3D 객체 트리 메모리 해제
- `clearSceneBackground` - Scene 배경 정리

### 4. 헬퍼 유틸리티
- `makeIterator` - 컴포넌트 iterator 생성
- `getInstanceByName` - 이름으로 인스턴스 검색
- `getInstanceById` - ID로 인스턴스 검색
- `fetchData` - 데이터 fetch primitive
- `emitEvent` - 이벤트 발행 헬퍼

### 5. EventBus 래퍼
- `onEventBusHandlers` - 여러 핸들러 일괄 등록
- `offEventBusHandlers` - 여러 핸들러 일괄 해제

### 6. 스키마 유틸리티
- `getGlobalMappingSchema` - GlobalDataPublisher 매핑 스키마
- `getCustomEventsSchema` - 2D 이벤트 스키마
- `getCustomEventsSchemaFor3D` - 3D 이벤트 스키마
- `getSubscriptionSchema` - 구독 스키마

---

## 2D 이벤트 바인딩 메서드

### 1. bindEvents(instance, customEvents)

#### 시그니처
```javascript
bindEvents(
  instance: ComponentInstance,  // 컴포넌트 인스턴스
  customEvents: {
    [eventName: string]: {      // 'click', 'submit' 등
      [selector: string]: string // CSS selector → 커스텀 이벤트명
    }
  }
): void
```

#### 목적
컴포넌트 DOM 요소에 이벤트 위임 패턴으로 이벤트 바인딩

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:4-14):
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

**동작**:
1. `customEvents` 객체를 순회 (eventName별)
2. 각 eventName의 selector 목록 순회
3. selector별로 핸들러 생성 (`makeHandler`)
4. 이벤트 위임 패턴으로 바인딩 (`delegate`)

**단계별 분석**:

**1단계: customEvents 순회**
```javascript
fx.go(
  Object.entries(customEvents),
  // [['click', { '.btn': '@btnClick' }], ['submit', { 'form': '@submit' }]]
  fx.each(([eventName, selectorList]) => { ... })
)
```
- `Object.entries()`로 `[eventName, selectorList]` 쌍 추출
- `fx.each`로 각 이벤트 타입 처리

**2단계: selector 순회**
```javascript
fx.each((selector) => {
  const handler = makeHandler(instance, selector);
  delegate(instance, eventName, selector, handler);
}, Object.keys(selectorList));
```
- `Object.keys(selectorList)`로 selector 목록 추출
- 각 selector에 대해 핸들러 생성 및 위임

**3단계: makeHandler (내부 함수, WKit.js:203-216)**
```javascript
function makeHandler(targetInstance, selector) {
  return function (event) {
    event.preventDefault();  // 기본 동작 방지
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
```

**makeHandler의 역할**:
- 클로저로 `targetInstance`, `selector` 캡처
- 반환된 함수가 실제 이벤트 핸들러
- `event.preventDefault()` 자동 호출
- `customEvents`에서 커스텀 이벤트명 조회
- `WEventBus.emit()`으로 커스텀 이벤트 발행

**4단계: delegate (내부 함수, WKit.js:296-311)**
```javascript
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
```

**delegate의 역할**:
- **이벤트 위임 패턴 구현**: 부모 요소에 리스너 등록
- 이벤트 발생 시 `event.target`이 selector와 일치하는지 확인
- 일치하면 `handler` 실행
- `userHandlerList`에 핸들러 저장 (나중에 제거 시 사용)

**이벤트 위임 패턴이란?**
```javascript
// ❌ 각 버튼마다 리스너 등록 (비효율적)
buttons.forEach(btn => btn.addEventListener('click', handler));

// ✅ 부모에 하나만 등록, 버블링 활용 (효율적)
parent.addEventListener('click', (event) => {
  if (event.target.matches('.btn')) {
    handler(event);
  }
});
```

**전체 흐름 예시**:
```javascript
// Component - register
this.customEvents = {
  click: {
    '.btn-primary': '@btnPrimaryClick',
    '.btn-secondary': '@btnSecondaryClick'
  },
  submit: {
    'form': '@formSubmit'
  }
};

WKit.bindEvents(this, this.customEvents);

// 내부 동작:
// 1) customEvents 순회
//    - eventName: 'click'
//      - selector: '.btn-primary'
//        - makeHandler(instance, '.btn-primary') → handler1
//        - delegate(instance, 'click', '.btn-primary', handler1)
//      - selector: '.btn-secondary'
//        - makeHandler(instance, '.btn-secondary') → handler2
//        - delegate(instance, 'click', '.btn-secondary', handler2)
//    - eventName: 'submit'
//      - selector: 'form'
//        - makeHandler(instance, 'form') → handler3
//        - delegate(instance, 'submit', 'form', handler3)
//
// 2) delegate 내부 (각 selector별):
//    - emitEvent 함수 생성
//    - instance.element.addEventListener(eventName, emitEvent)
//    - userHandlerList에 저장
//
// 3) 사용자가 .btn-primary 클릭 시:
//    - 'click' 이벤트 발생
//    - emitEvent 실행
//      - qsAll('.btn-primary', instance.element) → [btnElement]
//      - event.target === btnElement ? → true
//      - handler1.call(btnElement, event)
//        - event.preventDefault()
//        - WEventBus.emit('@btnPrimaryClick', { event, targetInstance })
```

**왜 이벤트 위임인가?**
- **동적 요소 지원**: 나중에 추가된 DOM 요소에도 자동 적용
- **메모리 효율**: 부모에 리스너 하나만 등록
- **성능**: 많은 자식 요소에 개별 리스너보다 효율적

---

### 2. removeCustomEvents(instance, customEvents)

#### 시그니처
```javascript
removeCustomEvents(
  instance: ComponentInstance,
  customEvents: Object  // bindEvents와 동일한 구조
): void
```

#### 목적
컴포넌트 destroy 시 등록된 이벤트 리스너 제거 (메모리 누수 방지)

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:16-28):
```javascript
WKit.removeCustomEvents = function (instance, customEvents) {
  fx.go(
    Object.entries(customEvents),
    fx.each(([eventName, selectorList]) => {
      fx.each((selector) => {
        const handler = instance.userHandlerList?.[eventName]?.[selector];
        if (handler) {
          instance.element.removeEventListener(eventName, handler);
        }
      }, Object.keys(selectorList));
    })
  );
};
```

**동작**:
1. `customEvents` 구조 순회
2. `userHandlerList`에서 저장된 핸들러 조회
3. `removeEventListener`로 제거

**단계별 분석**:

**1단계: 핸들러 조회**
```javascript
const handler = instance.userHandlerList?.[eventName]?.[selector];
```
- `bindEvents`에서 저장한 핸들러 참조 가져오기
- Optional chaining으로 안전한 접근

**2단계: 리스너 제거**
```javascript
if (handler) {
  instance.element.removeEventListener(eventName, handler);
}
```
- 핸들러가 존재하면 `removeEventListener` 호출
- 동일한 참조를 제거해야 정상 작동 (중요!)

**왜 userHandlerList가 필요한가?**
```javascript
// ❌ 새 함수를 만들어서 제거 시도 (실패)
instance.element.removeEventListener('click', function() { ... });
// 다른 참조이므로 제거 안됨!

// ✅ 등록 시 저장한 참조로 제거 (성공)
const handler = savedHandlerReference;
instance.element.removeEventListener('click', handler);
```

**예시**:
```javascript
// Component - destroy
onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
  WKit.removeCustomEvents(this, this.customEvents);
}

// 내부 동작:
// 1) customEvents 순회
//    - eventName: 'click', selector: '.btn-primary'
//      - handler = this.userHandlerList['click']['.btn-primary']
//      - this.element.removeEventListener('click', handler)
//
// 2) 메모리에서 리스너 제거됨
// 3) 이벤트 발생해도 핸들러 실행 안됨
```

---

## 3D 이벤트 바인딩 메서드

### 3. initThreeRaycasting(target, eventName)

#### 시그니처
```javascript
initThreeRaycasting(
  target: HTMLElement,  // 이벤트를 감지할 DOM 요소 (보통 canvas)
  eventName: string     // 브라우저 이벤트 ('click', 'mousemove' 등)
): Function             // raycasting 핸들러 (나중에 제거 시 사용)
```

#### 목적
Three.js Raycasting을 초기화하여 3D 객체 클릭 이벤트 감지

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:32-39):
```javascript
WKit.initThreeRaycasting = function (target, eventName) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const { scene, camera } = wemb.threeElements;
  const onRaycasting = makeRaycastingFn(target, raycaster, mouse, scene, camera);
  target.addEventListener(eventName, onRaycasting);
  return onRaycasting;
};
```

**동작**:
1. Three.js Raycaster와 마우스 좌표 객체 생성
2. 전역 `wemb.threeElements`에서 scene, camera 가져오기
3. Raycasting 함수 생성 (`makeRaycastingFn`)
4. target에 이벤트 리스너 등록
5. 핸들러 참조 리턴 (나중에 제거 시 사용)

**단계별 분석**:

**1단계: Raycaster 초기화**
```javascript
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
```
- `Raycaster`: 광선을 쏴서 3D 객체와의 교차점 계산
- `Vector2`: 정규화된 마우스 좌표 (-1 ~ 1 범위)

**2단계: Scene, Camera 가져오기**
```javascript
const { scene, camera } = wemb.threeElements;
```
- **wemb.threeElements**: 전역 Three.js 요소 저장소
- **단일 Scene 아키텍처**: 모든 3D 컴포넌트가 하나의 scene 공유

**3단계: makeRaycastingFn (내부 함수, WKit.js:220-241)**
```javascript
function makeRaycastingFn(rootElement, raycaster, mouse, scene, camera) {
  return function (event) {
    // 1. 마우스 좌표를 정규화된 좌표로 변환
    mouse.x = (event.offsetX / rootElement.clientWidth) * 2 - 1;
    mouse.y = -(event.offsetY / rootElement.clientHeight) * 2 + 1;

    // 2. Raycaster 설정
    raycaster.setFromCamera(mouse, camera);

    // 3. Scene의 모든 객체와 교차 검사
    const intersects = raycaster.intersectObjects(scene.children, true);

    // 4. 교차된 객체 처리
    fx.go(
      intersects,
      fx.L.map((inter) => inter.object),           // 교차 객체 추출
      fx.L.map((obj) => {
        // eventListener가 있는 부모 찾기 (컴포넌트 루트)
        let current = obj;
        while (current && !current.eventListener) {
          current = current.parent;
        }
        return current;
      }),
      fx.L.filter(Boolean),                        // null 제거
      fx.take(1),                                  // 첫 번째만 (가장 가까운)
      ([target]) => target?.eventListener?.[event.type]?.(Object.assign(event, { intersects }))
    );
  };
}
```

**makeRaycastingFn의 역할**:

**1) 마우스 좌표 정규화**:
```javascript
// 브라우저 좌표 (0 ~ width/height) → NDC (-1 ~ 1)
mouse.x = (event.offsetX / rootElement.clientWidth) * 2 - 1;
mouse.y = -(event.offsetY / rootElement.clientHeight) * 2 + 1;  // Y 반전
```

**2) Raycasting 실행**:
```javascript
raycaster.setFromCamera(mouse, camera);
const intersects = raycaster.intersectObjects(scene.children, true);
// intersects = [
//   { distance, point, object, face, ... },  // 가장 가까운
//   { distance, point, object, face, ... },  // 두 번째
//   ...
// ]
```

**3) eventListener가 있는 부모 찾기**:
```javascript
// 클릭된 객체는 깊은 자식일 수 있음
// → 상위로 올라가며 eventListener 속성이 있는 객체 찾기
let current = obj;
while (current && !current.eventListener) {
  current = current.parent;
}
return current;  // 컴포넌트 루트 (appendElement)
```

**4) 가장 가까운 객체의 핸들러 실행**:
```javascript
fx.take(1),  // 첫 번째만 (가장 가까운 객체)
([target]) => target?.eventListener?.[event.type]?.(
  Object.assign(event, { intersects })  // 원본 event에 intersects 추가
)
```

**전체 흐름 예시**:
```javascript
// Page - before_load
this.raycastingEventHandler = WKit.initThreeRaycasting(
  this.element,  // canvas
  'click'
);

// 내부 동작:
// 1) raycaster, mouse 생성
// 2) onRaycasting 함수 생성
// 3) this.element.addEventListener('click', onRaycasting)
// 4) return onRaycasting

// 사용자가 3D 객체 클릭 시:
// 1) 'click' 이벤트 발생
// 2) onRaycasting 실행
//    - 마우스 좌표 정규화
//    - raycaster.intersectObjects(scene.children, true)
//    - intersects = [{ object: mesh1, ... }, { object: mesh2, ... }]
//    - mesh1의 부모 탐색 → appendElement (eventListener 있음)
//    - appendElement.eventListener['click'](event)
//      - make3DHandler 실행
//      - WEventBus.emit('@3dObjectClicked', { event, targetInstance })
```

**왜 부모를 찾는가?**
- 3D 모델은 여러 Mesh의 계층 구조
- 각 Mesh에 eventListener를 붙이는 것은 비효율적
- 컴포넌트 루트(appendElement)에만 eventListener 설정
- 자식 Mesh 클릭 시 부모로 전파

---

### 4. bind3DEvents(instance, customEvents)

#### 시그니처
```javascript
bind3DEvents(
  instance: ComponentInstance,
  customEvents: {
    [eventName: string]: string  // 'click' → '@3dObjectClicked'
  }
): void
```

#### 목적
3D 컴포넌트의 appendElement에 이벤트 핸들러 등록

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:41-47):
```javascript
WKit.bind3DEvents = function (instance, customEvents) {
  instance.appendElement.eventListener = {};
  fx.each((browserEvent) => {
    const eventHandler = make3DHandler(instance);
    instance.appendElement.eventListener[browserEvent] = eventHandler;
  }, Object.keys(customEvents));
};
```

**동작**:
1. `appendElement.eventListener` 객체 초기화
2. `customEvents`의 각 브라우저 이벤트별로 핸들러 생성
3. `eventListener` 객체에 핸들러 저장

**단계별 분석**:

**1단계: eventListener 초기화**
```javascript
instance.appendElement.eventListener = {};
```
- Three.js 객체에 커스텀 속성 추가
- Raycasting에서 이 속성으로 컴포넌트 식별

**2단계: 핸들러 생성 및 등록**
```javascript
fx.each((browserEvent) => {
  const eventHandler = make3DHandler(instance);
  instance.appendElement.eventListener[browserEvent] = eventHandler;
}, Object.keys(customEvents));
```
- `Object.keys(customEvents)` = ['click', 'mousemove', ...]
- 각 이벤트별로 `make3DHandler` 생성
- `eventListener` 객체에 저장

**3단계: make3DHandler (내부 함수, WKit.js:243-252)**
```javascript
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

**make3DHandler의 역할**:
- 클로저로 `targetInstance` 캡처
- `customEvents`에서 커스텀 이벤트명 조회
- `WEventBus.emit()`으로 이벤트 발행

**전체 흐름 예시**:
```javascript
// 3D Component - register
this.customEvents = {
  click: '@3dBoxClicked'
};

WKit.bind3DEvents(this, this.customEvents);

// 내부 동작:
// 1) this.appendElement.eventListener = {}
// 2) Object.keys(customEvents) = ['click']
// 3) browserEvent = 'click'
//    - eventHandler = make3DHandler(this)
//    - this.appendElement.eventListener['click'] = eventHandler
//
// this.appendElement.eventListener = {
//   click: function(event) {
//     WEventBus.emit('@3dBoxClicked', { event, targetInstance: this });
//   }
// }

// Raycasting에서 호출 시:
// target.eventListener['click'](event)
// → make3DHandler 실행
// → WEventBus.emit('@3dBoxClicked', { event, targetInstance })
```

**2D vs 3D 이벤트 바인딩 차이**:
```javascript
// 2D: DOM 이벤트 위임
WKit.bindEvents(instance, {
  click: {
    '.btn': '@btnClick'  // selector 기반
  }
});
// → instance.element.addEventListener('click', delegateHandler)

// 3D: appendElement 속성
WKit.bind3DEvents(instance, {
  click: '@3dClick'  // selector 없음
});
// → instance.appendElement.eventListener = { click: handler }
```

---

## 3D 리소스 관리 메서드

### 5. dispose3DTree(rootContainer)

#### 시그니처
```javascript
dispose3DTree(
  rootContainer: THREE.Object3D  // 메모리 해제할 3D 객체 루트
): void
```

#### 목적
3D 객체 트리를 순회하며 Geometry, Material, Texture 등 모든 리소스를 메모리에서 해제

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:50-88):
```javascript
WKit.dispose3DTree = function (rootContainer) {
  rootContainer.traverse((obj) => {
    // 1. geometry
    if (obj.geometry) {
      obj.geometry.dispose?.();
    }

    // 2. material(s)
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => {
          disposeMaterial(mat);
        });
      } else {
        disposeMaterial(obj.material);
      }
    }

    // 3. textures (in material, handled inside disposeMaterial)

    // 4. eventListener (custom-defined on your side)
    if (obj.eventListener) {
      Object.keys(obj.eventListener).forEach((eventType) => {
        obj.eventListener[eventType] = undefined;
      });
      obj.eventListener = undefined;
    }

    // 5. 기타 사용자 정의 데이터
    if (obj.userData) {
      obj.userData = {};
    }
  });

  // 부모로부터 detach
  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};
```

**동작**:
1. `traverse()`로 모든 자식 객체 순회
2. 각 객체의 리소스 해제:
   - Geometry
   - Material (배열 지원)
   - Texture (Material 내부)
   - eventListener (커스텀 속성)
   - userData (사용자 정의 데이터)
3. 부모에서 detach

**단계별 분석**:

**1단계: Geometry 해제**
```javascript
if (obj.geometry) {
  obj.geometry.dispose?.();  // Optional chaining으로 안전 호출
}
```
- `dispose()` 호출 시 GPU 메모리에서 버퍼 해제
- BufferGeometry의 attribute 데이터 정리

**2단계: Material 해제 (단일 또는 배열)**
```javascript
if (obj.material) {
  if (Array.isArray(obj.material)) {
    obj.material.forEach((mat) => {
      disposeMaterial(mat);
    });
  } else {
    disposeMaterial(obj.material);
  }
}
```
- Multi-material Mesh 지원 (배열 처리)
- `disposeMaterial` 내부 함수로 위임

**3단계: disposeMaterial (내부 함수, WKit.js:254-281)**
```javascript
function disposeMaterial(material) {
  // dispose texture in known slots
  const slots = [
    'map', 'lightMap', 'aoMap', 'emissiveMap', 'bumpMap',
    'normalMap', 'displacementMap', 'roughnessMap', 'metalnessMap',
    'alphaMap', 'envMap', 'specularMap', 'gradientMap',
  ];

  slots.forEach((key) => {
    const tex = material[key];
    if (tex && tex.dispose) {
      tex.dispose();       // Texture GPU 메모리 해제
      material[key] = null;  // 참조 제거
    }
  });

  material.dispose?.();  // Material 자체 해제
}
```

**disposeMaterial의 역할**:
- Material의 모든 Texture 슬롯 검사
- 각 Texture의 `dispose()` 호출
- Material 자체도 `dispose()`
- 참조를 `null`로 설정하여 GC 가능하게 함

**4단계: eventListener 정리**
```javascript
if (obj.eventListener) {
  Object.keys(obj.eventListener).forEach((eventType) => {
    obj.eventListener[eventType] = undefined;
  });
  obj.eventListener = undefined;
}
```
- `bind3DEvents`에서 추가한 커스텀 속성 제거
- 클로저로 인한 메모리 누수 방지

**5단계: userData 정리**
```javascript
if (obj.userData) {
  obj.userData = {};  // 빈 객체로 초기화
}
```
- 사용자가 저장한 커스텀 데이터 정리

**6단계: 부모에서 분리**
```javascript
if (rootContainer.parent) {
  rootContainer.parent.remove(rootContainer);
}
```
- Scene 또는 부모 객체에서 제거
- Scene 그래프에서 완전히 분리

**전체 흐름 예시**:
```javascript
// 3D 컴포넌트 생성
const group = new THREE.Group();
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),  // geometry
  new THREE.MeshStandardMaterial({  // material
    map: texture1,                  // texture
    normalMap: texture2
  })
);
group.add(mesh);
group.eventListener = { click: handler };
scene.add(group);

// Component destroy
WKit.dispose3DTree(group);

// 내부 동작:
// 1) group.traverse(obj => ...)
//    - obj = group
//      - eventListener.click = undefined
//      - eventListener = undefined
//      - userData = {}
//    - obj = mesh
//      - mesh.geometry.dispose()  // BoxGeometry 해제
//      - disposeMaterial(mesh.material)
//        - texture1.dispose()
//        - material.map = null
//        - texture2.dispose()
//        - material.normalMap = null
//        - material.dispose()
//
// 2) scene.remove(group)
//
// 3) GPU 메모리 해제, JS 참조 제거 → GC 대상
```

**왜 traverse()를 사용하는가?**
- 3D 모델은 계층 구조 (Group → Mesh → Children)
- 모든 자식을 재귀적으로 순회하여 리소스 해제
- 하나라도 놓치면 메모리 누수 발생

---

### 6. clearSceneBackground(scene)

#### 시그니처
```javascript
clearSceneBackground(
  scene: THREE.Scene  // 배경을 정리할 Scene
): void
```

#### 목적
Scene의 배경 이미지/텍스처를 메모리에서 해제

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:90-98):
```javascript
WKit.clearSceneBackground = function (scene) {
  const bg = scene.background;

  if (bg && bg.dispose) {
    bg.dispose(); // Texture나 CubeTexture일 경우만 dispose 존재
  }

  scene.background = null;
};
```

**동작**:
1. `scene.background` 가져오기
2. `dispose()` 메서드가 있으면 호출
3. `scene.background`를 `null`로 설정

**배경 타입별 처리**:
```javascript
// Texture (이미지 배경)
scene.background = new THREE.TextureLoader().load('bg.jpg');
// → bg.dispose() 호출됨

// CubeTexture (스카이박스)
scene.background = new THREE.CubeTextureLoader().load([...]);
// → bg.dispose() 호출됨

// Color (단색 배경)
scene.background = new THREE.Color(0x000000);
// → dispose() 없음, 그냥 null 설정

// null (배경 없음)
scene.background = null;
// → dispose() 시도하지 않음
```

**예시**:
```javascript
// Page - before_unload
function clearThreeInstances() {
  const { scene } = wemb.threeElements;

  // 모든 3D 컴포넌트 dispose
  fx.go(
    WKit.makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
  );

  // Scene 배경 정리
  WKit.clearSceneBackground(scene);
}
```

---

## 헬퍼 유틸리티 메서드

### 7. makeIterator(page, ...layerList)

#### 시그니처
```javascript
makeIterator(
  page: PageInstance,
  ...layerList: string[]  // 'masterLayer', 'twoLayer', 'threeLayer'
): Generator<ComponentInstance>
```

#### 목적
페이지의 여러 레이어에 있는 컴포넌트 인스턴스를 순회하는 iterator 생성

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:101-114):
```javascript
WKit.makeIterator = function (page, ...layerList) {
  layerList = layerList.length ? layerList : ['masterLayer', 'twoLayer', 'threeLayer'];
  const mapName = {
    masterLayer: 'componentInstanceListMap',
    twoLayer: 'componentInstanceListMap',
    threeLayer: '_appendElementListMap',
  };
  return combineIterators(
    fx.go(
      layerList,
      fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values())
    )
  );
};
```

**동작**:
1. `layerList` 기본값 설정 (모든 레이어)
2. 각 레이어의 Map 이름 매핑
3. 각 레이어의 `.values()` iterator 추출
4. `combineIterators`로 통합

**단계별 분석**:

**1단계: 기본값 설정**
```javascript
layerList = layerList.length ? layerList : ['masterLayer', 'twoLayer', 'threeLayer'];
```
- 인자 없으면 모든 레이어 포함
- 특정 레이어만 원하면 명시 가능

**2단계: Map 이름 매핑**
```javascript
const mapName = {
  masterLayer: 'componentInstanceListMap',
  twoLayer: 'componentInstanceListMap',
  threeLayer: '_appendElementListMap',  // 3D는 다른 Map
};
```
- 2D 레이어: `componentInstanceListMap`
- 3D 레이어: `_appendElementListMap`

**3단계: values() iterator 추출**
```javascript
fx.go(
  layerList,
  fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values())
)
// => [iterator1, iterator2, iterator3]
```
- 각 레이어의 Map에서 `.values()` 호출
- Iterator 객체 배열 생성

**4단계: combineIterators (내부 함수, WKit.js:284-288)**
```javascript
function* combineIterators(iterables) {
  for (const iterable of iterables) {
    yield* iterable;  // 각 iterator의 값을 순차적으로 yield
  }
}
```

**combineIterators의 역할**:
- 여러 iterator를 하나로 통합
- Generator 함수 (`function*`)
- `yield*`로 각 iterator의 모든 값을 위임

**전체 흐름 예시**:
```javascript
// 모든 레이어의 컴포넌트 순회
const iter = WKit.makeIterator(wemb.mainPageComponent);

for (const instance of iter) {
  console.log(instance.name);
}

// 내부 동작:
// 1) layerList = ['masterLayer', 'twoLayer', 'threeLayer']
// 2) masterLayer.componentInstanceListMap.values() → iter1
//    twoLayer.componentInstanceListMap.values() → iter2
//    threeLayer._appendElementListMap.values() → iter3
// 3) combineIterators([iter1, iter2, iter3])
// 4) yield* iter1 → comp1, comp2, comp3
//    yield* iter2 → comp4, comp5
//    yield* iter3 → appendElement1, appendElement2

// 특정 레이어만 순회
const iter2D = WKit.makeIterator(wemb.mainPageComponent, 'twoLayer');
// → twoLayer의 컴포넌트만
```

**사용 패턴**:
```javascript
// 패턴 1: 특정 컴포넌트 찾기
const iter = WKit.makeIterator(page);
const target = WKit.getInstanceByName('MyComponent', iter);

// 패턴 2: 모든 컴포넌트 작업
fx.go(
  WKit.makeIterator(page),
  fx.map(instance => instance.name),
  fx.each(console.log)
);

// 패턴 3: 3D만 정리
fx.go(
  WKit.makeIterator(page, 'threeLayer'),
  fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
);
```

---

### 8. getInstanceByName(instanceName, iter)

#### 시그니처
```javascript
getInstanceByName(
  instanceName: string,
  iter: Iterable<ComponentInstance>
): ComponentInstance | undefined
```

#### 목적
컴포넌트 이름으로 인스턴스 검색

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:116-118):
```javascript
WKit.getInstanceByName = function (instanceName, iter) {
  return fx.find((ins) => ins.name === instanceName, iter);
};
```

**동작**:
- `fx.find()`로 `name` 속성이 일치하는 첫 번째 인스턴스 반환
- 없으면 `undefined`

**예시**:
```javascript
const iter = WKit.makeIterator(wemb.mainPageComponent);
const userTable = WKit.getInstanceByName('UserTableComponent', iter);

if (userTable) {
  console.log(userTable.element);
}
```

---

### 9. getInstanceById(targetId, iter)

#### 시그니처
```javascript
getInstanceById(
  targetId: string,
  iter: Iterable<ComponentInstance>
): ComponentInstance | undefined
```

#### 목적
컴포넌트 ID로 인스턴스 검색

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:120-122):
```javascript
WKit.getInstanceById = function (targetId, iter) {
  return fx.find((ins) => ins.id === targetId, iter);
};
```

**동작**:
- `fx.find()`로 `id` 속성이 일치하는 첫 번째 인스턴스 반환
- 없으면 `undefined`

**name vs id**:
- **name**: 사용자 정의 이름 (중복 가능)
- **id**: 고유 식별자 (중복 불가)

**예시**:
```javascript
const iter = WKit.makeIterator(wemb.mainPageComponent);
const comp = WKit.getInstanceById('comp-12345', iter);

if (comp) {
  WKit.emitEvent('@triggerUpdate', comp);
}
```

---

### 10. fetchData(page, datasetName, param)

#### 시그니처
```javascript
fetchData(
  page: PageInstance,
  datasetName: string,
  param: Object
): Promise<any>
```

#### 목적
데이터셋에서 데이터를 fetch하는 primitive

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:124-131):
```javascript
WKit.fetchData = function (page, datasetName, param) {
  return new Promise((res, rej) => {
    page.dataService
      .call(datasetName, { param })
      .on('success', (data) => res(data))
      .on('error', (err) => rej(err));
  });
};
```

**동작**:
1. `page.dataService.call()`로 데이터셋 호출
2. 'success' 이벤트 시 Promise resolve
3. 'error' 이벤트 시 Promise reject

**dataService.call() 체이닝 패턴**:
```javascript
page.dataService
  .call(datasetName, { param })  // 데이터셋 호출
  .on('success', callback)        // 성공 핸들러 등록
  .on('error', callback)          // 에러 핸들러 등록
```

**예시**:
```javascript
// Page - before_load
this.eventBusHandlers = {
  '@buttonClicked': async ({ targetInstance }) => {
    const { datasetInfo } = targetInstance;
    if (datasetInfo) {
      const { datasetName, param } = datasetInfo;

      try {
        const data = await WKit.fetchData(this, datasetName, param);
        console.log('Fetched data:', data);
      } catch (error) {
        console.error('Fetch failed:', error);
      }
    }
  }
};
```

---

### 11. emitEvent(eventName, targetInstance)

#### 시그니처
```javascript
emitEvent(
  eventName: string,
  targetInstance: ComponentInstance
): void
```

#### 목적
WEventBus를 통해 이벤트 발행 (코드로 직접 트리거)

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:133-138):
```javascript
WKit.emitEvent = function (eventName, targetInstance) {
  console.log('[WKit:EmitByCode]', eventName, targetInstance);
  WEventBus.emit(eventName, {
    targetInstance,
  });
};
```

**동작**:
1. 디버깅 로그 출력
2. `WEventBus.emit()` 호출

**예시**:
```javascript
// 특정 컴포넌트에 이벤트 트리거
const iter = WKit.makeIterator(wemb.mainPageComponent);
const target = WKit.getInstanceByName('MyComponent', iter);

if (target) {
  WKit.emitEvent('@refresh', target);
}

// 페이지 이벤트 핸들러에서 처리
this.eventBusHandlers = {
  '@refresh': ({ targetInstance }) => {
    console.log('Refreshing:', targetInstance.name);
  }
};
```

---

## EventBus 래퍼 메서드

### 12. onEventBusHandlers(eventBusHandlers)

#### 시그니처
```javascript
onEventBusHandlers(
  eventBusHandlers: {
    [eventName: string]: Function
  }
): void
```

#### 목적
여러 이벤트 핸들러를 일괄 등록

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:141-146):
```javascript
WKit.onEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => WEventBus.on(eventName, handler))
  );
};
```

**동작**:
- `Object.entries()`로 [eventName, handler] 쌍 추출
- 각 쌍을 `WEventBus.on()`으로 등록

**예시**:
```javascript
// Page - before_load
this.eventBusHandlers = {
  '@buttonClicked': async ({ event, targetInstance }) => { ... },
  '@userSelected': async ({ userId }) => { ... },
  '@dataUpdated': async ({ data }) => { ... }
};

WKit.onEventBusHandlers(this.eventBusHandlers);

// 내부 동작:
// WEventBus.on('@buttonClicked', handler1);
// WEventBus.on('@userSelected', handler2);
// WEventBus.on('@dataUpdated', handler3);
```

---

### 13. offEventBusHandlers(eventBusHandlers)

#### 시그니처
```javascript
offEventBusHandlers(
  eventBusHandlers: {
    [eventName: string]: Function
  }
): void
```

#### 목적
여러 이벤트 핸들러를 일괄 해제

---

#### 동작 흐름 (소스 레벨)

**코드** (WKit.js:148-153):
```javascript
WKit.offEventBusHandlers = function (eventBusHandlers) {
  fx.go(
    Object.entries(eventBusHandlers),
    fx.each(([eventName, handler]) => WEventBus.off(eventName, handler))
  );
};
```

**동작**:
- `Object.entries()`로 [eventName, handler] 쌍 추출
- 각 쌍을 `WEventBus.off()`로 해제

**예시**:
```javascript
// Page - before_unload
function clearEventBus() {
  WKit.offEventBusHandlers.call(this, this.eventBusHandlers);
  this.eventBusHandlers = null;
}
```

---

## 스키마 유틸리티 메서드

### 14. getGlobalMappingSchema()

#### 시그니처
```javascript
getGlobalMappingSchema(): Array<GlobalMapping>
```

#### 목적
GlobalDataPublisher 매핑 배열 스키마 예제 제공

---

#### 코드 (WKit.js:156-173)

```javascript
WKit.getGlobalMappingSchema = function () {
  return [
    {
      topic: 'users',
      datasetInfo: {
        datasetName: 'dummyjson',
        param: { dataType: 'users', id: 'default' },
      },
    },
    {
      topic: 'comments',
      datasetInfo: {
        datasetName: 'dummyjson',
        param: { dataType: 'comments', id: 'default' },
      },
    },
  ];
};
```

**용도**: 코드 생성 시 템플릿

---

### 15. getCustomEventsSchema()

#### 시그니처
```javascript
getCustomEventsSchema(): CustomEvents
```

#### 목적
2D 컴포넌트 customEvents 스키마 예제 제공

---

#### 코드 (WKit.js:175-186)

```javascript
WKit.getCustomEventsSchema = function () {
  return {
    click: {
      '.navbar-brand': '@triggerNavbarTitle',
      '.nav-link': '@triggerNavLink',
      '.dropdown-item': '@triggerDropDownItem',
    },
    submit: {
      form: '@submitForm',
    },
  };
};
```

**용도**: 코드 생성 시 템플릿

---

### 16. getCustomEventsSchemaFor3D()

#### 시그니처
```javascript
getCustomEventsSchemaFor3D(): Object
```

#### 목적
3D 컴포넌트 customEvents 스키마 예제 제공

---

#### 코드 (WKit.js:188-192)

```javascript
WKit.getCustomEventsSchemaFor3D = function () {
  return {
    click: '@triggerClick',
  };
};
```

**용도**: 코드 생성 시 템플릿

---

### 17. getSubscriptionSchema()

#### 시그니처
```javascript
getSubscriptionSchema(): Subscriptions
```

#### 목적
컴포넌트 subscriptions 스키마 예제 제공

---

#### 코드 (WKit.js:194-199)

```javascript
WKit.getSubscriptionSchema = function () {
  return {
    users: ['method1', 'method2'],
    comments: ['method3', 'method4'],
  };
};
```

**용도**: 코드 생성 시 템플릿

---

## 내부 유틸리티 함수

### qsAll(selector, scope)

**목적**: `querySelectorAll`의 래퍼 (Array 반환)

**코드** (WKit.js:290-294):
```javascript
function qsAll(selector, scope = document) {
  if (!selector) throw 'no selector';
  return Array.from(scope.querySelectorAll(selector));
}
```

**특징**:
- NodeList → Array 변환
- `scope` 지정 가능 (특정 요소 내부 검색)

---

## 설계 철학

### Facade 패턴

WKit은 여러 하위 시스템을 단일 인터페이스로 통합:
- WEventBus
- GlobalDataPublisher
- Three.js
- DOM API
- dataService

**장점**:
- 사용자는 WKit만 알면 됨
- 하위 시스템 변경 시 WKit만 수정
- 일관된 API 제공

### Primitive Building Blocks

WKit은 primitive만 제공하고 조합은 사용자에게 맡김:
- `fetchData` - 데이터 fetch만
- `getInstanceByName` - 검색만
- `makeIterator` - iterator 생성만

### 메모리 안전성

모든 리소스 정리 메서드 제공:
- `removeCustomEvents` - 2D 이벤트
- `dispose3DTree` - 3D 리소스
- `clearSceneBackground` - Scene 배경
- `offEventBusHandlers` - EventBus 핸들러

---

## 버전 정보

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-20
**관련 파일**: `Utils/WKit.js:1-312`
