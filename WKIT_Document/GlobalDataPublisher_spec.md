# GlobalDataPublisher 상세 명세

## 개요

Topic 기반 데이터 발행-구독 시스템으로, 페이지 레벨에서 여러 컴포넌트가 동일한 데이터를 공유할 수 있도록 지원합니다.

## 아키텍처

### IIFE 패턴 (즉시 실행 함수)

```javascript
const GlobalDataPublisher = (() => {
  // Private 상태
  const mappingTable = new Map();
  const subscriberTable = new Map();

  // Public API 반환
  return { registerMapping, fetchAndPublish, ... };
})();
```

**목적**: 클로저를 이용해 내부 상태를 캡슐화하고 외부에서 직접 접근 불가능하게 만듦

---

## 내부 상태

### 1. mappingTable
**타입**: `Map<string, DatasetInfo>`

**용도**: Topic과 데이터 소스 정보를 매핑

**구조**:
```javascript
mappingTable = Map {
  'users' => {
    datasetName: 'myapi',
    param: { endpoint: '/users', limit: 20 }
  },
  'products' => {
    datasetName: 'myapi',
    param: { category: 'all' }
  }
}
```

**생성 시점**: `registerMapping()` 호출 시
**사용 시점**: `fetchAndPublish()` 에서 데이터 fetch 시
**제거 시점**: `unregisterMapping()` 호출 시 또는 페이지 unload 시

**왜 Map을 사용하는가?**
- O(1) 조회 성능
- topic(문자열) 키로 빠른 접근
- `has()`, `get()`, `delete()` 메서드 편의성

---

### 2. subscriberTable
**타입**: `Map<string, Set<Subscriber>>`

**용도**: Topic별 구독자 목록 관리

**구조**:
```javascript
subscriberTable = Map {
  'users' => Set([
    { instance: userTableComponent, handler: renderTable },
    { instance: userCountComponent, handler: updateCount }
  ]),
  'products' => Set([
    { instance: productListComponent, handler: renderList }
  ])
}
```

**Subscriber 객체**:
```javascript
{
  instance: ComponentInstance,  // 컴포넌트 인스턴스 (this)
  handler: Function              // 데이터 수신 핸들러
}
```

**생성 시점**: `subscribe()` 호출 시
**사용 시점**: `fetchAndPublish()` 에서 데이터 전파 시
**제거 시점**: `unsubscribe()` 호출 시 또는 컴포넌트 destroy 시

**왜 Set을 사용하는가?**
- 중복 구독 방지 (동일한 instance+handler 조합)
- O(1) 추가/삭제 성능
- `for...of` 순회 지원

**왜 Map 안에 Set을 사용하는가?**
- topic별로 구독자를 그룹화 (Map)
- 각 topic의 구독자 목록에서 중복 방지 (Set)

---

## 메서드 상세

### 1. registerMapping({ topic, datasetInfo })

#### 시그니처
```javascript
registerMapping({
  topic: string,        // 데이터 topic 이름
  datasetInfo: {
    datasetName: string,  // 데이터셋 이름
    param: Object         // 데이터셋 파라미터
  }
}): { topic, datasetInfo }
```

#### 목적
Topic과 데이터 소스 정보를 `mappingTable`에 등록

---

#### 동작 흐름 (소스 레벨)

**코드** (GlobalDataPublisher.js:6-12):
```javascript
registerMapping({ topic, datasetInfo }) {
  mappingTable.set(topic, datasetInfo);
  return {
    topic,
    datasetInfo,
  };
}
```

**동작**:
1. `mappingTable` Map에 `topic`을 키로, `datasetInfo`를 값으로 저장
2. 입력받은 객체를 그대로 리턴 (체이닝 지원)

**예시**:
```javascript
GlobalDataPublisher.registerMapping({
  topic: 'users',
  datasetInfo: {
    datasetName: 'myapi',
    param: { endpoint: '/users', limit: 20 }
  }
});

// mappingTable 내부 상태:
// Map {
//   'users' => {
//     datasetName: 'myapi',
//     param: { endpoint: '/users', limit: 20 }
//   }
// }
```

**왜 리턴하는가?**
- `fx.each`와 같은 함수형 파이프라인에서 사용 가능
- 등록 결과 확인 용도

**사용 패턴**:
```javascript
// 패턴 1: 단일 등록
GlobalDataPublisher.registerMapping({
  topic: 'users',
  datasetInfo: {...}
});

// 패턴 2: 일괄 등록 (fx.each)
fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping)
);
```

