# WKit.initThreeRaycasting

## 위치
`WKit.js:42-49`

## 시그니처
```javascript
WKit.initThreeRaycasting(target: HTMLElement, eventName: string): Function
```

## 역할
Three.js Raycasting 기반 3D 객체 클릭 감지 시스템을 초기화합니다.

**주요 기능**:
1. Raycaster와 마우스 좌표를 위한 Vector2 생성
2. 마우스 이벤트를 3D 공간 좌표로 변환
3. Scene의 3D 객체들과 광선 교차 검사
4. 클릭된 3D 객체의 eventListener 호출

이 API는 **2D DOM 이벤트를 3D 공간의 객체 인터랙션으로 변환**하는 역할을 합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- Three.js는 기본적으로 DOM 이벤트를 지원하지 않음
- 3D 객체 클릭 감지를 위해 Raycasting 필수
- 사용자가 3D 씬에서 객체를 클릭할 수 있어야 함

## 사용 예시
```javascript
// Page - loaded
const { initThreeRaycasting } = WKit;

initPageController.call(this);

function initPageController() {
  this.raycastingEventType = 'click';
  this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);

  this.eventBusHandlers = {
    '@3dObjectClicked': ({ event, targetInstance }) => {
      console.log('Clicked 3D object:', event.intersects);
    }
  };

  WKit.onEventBusHandlers(this.eventBusHandlers);
}

// Page - before_unload
function onPageUnLoad() {
  this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
  this.raycastingEventHandler = null;
}
```

## 데이터 흐름
```
사용자가 캔버스 클릭
  ↓
target.addEventListener('click', onRaycasting) 실행
  ↓
makeRaycastingFn에서 생성된 핸들러 실행
  ↓
1. 마우스 좌표를 NDC(Normalized Device Coordinates)로 변환
   mouse.x = (event.offsetX / width) * 2 - 1  // -1 ~ 1
   mouse.y = -(event.offsetY / height) * 2 + 1
  ↓
2. Raycaster.setFromCamera(mouse, camera) - 광선 생성
  ↓
3. raycaster.intersectObjects(scene.children, true) - 교차 검사
  ↓
4. intersects 배열에서 object 추출
  ↓
5. 각 object에서 상위로 올라가며 eventListener 가진 객체 찾기
  ↓
6. 첫 번째로 찾은 객체의 eventListener[eventType] 호출
  ↓
3D 객체의 커스텀 이벤트 핸들러 실행
```

## 구현 분석

### 현재 코드
```javascript
// WKit.js:42-49
WKit.initThreeRaycasting = function (target, eventName) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const { scene, camera } = wemb.threeElements;
  const onRaycasting = makeRaycastingFn(target, raycaster, mouse, scene, camera);
  target.addEventListener(eventName, onRaycasting);
  return onRaycasting;
};

// WKit.js:289-310
function makeRaycastingFn(rootElement, raycaster, mouse, scene, camera) {
  return function (event) {
    mouse.x = (event.offsetX / rootElement.clientWidth) * 2 - 1;
    mouse.y = -(event.offsetY / rootElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    fx.go(
      intersects,
      fx.L.map((inter) => inter.object),
      fx.L.map((obj) => {
        let current = obj;
        while (current && !current.eventListener) {
          current = current.parent;
        }
        return current;
      }),
      fx.L.filter(Boolean),
      fx.take(1),
      ([target]) => target?.eventListener?.[event.type]?.(Object.assign(event, { intersects }))
    );
  };
}
```

### 잘된 점 ✅
1. **핸들러 반환**: 나중에 removeEventListener에서 사용할 수 있도록 핸들러 반환
2. **상위 탐색**: 3D 객체가 eventListener가 없으면 부모로 올라가며 찾음 (이벤트 위임과 유사)
3. **Lazy Evaluation**: fx.L.map으로 필요한 만큼만 처리
4. **첫 번째만 처리**: fx.take(1)로 가장 앞에 있는 객체만 처리
5. **교차 정보 전달**: event에 intersects 추가하여 상세 정보 제공

### 개선점 ⚠️

#### 1. wemb.threeElements에 대한 의존성
**현재 코드**:
```javascript
const { scene, camera } = wemb.threeElements;
```

**문제점**:
- 전역 객체 `wemb`에 의존
- `wemb.threeElements`가 없거나 scene/camera가 없으면 에러
- 테스트 어려움

**개선안**:
```javascript
WKit.initThreeRaycasting = function (target, eventName, threeElements) {
  if (!threeElements || !threeElements.scene || !threeElements.camera) {
    throw new Error('threeElements with scene and camera is required');
  }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const { scene, camera } = threeElements;
  const onRaycasting = makeRaycastingFn(target, raycaster, mouse, scene, camera);
  target.addEventListener(eventName, onRaycasting);
  return onRaycasting;
};

// 사용
this.raycastingEventHandler = WKit.initThreeRaycasting(
  this.element,
  'click',
  wemb.threeElements
);
```

