# 3D 이벤트 바인딩 시스템

## 개요

Three.js 기반 3D 컴포넌트의 이벤트 처리를 위한 바인딩 시스템입니다.

---

## 핵심 개념

### 단일 Canvas 아키텍처

모든 3D 컴포넌트는 **하나의 Canvas**와 **하나의 Scene**을 공유합니다.

```
[Browser]
└── Single Canvas Element (WebGL Context)
    └── Three.js Scene (wemb.threeElements.scene)
        ├── Component1.appendElement (THREE.Group)
        │   └── meshes...
        ├── Component2.appendElement (THREE.Group)
        │   └── meshes...
        └── Component3.appendElement (THREE.Group)
            └── meshes...
```

**왜 단일 Canvas?**
- WebGL Context는 리소스 집약적
- 브라우저당 제한된 개수만 생성 가능
- 렌더링 성능 최적화 (단일 렌더 루프)

**의미**:
- 2D처럼 각 컴포넌트가 독립된 DOM 영역을 가질 수 없음
- 페이지 레벨에서 통합된 이벤트 처리 필요

---

## API

### 1. initThreeRaycasting

**페이지 레벨 Raycasting 초기화**

```javascript
WKit.initThreeRaycasting(target, eventName)
```

**파라미터**:
- `target`: Canvas를 포함하는 DOM 엘리먼트 (보통 `page.element`)
- `eventName`: 브라우저 이벤트 타입 (예: `'click'`, `'dblclick'`)

**반환**: Raycasting 이벤트 핸들러 함수 (cleanup용)

**예시**:
```javascript
// Page - before_load
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
```

**내부 동작**:
1. 마우스 좌표를 NDC(-1 ~ 1)로 변환
2. `scene.children` 전체를 대상으로 raycasting 수행
3. Intersect된 객체의 부모를 거슬러 올라가며 `eventListener` 탐색
4. 가장 앞의(closest) 객체의 `eventListener` 호출

---

### 2. bind3DEvents

**컴포넌트별 이벤트 핸들러 등록**

```javascript
WKit.bind3DEvents(instance, customEvents)
```

**파라미터**:
- `instance`: 컴포넌트 인스턴스
- `customEvents`: 이벤트 스키마 객체

**예시**:
```javascript
// Component - register
this.customEvents = {
    click: '@3dObjectClicked'
};

bind3DEvents(this, this.customEvents);
```

**내부 동작**:
1. `instance.appendElement.eventListener` 객체 생성
2. 각 이벤트 타입마다 핸들러 등록
3. 핸들러는 `make3DHandler`로 생성 → WEventBus로 emit

---

## 이벤트 흐름

```
[User Click]
  ↓
[Browser Event on Canvas]
  ↓
[initThreeRaycasting - Raycasting 수행]
  ├─ mouse 좌표 계산 (NDC)
  ├─ raycaster.intersectObjects(scene.children, true)  ← 전체 Scene 검사
  ├─ 부모를 거슬러 올라가며 eventListener 탐색
  └─ target.eventListener[event.type](event)
  ↓
[bind3DEvents - 컴포넌트 핸들러]
  ├─ make3DHandler 호출
  └─ WEventBus.emit(customEvents[event.type], { event, targetInstance })
  ↓
[Page EventBus Handler]
  └─ 데이터 처리, UI 업데이트 등
```

---

## 컴포넌트 식별 메커니즘

### appendElement의 역할

각 3D 컴포넌트는 `appendElement` (THREE.Group)를 Scene에 추가합니다.

```javascript
// Component 생성 시
this.appendElement = new THREE.Group();
scene.add(this.appendElement);

// 메쉬 추가
const mesh = new THREE.Mesh(geometry, material);
this.appendElement.add(mesh);
```

**Raycasting이 컴포넌트를 찾는 방법**:

```javascript
// WKit.js:229-235
fx.L.map((obj) => {
  let current = obj;
  while (current && !current.eventListener) {
    current = current.parent;  // 부모로 올라감
  }
  return current;  // appendElement에 도달
})
```

1. Intersect된 mesh에서 시작
2. 부모를 계속 거슬러 올라감
3. `eventListener` 프로퍼티가 있는 객체 발견 (= appendElement)
4. 해당 컴포넌트의 핸들러 호출