---

### 2. unregisterMapping(topic)

#### 시그니처
```javascript
unregisterMapping(topic: string): void
```

#### 목적
`mappingTable`에서 topic 제거 (메모리 정리)

---

#### 동작 흐름 (소스 레벨)

**코드** (GlobalDataPublisher.js:14-16):
```javascript
unregisterMapping(topic) {
  mappingTable.delete(topic);
}
```

**동작**:
- `mappingTable` Map에서 `topic` 키 삭제
- 존재하지 않는 topic을 삭제해도 에러 없음 (Map.delete의 안전성)

**예시**:
```javascript
// 등록
GlobalDataPublisher.registerMapping({
  topic: 'users',
  datasetInfo: {...}
});

// 제거
GlobalDataPublisher.unregisterMapping('users');

// mappingTable 내부 상태:
// Map {} (비어있음)
```

**사용 시점**:
- 페이지 `before_unload`에서 모든 매핑 정리
- 특정 topic이 더 이상 필요 없을 때

**사용 패턴**:
```javascript
// Page - before_unload
function clearDataPublisher() {
  fx.go(
    this.globalDataMappings,
    fx.map(({ topic }) => topic),
    fx.each(GlobalDataPublisher.unregisterMapping)
  );
}
```

---

### 3. subscribe(topic, instance, handler)

#### 시그니처
```javascript
subscribe(
  topic: string,             // 구독할 topic
  instance: ComponentInstance, // 컴포넌트 인스턴스
  handler: Function          // 데이터 수신 핸들러
): void
```

#### 목적
특정 topic에 컴포넌트의 핸들러를 구독자로 등록

---

#### 동작 흐름 (소스 레벨)

**코드** (GlobalDataPublisher.js:38-41):
```javascript
subscribe(topic, instance, handler) {
  if (!subscriberTable.has(topic)) subscriberTable.set(topic, new Set());
  subscriberTable.get(topic).add({ instance, handler });
}
```

**동작**:
1. `subscriberTable`에 topic이 없으면 빈 Set 생성
2. topic의 Set에 `{ instance, handler }` 객체 추가

**단계별 분석**:

**1단계: topic 존재 확인**
```javascript
if (!subscriberTable.has(topic))
```
- topic이 처음 구독되는 경우 체크
- Map의 `has()` 메서드로 O(1) 조회

**2단계: Set 초기화**
```javascript
subscriberTable.set(topic, new Set());
```
- 해당 topic의 구독자를 담을 빈 Set 생성
- Set 사용 이유: 중복 방지, 빠른 추가/삭제

**3단계: 구독자 추가**
```javascript
subscriberTable.get(topic).add({ instance, handler });
```
- topic의 Set에 구독자 객체 추가
- 객체 구조: `{ instance, handler }`

**예시**:
```javascript
// 첫 번째 구독
GlobalDataPublisher.subscribe('users', userTableComp, renderTable);

// subscriberTable 내부:
// Map {
//   'users' => Set([
//     { instance: userTableComp, handler: renderTable }
//   ])
// }

// 두 번째 구독 (같은 topic)
GlobalDataPublisher.subscribe('users', userCountComp, updateCount);

// subscriberTable 내부:
// Map {
//   'users' => Set([
//     { instance: userTableComp, handler: renderTable },
//     { instance: userCountComp, handler: updateCount }
//   ])
// }
```

**중복 구독 처리**:
```javascript
// Set은 참조 동등성으로 중복 체크
const comp = userTableComp;
const handler = renderTable;

// 첫 번째 구독
subscribe('users', comp, handler);
// Set에 { instance: comp, handler } 추가

// 두 번째 구독 (같은 instance, handler)
subscribe('users', comp, handler);
// 새로운 객체이므로 Set에 추가됨! (참조가 다름)

// 주의: 매번 새 객체를 만들므로 중복 방지가 완벽하지 않음
// 사용자가 중복 구독하지 않도록 주의 필요
```

**사용 패턴**:
```javascript
// Component - register
this.subscriptions = {
  users: ['renderTable', 'updateCount'],
  products: ['renderList']
};

// 메서드 바인딩
this.renderTable = renderTable.bind(this);
this.updateCount = updateCount.bind(this);
this.renderList = renderList.bind(this);

// 구독 등록
fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, fnList]) =>
    fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
  )
);
```

---