#### 2. offsetX/offsetY의 브라우저 호환성
**현재 코드**:
```javascript
mouse.x = (event.offsetX / rootElement.clientWidth) * 2 - 1;
mouse.y = -(event.offsetY / rootElement.clientHeight) * 2 + 1;
```

**문제점**:
- `offsetX/offsetY`는 IE에서 다르게 동작할 수 있음
- canvas가 페이지 상단이 아닐 때 부정확할 수 있음

**개선안**:
```javascript
function makeRaycastingFn(rootElement, raycaster, mouse, scene, camera) {
  return function (event) {
    const rect = rootElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    mouse.x = (x / rect.width) * 2 - 1;
    mouse.y = -(y / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    fx.go(
      intersects,
      fx.L.map((inter) => inter.object),
      fx.L.map((obj) => {
        let current = obj;
        while (current && !current.eventListener) {
          current = current.parent;
        }
        return current;
      }),
      fx.L.filter(Boolean),
      fx.take(1),
      ([target]) => target?.eventListener?.[event.type]?.(Object.assign(event, { intersects }))
    );
  };
}
```

#### 3. Object.assign으로 원본 이벤트 객체 변경
**현재 코드**:
```javascript
target?.eventListener?.[event.type]?.(Object.assign(event, { intersects }))
```

**문제점**:
- `Object.assign(event, { intersects })`는 원본 event 객체를 변경
- 다른 리스너에서 event 객체를 사용할 때 예상치 못한 동작 가능

**개선안**:
```javascript
// 새 객체 생성
([target]) => {
  if (target?.eventListener?.[event.type]) {
    target.eventListener[event.type]({ ...event, intersects });
  }
}

// 또는
([target]) => {
  if (target?.eventListener?.[event.type]) {
    target.eventListener[event.type](event, intersects);
  }
}
```

#### 4. 교차 검사 성능 이슈
**현재 코드**:
```javascript
const intersects = raycaster.intersectObjects(scene.children, true);
```

**문제점**:
- `true`로 모든 자식까지 재귀 검사 → 객체가 많으면 느림
- 매 클릭마다 전체 씬 검사

**개선안 1** (클릭 가능한 객체만 지정):
```javascript
WKit.initThreeRaycasting = function (target, eventName, threeElements, clickableObjects) {
  // ...
  const onRaycasting = makeRaycastingFn(
    target,
    raycaster,
    mouse,
    clickableObjects || scene.children,  // 특정 객체 배열 전달 가능
    camera
  );
  // ...
};

function makeRaycastingFn(rootElement, raycaster, mouse, objects, camera) {
  return function (event) {
    // ...
    const intersects = raycaster.intersectObjects(objects, true);
    // ...
  };
}
```

**개선안 2** (Layers 사용):
```javascript
// 클릭 가능한 객체에 레이어 설정
clickableObject.layers.enable(1);

// Raycaster에 레이어 필터 설정
raycaster.layers.set(1);

// 검사 시 해당 레이어의 객체만 체크
const intersects = raycaster.intersectObjects(scene.children, true);
```

#### 5. 이벤트 타입 검증 없음
**문제점**:
- `eventName`이 유효한 이벤트인지 확인 안 함
- 'click', 'mousedown' 등만 의미 있음

**개선안**:
```javascript
WKit.initThreeRaycasting = function (target, eventName, threeElements) {
  const validEvents = ['click', 'mousedown', 'mouseup', 'mousemove'];
  if (!validEvents.includes(eventName)) {
    console.warn(`[WKit.initThreeRaycasting] '${eventName}'은 일반적이지 않은 이벤트입니다.`);
  }

  // ...
};
```

#### 6. 다중 교차 처리 옵션 없음
**현재 코드**:
```javascript
fx.take(1),  // 항상 첫 번째만
```

**문제점**:
- 겹쳐진 객체들을 모두 처리하고 싶을 때 불가능
- 예: 투명한 유리 뒤의 버튼 클릭

