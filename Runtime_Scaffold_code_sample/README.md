# Runtime Scaffold Code Samples

패턴의 본질에 집중한 **최소한의 예제 코드**입니다.

## 📋 철학

- ✅ **Primitive 조합** - 불필요한 추상화 제거
- ✅ **패턴의 본질** - 핵심만 남김
- ✅ **복사 & 사용** - 바로 쓸 수 있게

---

## 🎯 Component Patterns

### 1. 2D Component - Basic Event

**파일**: `component_script/component_2d_register_default.js`

**용도**: DOM 이벤트 바인딩 (click, submit 등)

**핵심**:
```javascript
this.customEvents = {
    click: { '.my-button': '@buttonClicked' }
};
bindEvents(this, this.customEvents);
```

**Cleanup**: `component_script/component_2d_destroy_default.js`

---

### 2. 2D Component - Subscription

**파일**: `component_script/component_2d_register_subscribe_page.js`

**용도**: GlobalDataPublisher로 페이지 데이터 구독

**핵심**:
```javascript
this.subscriptions = {
    users: ['renderUserTable']
};
subscribe(topic, this, this[fn]);
```

**Cleanup**: `component_script/component_2d_destroy_unsubscribe_page.js`

---

### 3. 3D Component - Event

**파일**: `component_script/component_3d_register.js`

**용도**: Three.js 객체 이벤트 바인딩 + 데이터 소스 선언

**핵심**:
```javascript
// Event
this.customEvents = {
    click: '@3dObjectClicked'
};
bind3DEvents(this, this.customEvents);

// Data source (optional)
this.datasetInfo = {
    datasetName: 'myDataset',
    param: { type: 'geometry', id: this.id }
};
```

---

## 📄 Page Patterns

### 1. Page - before_load

**파일**: `page_script/page_before_load.js`

**용도**: 이벤트 핸들러 등록, Three.js Raycasting 설정

**핵심 (Primitive 조합)**:
```javascript
this.eventBusHandlers = {
    '@3dObjectClicked': async ({ event, targetInstance }) => {
        // Primitive composition
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
        }
    }
};
onEventBusHandlers(this.eventBusHandlers);
```

---

### 2. Page - loaded

**파일**: `page_script/page_loaded.js`

**용도**: 페이지 레벨 데이터 발행 (GlobalDataPublisher 설정)
- 모든 컴포넌트가 completed된 시점에 실행
- 구독자(컴포넌트)들이 준비된 상태에서 데이터 발행

**핵심**:
```javascript
this.globalDataMappings = [
    { topic: 'users', datasetInfo: {...} }
];
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```

---

### 3. Page - before_unload

**파일**: `page_script/page_before_unload.js`

**용도**: 메모리 정리 (EventBus, GlobalDataPublisher, 3D 리소스)

**핵심**:
```javascript
// 1. EventBus cleanup
offEventBusHandlers(this.eventBusHandlers);

// 2. GlobalDataPublisher cleanup
fx.go(
    this.globalDataMappings,
    map(({ topic }) => topic),
    each(GlobalDataPublisher.unregisterMapping)
);

// 3. 3D resource cleanup
dispose3DTree(appendElement);
clearSceneBackground(scene);
```

---

## 🔑 핵심 패턴

### Pattern 1: Event Delegation (2D)
```javascript
// Register
this.customEvents = { click: { '.btn': '@clicked' } };
bindEvents(this, this.customEvents);

// Destroy
removeCustomEvents(this, this.customEvents);
```

### Pattern 2: Pub-Sub (GlobalDataPublisher)
```javascript
// Page: Publish
GlobalDataPublisher.registerMapping({ topic, datasetInfo });
GlobalDataPublisher.fetchAndPublish(topic, this);

// Component: Subscribe
subscribe(topic, this, this.handler);

// Component: Unsubscribe
unsubscribe(topic, this);
```

### Pattern 3: Primitive Composition
```javascript
// Before (v1.0 - 제거됨)
await pipeForDataMapping(targetInstance);
triggerEventToTargetInstance('MyComp', '@event');

// After (v1.1 - Primitive 조합)
// Data fetching
const { datasetInfo } = targetInstance;
if (datasetInfo) {
    const { datasetName, param } = datasetInfo;
    const data = await fetchData(this, datasetName, param);
}

// Event triggering
const iter = makeIterator(wemb.mainPageComponent);
const target = getInstanceByName('MyComp', iter);
if (target) emitEvent('@event', target);
```

---

## 🚀 사용법

### 1. 필요한 패턴 선택
- 2D 이벤트만? → `component_2d_register_default.js`
- 페이지 데이터 구독? → `component_2d_register_subscribe_page.js`
- 3D 이벤트? → `component_3d_register.js`

### 2. 코드 복사
```javascript
// 예: 2D 컴포넌트 기본
const { bindEvents } = WKit;

this.customEvents = {
    click: { '.my-button': '@buttonClicked' }
};

this.handleButtonClick = handleButtonClick.bind(this);
bindEvents(this, this.customEvents);

function handleButtonClick(data) {
    console.log('Clicked!', data);
}
```

### 3. 필요에 맞게 수정
- 셀렉터 변경 (`.my-button` → `.your-button`)
- 이벤트 이름 변경 (`@buttonClicked` → `@yourEvent`)
- 핸들러 로직 작성

---

## 💡 베스트 프랙티스

### ✅ DO
```javascript
// Primitive를 명확하게 조합
const iter = makeIterator(page);
const instance = getInstanceByName('MyComp', iter);
if (instance) {
    emitEvent('@event', instance);
}

// 항상 cleanup
removeCustomEvents(this, this.customEvents);
this.customEvents = null;
```

### ❌ DON'T
```javascript
// 고수준 추상화 사용 (제거됨)
pipeForDataMapping(targetInstance);  // ❌
triggerEventToTargetInstance('MyComp', '@event');  // ❌

// cleanup 누락
// 메모리 누수 발생! ❌
```

---

## 📦 파일 구조

```
Runtime_Scaffold_code_sample/
├── component_script/
│   ├── component_2d_register_default.js          # 2D 기본 이벤트
│   ├── component_2d_register_subscribe_page.js   # 2D 구독 패턴
│   ├── component_3d_register.js                  # 3D 이벤트
│   ├── component_2d_destroy_default.js           # 2D cleanup
│   └── component_2d_destroy_unsubscribe_page.js  # 2D 구독 cleanup
├── page_script/
│   ├── page_before_load.js     # before_load (이벤트 핸들러, Raycasting)
│   ├── page_loaded.js          # loaded (데이터 발행)
│   └── page_before_unload.js   # before_unload (cleanup)
└── README.md                   # 이 문서
```

---

## 🎓 버전 정보

**v1.1.0** - Primitive Building Blocks 원칙 적용
- 고수준 추상화 제거 (pipeForDataMapping, triggerEventToTargetInstance)
- 데이터 구조 간소화: `dataMapping` 배열 → 단일 `datasetInfo` 객체
- 불필요한 필드 제거 (ownerId, visualInstanceList)
- 페이지 라이프사이클 정정:
  - before_load: 이벤트 핸들러 등록 (컴포넌트 생성 전)
  - loaded: 데이터 발행 (모든 컴포넌트 completed 후)
- Primitive 조합 패턴으로 전환
- 패턴의 본질에 집중

**작성일**: 2025-11-19