### 4. unsubscribe(topic, instance)

#### 시그니처
```javascript
unsubscribe(
  topic: string,             // 구독 해제할 topic
  instance: ComponentInstance  // 컴포넌트 인스턴스
): void
```

#### 목적
특정 topic에서 컴포넌트의 모든 구독 해제 (메모리 누수 방지)

---

#### 동작 흐름 (소스 레벨)

**코드** (GlobalDataPublisher.js:43-49):
```javascript
unsubscribe(topic, instance) {
  const subs = subscriberTable.get(topic);
  if (!subs) return;
  for (const sub of subs) {
    if (sub.instance === instance) subs.delete(sub);
  }
}
```

**동작**:
1. `subscriberTable`에서 topic의 구독자 Set 조회
2. Set이 없으면 조기 종료 (방어 코드)
3. Set을 순회하며 instance가 일치하는 구독자 삭제

**단계별 분석**:

**1단계: 구독자 Set 조회**
```javascript
const subs = subscriberTable.get(topic);
```
- topic의 구독자 목록 가져오기
- 없으면 `undefined`

**2단계: 방어 코드**
```javascript
if (!subs) return;
```
- topic이 등록되지 않았거나 구독자가 없는 경우 안전하게 종료
- 에러 발생 방지

**3단계: 일치하는 구독자 삭제**
```javascript
for (const sub of subs) {
  if (sub.instance === instance) subs.delete(sub);
}
```
- Set 순회하며 `instance`가 일치하는 모든 항목 삭제
- `===` 참조 비교로 동일 인스턴스 확인

**예시**:
```javascript
// 구독 상태
subscriberTable.get('users') = Set([
  { instance: userTableComp, handler: renderTable },
  { instance: userTableComp, handler: updateCount },  // 같은 instance!
  { instance: userCountComp, handler: updateCount }
]);

// 구독 해제
GlobalDataPublisher.unsubscribe('users', userTableComp);

// 결과: userTableComp의 모든 핸들러 제거됨
subscriberTable.get('users') = Set([
  { instance: userCountComp, handler: updateCount }
]);
```

**왜 instance만으로 삭제하는가?**
- 컴포넌트 destroy 시 해당 컴포넌트의 모든 구독을 한 번에 해제
- handler를 일일이 지정할 필요 없음

**주의사항**:
```javascript
// Set 순회 중 삭제는 안전함 (ES6 명세)
for (const sub of subs) {
  subs.delete(sub);  // OK
}

// 참고: Array는 순회 중 삭제 시 주의 필요
for (let i = 0; i < arr.length; i++) {
  arr.splice(i, 1);  // ❌ 인덱스 꼬임
}
```

**사용 패턴**:
```javascript
// Component - destroy
function clearSubscribe(instance) {
  fx.go(
    Object.entries(instance.subscriptions),
    fx.each(([topic, _]) => GlobalDataPublisher.unsubscribe(topic, instance))
  );
}

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
  clearSubscribe(this);
}
```

---

### 5. getGlobalMappingSchema(defaults)

#### 시그니처
```javascript
getGlobalMappingSchema({
  topic?: string,
  datasetInfo?: {
    datasetName: string,
    param: Object
  }
} = {}): { topic, datasetInfo }
```

#### 목적
`globalDataMappings` 스키마 예제 제공 (코드 생성 지원)

---

#### 동작 흐름 (소스 레벨)

**코드** (GlobalDataPublisher.js:50-61):
```javascript
getGlobalMappingSchema({
  topic = 'weather',
  datasetInfo = {
    datasetName: 'dummyjson',
    param: { dataType: 'weather', id: 'default' },
  },
} = {}) {
  return {
    topic,
    datasetInfo,
  };
}
```

**동작**:
1. 기본값이 설정된 객체 구조 분해
2. 사용자가 제공한 값으로 덮어쓰기 (선택)
3. 스키마 객체 리턴

**예시**:
```javascript
// 기본 스키마
const schema = GlobalDataPublisher.getGlobalMappingSchema();
// => {
//      topic: 'weather',
//      datasetInfo: {
//        datasetName: 'dummyjson',
//        param: { dataType: 'weather', id: 'default' }
//      }
//    }

// 커스텀 스키마
const custom = GlobalDataPublisher.getGlobalMappingSchema({
  topic: 'users',
  datasetInfo: {
    datasetName: 'myapi',
    param: { endpoint: '/users' }
  }
});
// => {
//      topic: 'users',
//      datasetInfo: {
//        datasetName: 'myapi',
//        param: { endpoint: '/users' }
//      }
//    }
```