**개선안** (옵션 추가):
```javascript
WKit.initThreeRaycasting = function (target, eventName, threeElements, options = {}) {
  const { multipleTargets = false } = options;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const { scene, camera } = threeElements;

  const onRaycasting = makeRaycastingFn(
    target,
    raycaster,
    mouse,
    scene,
    camera,
    multipleTargets
  );

  target.addEventListener(eventName, onRaycasting);
  return onRaycasting;
};

function makeRaycastingFn(rootElement, raycaster, mouse, scene, camera, multipleTargets) {
  return function (event) {
    // ...
    const intersects = raycaster.intersectObjects(scene.children, true);

    const takeCount = multipleTargets ? Infinity : 1;

    fx.go(
      intersects,
      fx.L.map((inter) => inter.object),
      fx.L.map((obj) => {
        let current = obj;
        while (current && !current.eventListener) {
          current = current.parent;
        }
        return current;
      }),
      fx.L.filter(Boolean),
      fx.take(takeCount),
      (targets) => {
        targets.forEach(target => {
          target?.eventListener?.[event.type]?.({ ...event, intersects });
        });
      }
    );
  };
}
```

## 개선 우선순위
1. **High**: offsetX/offsetY 대신 getBoundingClientRect 사용
2. **High**: Object.assign으로 원본 이벤트 변경 방지
3. **Medium**: wemb 의존성 제거 (파라미터로 전달)
4. **Low**: 성능 최적화 (clickable objects 또는 layers)
5. **Low**: 다중 교차 처리 옵션

## 관련 함수
- `makeRaycastingFn()` - Internal (`WKit.js:289-310`)
- `WKit.bind3DEvents()` - Public API (`WKit.js:51-57`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스
const handler = WKit.initThreeRaycasting(
  document.querySelector('#canvas'),
  'click',
  wemb.threeElements
);

// 사용자가 3D 객체 클릭
// → raycaster가 교차 검사
// → eventListener 가진 객체 찾기
// → 핸들러 호출

// 2. 중첩된 3D 객체
// Mesh1 (eventListener 있음)
//   └─ Mesh2 (eventListener 없음)
//     └─ Mesh3 (사용자가 클릭)

// 현재: Mesh3 → Mesh2 → Mesh1 순으로 올라가며 찾음 → Mesh1의 핸들러 호출 ✅

// 3. offsetX 문제 (canvas가 스크롤된 경우)
// 현재: offsetX 사용 → 부정확할 수 있음
// 개선 후: getBoundingClientRect 사용 → 정확

// 4. 성능 테스트 (씬에 10,000개 객체)
// 현재: 매 클릭마다 10,000개 검사 → 느림
// 개선 후: 클릭 가능 객체만 검사 → 빠름

// 5. 정리
canvas.removeEventListener('click', handler);
```

## 실제 사용 흐름
```javascript
// Page - loaded
function initPageController() {
  // 1. Raycasting 초기화
  this.raycastingEventType = 'click';
  this.raycastingEventHandler = WKit.initThreeRaycasting(
    this.element,
    this.raycastingEventType,
    wemb.threeElements
  );

  // 2. 이벤트 버스 핸들러 등록
  this.eventBusHandlers = {
    '@3dObjectClicked': async ({ event, targetInstance }) => {
      // event.intersects로 클릭 위치 등 상세 정보 접근
      const clickedObject = event.intersects[0].object;
      console.log('Clicked:', clickedObject.name);

      // 데이터 fetch
      const data = await WKit.pipeForDataMapping(targetInstance);
      // 처리 로직
    }
  };

  WKit.onEventBusHandlers(this.eventBusHandlers);
}

// 3D Component - register
function init() {
  this.customEvents = {
    click: '@3dObjectClicked'
  };

  WKit.bind3DEvents(this, this.customEvents);
}

// 사용자 클릭 시:
// 캔버스 클릭
//   → raycasting 핸들러 실행
//   → 3D 객체의 eventListener['click'] 호출
//   → WEventBus.emit('@3dObjectClicked')
//   → Page의 eventBusHandlers['@3dObjectClicked'] 실행

// Page - before_unload
function onPageUnLoad() {
  this.element.removeEventListener(
    this.raycastingEventType,
    this.raycastingEventHandler
  );
  this.raycastingEventHandler = null;
}
```

## Three.js Raycasting 개념
```
NDC (Normalized Device Coordinates)
  - x: -1 (왼쪽) ~ 1 (오른쪽)
  - y: -1 (아래) ~ 1 (위)

변환 공식:
  mouse.x = (screenX / width) * 2 - 1
  mouse.y = -(screenY / height) * 2 + 1  // Y축 반전

Raycaster:
  - 카메라 위치에서 마우스 방향으로 광선 발사
  - 광선과 교차하는 모든 3D 객체 찾기
  - 거리순으로 정렬 (가까운 것부터)

intersects 배열:
  [
    {
      distance: 10.5,           // 카메라에서의 거리
      point: Vector3,           // 교차 지점 3D 좌표
      object: Mesh,             // 교차한 객체
      face: Face3,              // 교차한 면
      faceIndex: 123,           // 면 인덱스
      uv: Vector2               // UV 좌표
    },
    ...
  ]
```