---

## 대시보드 케이스

### 시나리오: 여러 3D 차트 대시보드

```javascript
// Dashboard Page
// ├── Sales Chart (3D Bar)
// ├── User Activity (3D Line)
// └── Heatmap (3D Surface)

// Page - before_load
this.eventBusHandlers = {
    '@salesChartClicked': async ({ event, targetInstance }) => {
        console.log('Sales chart clicked', targetInstance.name);
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const data = await fetchData(this, datasetInfo.datasetName, datasetInfo.param);
            // Sales 차트 업데이트
        }
    },

    '@userActivityClicked': async ({ event, targetInstance }) => {
        console.log('User activity clicked');
        // User activity 처리
    },

    '@heatmapClicked': async ({ event, targetInstance }) => {
        console.log('Heatmap clicked');
        // Heatmap 처리
    }
};

onEventBusHandlers(this.eventBusHandlers);

// Raycasting 초기화 (한 번만)
this.raycastingEventHandler = initThreeRaycasting(this.element, 'click');


// SalesChart Component - register
this.customEvents = { click: '@salesChartClicked' };
this.datasetInfo = {
    datasetName: 'salesAPI',
    param: { period: 'monthly' }
};
bind3DEvents(this, this.customEvents);

// UserActivity Component - register
this.customEvents = { click: '@userActivityClicked' };
bind3DEvents(this, this.customEvents);

// Heatmap Component - register
this.customEvents = { click: '@heatmapClicked' };
bind3DEvents(this, this.customEvents);
```

**동작**:
1. 사용자가 Sales Chart 클릭
2. Raycasting이 scene.children 전체 검사
3. Sales Chart의 mesh에 intersect
4. 부모를 거슬러 올라가 `SalesChart.appendElement.eventListener` 발견
5. `@salesChartClicked` 이벤트 발행
6. 페이지의 `@salesChartClicked` 핸들러만 호출 ✅

---

## 성능 고려사항

### Scene 전체 검사

```javascript
// WKit.js:225
const intersects = raycaster.intersectObjects(scene.children, true);
```

**특징**:
- 매 클릭마다 **모든 3D 객체** 검사
- 객체 수에 비례하여 연산 비용 증가

**영향**:
- 소규모 (3-5개 차트, 각 50개 이하 메쉬): ✅ 문제 없음
- 중규모 (10개 차트, 각 100-200개 메쉬): ⚠️ 주의 필요
- 대규모 (복잡한 3D 모델 다수): ❌ 최적화 필요

**실제 병목**:
- Three.js 내부 최적화 활용 (BVH, Frustum Culling)
- 대부분의 경우 **렌더링**이 더 큰 병목
- Raycasting은 클릭 시에만 발생 (매 프레임 아님)

### Z-Ordering

```javascript
// WKit.js:237
fx.take(1)  // 가장 앞의 객체만
```

- 여러 객체가 겹쳐있을 때 **가장 가까운 객체**만 선택
- 올바른 우선순위 처리

---

## 2D 이벤트와의 비교

| 측면 | 2D 이벤트 | 3D 이벤트 |
|------|-----------|-----------|
| **DOM 구조** | 각 컴포넌트 독립된 DOM 영역 | 단일 Canvas 공유 |
| **이벤트 소스** | 각 컴포넌트의 `element` | 페이지의 Canvas |
| **이벤트 등록** | 컴포넌트별 `addEventListener` | 페이지 레벨 Raycasting |
| **컴포넌트 식별** | DOM 트리 탐색 | appendElement 부모 탐색 |
| **격리** | 완전 격리 | 논리적 격리 (appendElement 단위) |
| **패턴** | customEvents + WEventBus | 동일 |

**공통점**:
- ✅ customEvents 스키마 구조 동일
- ✅ WEventBus를 통한 이벤트 발행
- ✅ 페이지 레벨 핸들러에서 통합 처리

---

## 제약사항 및 향후 개선

### 현재 제약사항

1. **최적화 옵션 없음**
   ```javascript
   // 현재: 전체 scene 강제 검사
   initThreeRaycasting(this.element, 'click');

   // 향후: 특정 컴포넌트만 검사하는 옵션 가능
   initThreeRaycasting(this.element, 'click', {
       targets: [comp1.appendElement, comp2.appendElement]
   });
   ```