**사용 목적**:
- 비주얼 빌더 에디터에서 코드 자동 생성 시 템플릿 제공
- 사용자에게 올바른 구조 가이드

**왜 함수로 제공하는가?**
- 매번 새 객체 생성 (참조 공유 방지)
- 기본값 변경 가능

---

### 6. fetchAndPublish(topic, page, paramUpdates = null)

### 시그니처
```javascript
async fetchAndPublish(
  topic: string,           // 데이터 topic 이름
  page: PageInstance,      // 페이지 인스턴스 (dataService 접근용)
  paramUpdates: Object     // (선택) 병합할 param (v1.2)
): Promise<void>
```

### 목적
1. topic에 등록된 데이터 소스에서 데이터 fetch
2. fetch된 데이터를 모든 구독자에게 자동 전파
3. 동적 param 업데이트 지원 (기존 param과 병합)

---

### 동작 흐름 (소스 레벨)

#### 1단계: Mapping 조회 (18-23줄)
```javascript
const datasetInfo = mappingTable.get(topic);
if (!datasetInfo) {
  console.warn(`[GlobalDataPublisher] 등록되지 않은 topic: ${topic}`);
  return;
}
```

**동작**:
- `mappingTable` Map에서 topic으로 datasetInfo 조회
- 등록되지 않은 topic이면 경고 출력 후 조기 종료

**예시**:
```javascript
// topic='users' 조회
mappingTable.get('users')
// => { datasetName: 'myapi', param: { endpoint: '/users', limit: 20 } }
```

---

#### 2단계: Param 병합 (25-28줄)
```javascript
const param = paramUpdates
  ? { ...datasetInfo.param, ...paramUpdates }
  : datasetInfo.param;
```

**동작**:
- `paramUpdates`가 있으면 **얕은 병합(shallow merge)** 수행
- 스프레드 연산자로 새 객체 생성 (원본 유지)
- 없으면 기존 param 사용

**예시 1: paramUpdates 없음**
```javascript
// 기존 param 그대로 사용
datasetInfo.param = { endpoint: '/users', limit: 20 }
paramUpdates = null
// => param = { endpoint: '/users', limit: 20 }
```

**예시 2: paramUpdates 있음 (필터 변경)**
```javascript
// 기존 param
datasetInfo.param = { endpoint: '/users', limit: 20, status: 'active' }

// 필터 변경 시
fetchAndPublish('users', page, { status: 'inactive' })

// 병합 결과
param = {
  endpoint: '/users',  // 유지
  limit: 20,           // 유지
  status: 'inactive'   // 덮어씀
}
```

**왜 얕은 병합인가?**
- param 구조가 1depth 평탄화된 경우 충분
- 깊은 병합은 복잡도 증가 및 성능 저하
- 필요시 사용자가 직접 깊은 병합 수행 가능

**주의사항**:
```javascript
// ❌ 중첩 객체는 덮어씀
datasetInfo.param = {
  filter: { age: 30, status: 'active' }
}
paramUpdates = {
  filter: { age: 25 }
}
// => param = { filter: { age: 25 } }  // status 손실!

// ✅ 1depth 병합만 권장
datasetInfo.param = { age: 30, status: 'active' }
paramUpdates = { age: 25 }
// => param = { age: 25, status: 'active' }  // 정상
```

---

#### 3단계: 데이터 Fetch (30줄)
```javascript
const data = await WKit.fetchData(page, datasetInfo.datasetName, param);
```

**동작**:
1. `WKit.fetchData`를 호출하여 비동기 데이터 요청
2. `page.dataService.call(datasetName, { param })` 실행
3. Promise 기반으로 데이터 대기

**WKit.fetchData 내부 동작** (WKit.js:124-131):
```javascript
WKit.fetchData = function (page, datasetName, param) {
  return new Promise((res, rej) => {
    page.dataService
      .call(datasetName, { param })         // 데이터셋 호출
      .on('success', (data) => res(data))   // 성공 시 resolve
      .on('error', (err) => rej(err));      // 실패 시 reject
  });
};
```

**dataService란?**
- 페이지 인스턴스에 주입된 데이터 서비스 객체
- 웹 빌더 런타임에서 제공하는 데이터 레이어
- 실제 API 호출, 캐싱, 에러 핸들링 담당