2. **컴포넌트 레벨 핸들러 불가**
   - 현재는 모든 처리가 페이지 핸들러에서 발생
   - 컴포넌트 자체 로직 처리 어려움

3. **이벤트 우선순위 제어 제한**
   - z-ordering만 고려 (가장 가까운 객체)
   - 컴포넌트 레벨 우선순위 설정 불가

### 향후 개선 방향

1. **선택적 Raycasting**
   - 활성화된 컴포넌트만 검사
   - Three.js Layers 활용

2. **컴포넌트 레벨 핸들러**
   ```javascript
   // 컴포넌트에서 직접 처리 가능하도록
   this.on3DClick = (event, intersects) => {
       // 컴포넌트 자체 로직
   };
   ```

3. **성능 프로파일링 도구**
   - Raycasting 비용 측정
   - 병목 지점 시각화

---

## 베스트 프랙티스

### ✅ DO

```javascript
// 1. 페이지당 한 번만 Raycasting 초기화
this.raycastingEventHandler = initThreeRaycasting(this.element, 'click');

// 2. 명확한 이벤트 이름 사용
this.customEvents = {
    click: '@salesChartClicked'  // 컴포넌트 종류 명시
};

// 3. targetInstance로 컴포넌트 구분
this.eventBusHandlers = {
    '@salesChartClicked': ({ event, targetInstance }) => {
        console.log('Clicked:', targetInstance.name);
        const { datasetInfo } = targetInstance;  // 컴포넌트별 데이터
    }
};

// 4. before_unload에서 정리
this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
```

### ❌ DON'T

```javascript
// 1. 중복 Raycasting 초기화 (페이지당 한 번만!)
initThreeRaycasting(this.element, 'click');  // ❌
initThreeRaycasting(this.element, 'click');  // 중복!

// 2. 모호한 이벤트 이름
this.customEvents = {
    click: '@clicked'  // ❌ 어떤 컴포넌트인지 불명확
};

// 3. Scene 직접 조작
scene.children[0].addEventListener(...);  // ❌ WKit API 사용

// 4. eventListener 직접 설정
this.appendElement.eventListener = myHandler;  // ❌ bind3DEvents 사용
```

---

## 트러블슈팅

### 이벤트가 발생하지 않는 경우

**확인 사항**:

1. **Raycasting 초기화 여부**
   ```javascript
   // Page - before_load에서
   this.raycastingEventHandler = initThreeRaycasting(this.element, 'click');
   ```

2. **컴포넌트 이벤트 바인딩 여부**
   ```javascript
   // Component - register에서
   bind3DEvents(this, this.customEvents);
   ```

3. **EventBus 핸들러 등록 여부**
   ```javascript
   // Page - before_load에서
   onEventBusHandlers(this.eventBusHandlers);
   ```

4. **appendElement가 Scene에 추가되었는지**
   ```javascript
   console.log(this.appendElement.parent === scene);  // true여야 함
   ```

### 잘못된 컴포넌트가 반응하는 경우

**원인**:
- 여러 컴포넌트의 mesh가 겹쳐있음
- z-ordering 문제

**해결**:
- `event.intersects` 배열 확인
- 메쉬 위치 조정
- Three.js Layers로 선택적 렌더링

---

## 참고 자료

**관련 파일**:
- `Utils/WKit.js:31-46` - initThreeRaycasting, bind3DEvents
- `Utils/WKit.js:220-252` - makeRaycastingFn, make3DHandler
- `Runtime_Scaffold_code_sample/component_script/component_3d_register_event_binding.js`
- `Runtime_Scaffold_code_sample/page_script/page_before_load.js`

**핵심 함수**:
- `WKit.initThreeRaycasting(target, eventName)` - 페이지 레벨 Raycasting
- `WKit.bind3DEvents(instance, customEvents)` - 컴포넌트 이벤트 등록
- `makeRaycastingFn()` - Raycasting 로직
- `make3DHandler()` - 컴포넌트 핸들러 생성

---

## 버전 정보

**버전**: 1.1.0
**최종 업데이트**: 2025-11-19
**작성자**: Claude Code Analysis