**호출 흐름**:
```
fetchAndPublish('users', page, { limit: 50 })
  → WKit.fetchData(page, 'myapi', { endpoint: '/users', limit: 50 })
    → page.dataService.call('myapi', { param: {...} })
      → HTTP Request to API
      → Response: [{ id: 1, name: 'John' }, ...]
      → Promise resolve(data)
  → data = [{ id: 1, name: 'John' }, ...]
```

---

#### 4단계: 구독자 목록 조회 (31줄)
```javascript
const subs = subscriberTable.get(topic) || new Set();
```

**동작**:
- `subscriberTable` Map에서 topic의 구독자 Set 조회
- 구독자가 없으면 빈 Set 생성 (방어 코드)

**예시**:
```javascript
// topic='users'의 구독자가 있는 경우
subscriberTable.get('users')
// => Set([
//      { instance: userTableComp, handler: renderTable },
//      { instance: userCountComp, handler: updateCount }
//    ])

// topic='unknown'의 구독자가 없는 경우
subscriberTable.get('unknown')
// => undefined
// || new Set() 로 빈 Set 반환
```

**왜 || new Set()인가?**
- 구독자가 없어도 안전하게 순회 가능
- 다음 for...of 루프에서 에러 방지

---

#### 5단계: 구독자에게 데이터 전파 (33-35줄)
```javascript
for (const { instance, handler } of subs) {
  handler.call(instance, data);
}
```

**동작**:
1. Set에서 구조 분해로 `{ instance, handler }` 추출
2. `handler.call(instance, data)`로 호출
   - `call()`의 첫 번째 인자: `this` 바인딩 대상
   - `call()`의 두 번째 인자: 핸들러에 전달할 데이터

**왜 .call(instance, data)를 사용하는가?**
- 핸들러 함수 내부에서 `this`가 컴포넌트 인스턴스를 가리키도록 함
- 핸들러에서 `this.element`, `this.name` 등 접근 가능

**예시**:
```javascript
// 구독자 1: userTableComponent
{
  instance: userTableComponent,
  handler: function renderTable(data) {
    console.log(this.name);  // 'UserTableComponent'
    this.element.innerHTML = data.map(user => `<div>${user.name}</div>`).join('');
  }
}

// 호출: handler.call(userTableComponent, data)
// => renderTable 내부에서 this = userTableComponent
// => this.name, this.element 접근 가능
```

**전파 순서**:
```javascript
// Set 순회 순서는 삽입 순서 보장 (ES6 명세)
subscriberTable.get('users') = Set([
  { instance: comp1, handler: handler1 },  // 첫 번째 구독
  { instance: comp2, handler: handler2 },  // 두 번째 구독
])

// 순차 호출
handler1.call(comp1, data)  // 1번
handler2.call(comp2, data)  // 2번
```

**동기 호출의 의미**:
- 모든 핸들러가 순차적으로 실행됨
- 핸들러가 비동기 작업을 포함해도 기다리지 않음
- 각 핸들러는 독립적으로 데이터 처리

---

### 전체 흐름 예시

```javascript
// 1. 페이지에서 매핑 등록
GlobalDataPublisher.registerMapping({
  topic: 'users',
  datasetInfo: {
    datasetName: 'myapi',
    param: { endpoint: '/users', limit: 20 }
  }
});
// => mappingTable.set('users', { datasetName: 'myapi', param: {...} })

// 2. 컴포넌트에서 구독
GlobalDataPublisher.subscribe('users', userTableComp, renderTable);
GlobalDataPublisher.subscribe('users', userCountComp, updateCount);
// => subscriberTable.set('users', Set([
//      { instance: userTableComp, handler: renderTable },
//      { instance: userCountComp, handler: updateCount }
//    ]))

// 3. 데이터 fetch & 발행
await GlobalDataPublisher.fetchAndPublish('users', page);

// 내부 동작:
// 1) mappingTable.get('users')
//    => { datasetName: 'myapi', param: { endpoint: '/users', limit: 20 } }
//
// 2) param 병합 (paramUpdates = null)
//    => param = { endpoint: '/users', limit: 20 }
//
// 3) await WKit.fetchData(page, 'myapi', { endpoint: '/users', limit: 20 })
//    => data = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
//
// 4) subscriberTable.get('users')
//    => Set([
//         { instance: userTableComp, handler: renderTable },
//         { instance: userCountComp, handler: updateCount }
//       ])
//
// 5) 구독자에게 전파
//    - renderTable.call(userTableComp, data)
//      => userTableComp의 테이블 렌더링
//    - updateCount.call(userCountComp, data)
//      => userCountComp의 카운트 업데이트

// 4. 동적 필터 변경 (v1.2)
await GlobalDataPublisher.fetchAndPublish('users', page, { limit: 50 });
// => param 병합: { endpoint: '/users', limit: 50 }
// => 새 데이터로 모든 구독자에게 재전파
```

---

## 사용 패턴

### 패턴 1: 초기 데이터 로드
```javascript
// Page - loaded
this.globalDataMappings = [
  { topic: 'users', datasetInfo: { datasetName: 'api', param: {...} } }
];

fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```

### 패턴 2: 동적 필터링
```javascript
// Page - before_load
this.eventBusHandlers = {
  '@filterChanged': ({ status }) => {
    // limit은 유지하고 status만 변경
    GlobalDataPublisher.fetchAndPublish('users', this, { status });
  }
};
```

### 패턴 3: Auto-Refresh
```javascript
// Page - loaded
this.refreshIntervals = {};
fx.go(
  this.globalDataMappings,
  fx.each(({ topic, refreshInterval = 5000 }) => {
    this.refreshIntervals[topic] = setInterval(() => {
      GlobalDataPublisher.fetchAndPublish(topic, this);
    }, refreshInterval);
  })
);
```

---

## 메모리 관리

### 구독 해제 필요성
- 컴포넌트 destroy 시 구독 해제하지 않으면 **메모리 누수**
- `subscriberTable`에 죽은 인스턴스 참조 유지
- 페이지 전환 후에도 핸들러 호출 시도 (에러)

### 올바른 정리 패턴
```javascript
// Component - destroy
function clearSubscribe(instance) {
  fx.go(
    Object.entries(instance.subscriptions),
    fx.each(([topic, _]) => GlobalDataPublisher.unsubscribe(topic, instance))
  );
}
```

---

## 설계 의도

### 왜 Topic 기반인가?
- **의미론적 그룹화**: 'users', 'products' 등 비즈니스 개념 중심
- **1:N 관계**: 하나의 topic에 여러 컴포넌트 구독 가능
- **느슨한 결합**: 발행자와 구독자가 서로 몰라도 됨

### 왜 Set<Subscriber>인가?
- **중복 구독 방지**: 동일한 instance+handler 조합 차단
- **순서 보장**: 삽입 순서대로 핸들러 호출

### 왜 paramUpdates를 분리했는가? (v1.2)
- **원본 보존**: `mappingTable`의 datasetInfo는 불변
- **동적 변경**: 필터/검색 조건만 일시적으로 변경
- **재사용성**: 기본 설정은 유지하고 필요시만 변경

---

## 제약사항

### 1. 얕은 병합만 지원
```javascript
// ❌ 중첩 객체는 덮어씀
datasetInfo.param = { filter: { age: 30, city: 'Seoul' } }
paramUpdates = { filter: { age: 25 } }
// => { filter: { age: 25 } }  // city 손실
```

### 2. 동기 핸들러 호출
```javascript
// 핸들러가 비동기여도 기다리지 않음
handler: async function(data) {
  await heavyOperation(data);  // 기다리지 않음
}
```

### 3. 에러 전파 없음
```javascript
// 한 핸들러에서 에러가 나도 다른 핸들러는 계속 실행
handler1: (data) => { throw new Error('boom'); }  // 에러
handler2: (data) => { console.log(data); }        // 정상 실행
```

---

## 디버깅 팁

### mappingTable 확인
```javascript
// 브라우저 콘솔에서 (디버깅 모드 시)
console.log(GlobalDataPublisher._debug_mappingTable);
// => Map { 'users' => {...}, 'products' => {...} }
```

### subscriberTable 확인
```javascript
console.log(GlobalDataPublisher._debug_subscriberTable);
// => Map {
//      'users' => Set([...]),
//      'products' => Set([...])
//    }
```

### 구독자 수 확인
```javascript
const subs = GlobalDataPublisher._debug_subscriberTable.get('users');
console.log(`'users' topic 구독자 수: ${subs?.size || 0}`);
```

---

## 버전 정보

**문서 버전**: 1.0.0
**최종 업데이트**: 2025-11-20
**관련 파일**: `Utils/GlobalDataPublisher.js:1-63`
