# GlobalDataPublisher

## 개요

Topic 기반 Pub-Sub 패턴으로 페이지 레벨 데이터를 여러 컴포넌트에게 공유하는 시스템입니다.

---

## 핵심 개념

### Topic-based Data Sharing

```
[Page]
  ↓ registerMapping({ topic, datasetInfo })
  ↓ fetchAndPublish(topic, page)

[GlobalDataPublisher]
  ↓ WKit.fetchData()
  ↓ 데이터 획득
  ↓ 모든 구독자에게 전파

[Components]
  ↓ subscribe(topic, instance, handler)
  ↓ handler 자동 호출
```

**특징**:
- 페이지 레벨에서 한 번 fetch → 여러 컴포넌트 공유
- 중복 API 호출 방지
- 중앙 집중식 데이터 관리

---

## API

### 1. registerMapping

**Topic과 데이터셋 정보 등록**

```javascript
GlobalDataPublisher.registerMapping({ topic, datasetInfo })
```

**파라미터**:
- `topic`: 문자열 식별자 (예: `'users'`, `'products'`)
- `datasetInfo`: 데이터셋 정보 객체
  - `datasetName`: 데이터셋 이름
  - `param`: fetch 파라미터

**반환**: `{ topic, datasetInfo }`

**예시**:
```javascript
// Page - before_load
registerMapping({
    topic: 'users',
    datasetInfo: {
        datasetName: 'myapi',
        param: { period: 'monthly', limit: 20 }
    }
});
```

---

### 2. fetchAndPublish

**데이터 fetch 및 구독자에게 발행**

```javascript
GlobalDataPublisher.fetchAndPublish(topic, page, paramUpdates = null)
```

**파라미터**:
- `topic`: 등록된 topic 이름
- `page`: 페이지 인스턴스 (WKit.fetchData에 필요)
- `paramUpdates` (선택): param 병합 객체

**동작**:
1. mappingTable에서 datasetInfo 조회
2. paramUpdates가 있으면 기존 param과 **얕은 병합**
3. WKit.fetchData() 호출
4. 모든 구독자의 handler 호출

**예시**:
```javascript
// 기본 param 사용
fetchAndPublish('users', this);
// → param: { period: 'monthly', limit: 20 }

// param 병합 (period만 변경)
fetchAndPublish('users', this, { period: 'weekly' });
// → param: { period: 'weekly', limit: 20 }

// param 병합 (여러 필드)
fetchAndPublish('users', this, { period: 'daily', offset: 10 });
// → param: { period: 'daily', limit: 20, offset: 10 }
```

**param 병합 규칙**:
- **얕은 병합(shallow merge)**: `{ ...datasetInfo.param, ...paramUpdates }`
- 기존 param 유지하며 일부만 변경 가능
- null/undefined로 필드 제거 불가 (덮어씀)

---

### 3. subscribe

**컴포넌트가 topic 구독**

```javascript
GlobalDataPublisher.subscribe(topic, instance, handler)
```

**파라미터**:
- `topic`: 구독할 topic 이름
- `instance`: 컴포넌트 인스턴스 (this)
- `handler`: 데이터 수신 시 호출될 함수

**예시**:
```javascript
// Component - register
subscribe('users', this, this.renderTable);

function renderTable(data) {
    console.log('Users data received:', data);
    // 테이블 렌더링 로직
}
```

---

### 4. unsubscribe

**구독 해제**

```javascript
GlobalDataPublisher.unsubscribe(topic, instance)
```

**파라미터**:
- `topic`: 구독 해제할 topic
- `instance`: 컴포넌트 인스턴스

**예시**:
```javascript
// Component - destroy
unsubscribe('users', this);
```

---

### 5. unregisterMapping

**Topic 매핑 제거**

```javascript
GlobalDataPublisher.unregisterMapping(topic)
```

**파라미터**:
- `topic`: 제거할 topic 이름

**예시**:
```javascript
// Page - before_unload
fx.go(
    this.globalDataMappings,
    map(({ topic }) => topic),
    each(GlobalDataPublisher.unregisterMapping)
);
```

---

## 사용 패턴

### 기본 패턴

```javascript
// Page - before_load (매핑 등록 및 초기 fetch)
this.globalDataMappings = [
    {
        topic: 'users',
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', limit: 20 }
        }
    }
];

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// Component - register (구독)
const { subscribe } = GlobalDataPublisher;

this.subscriptions = {
    users: ['renderTable', 'updateCount']
};

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

this.renderTable = renderTable.bind(this);
this.updateCount = updateCount.bind(this);

function renderTable(data) {
    console.log('Rendering table with:', data);
}

function updateCount(data) {
    console.log('User count:', data.length);
}

// Component - destroy (구독 해제)
unsubscribe('users', this);

// Page - before_unload (매핑 제거)
fx.go(
    this.globalDataMappings,
    map(({ topic }) => topic),
    each(GlobalDataPublisher.unregisterMapping)
);
```

---

## 대시보드 패턴 (동적 param + 자동 갱신)

### 시나리오
- 주기적으로 데이터 갱신 (setInterval)
- 필터 변경 시 즉시 갱신
- clearInterval 없이 param만 변경

### 구현

```javascript
// Page - loaded
this.globalDataMappings = [
    {
        topic: 'users',
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', limit: 20 }
        }
    },
    {
        topic: 'sales',
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', metric: 'revenue' }
        }
    }
];

// 매핑 등록
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping)
);

// 현재 param 상태 (동적 변경용)
this.currentParams = {
    users: {},
    sales: {}
};

// 초기 fetch
fx.go(
    this.globalDataMappings,
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// 자동 갱신 (5초마다)
this.refreshInterval = setInterval(() => {
    GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
    GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
}, 5000);

// Page - before_load (필터 변경 핸들러)
this.eventBusHandlers = {
    // 모든 topic에 적용되는 필터
    '@periodFilterChanged': ({ period }) => {
        // 상태 업데이트
        this.currentParams.users = { period };
        this.currentParams.sales = { period };

        // 즉시 갱신
        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);

        // interval은 계속 실행되며 변경된 currentParams 사용 ✅
    },

    // users만 해당하는 필터
    '@userLimitChanged': ({ limit }) => {
        this.currentParams.users = { ...this.currentParams.users, limit };
        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
    },

    // sales만 해당하는 필터
    '@salesMetricChanged': ({ metric }) => {
        this.currentParams.sales = { ...this.currentParams.sales, metric };
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
    }
};

onEventBusHandlers(this.eventBusHandlers);

// Page - before_unload
clearInterval(this.refreshInterval);
this.refreshInterval = null;
this.currentParams = null;

fx.go(
    this.globalDataMappings,
    map(({ topic }) => topic),
    each(GlobalDataPublisher.unregisterMapping)
);
this.globalDataMappings = null;
```

---

## param 병합 상세

### 병합 동작

```javascript
// 등록된 param
registerMapping({
    topic: 'users',
    datasetInfo: {
        datasetName: 'api',
        param: { period: 'monthly', limit: 20, sort: 'name' }
    }
});

// 병합 예시
fetchAndPublish('users', this, { period: 'weekly' });
// 최종 param: { period: 'weekly', limit: 20, sort: 'name' }

fetchAndPublish('users', this, { limit: 50, offset: 10 });
// 최종 param: { period: 'monthly', limit: 50, sort: 'name', offset: 10 }

fetchAndPublish('users', this);
// 최종 param: { period: 'monthly', limit: 20, sort: 'name' } (원본)
```

### 제약사항

**얕은 병합(shallow merge)만 지원**:

```javascript
// 등록된 param
param: {
    period: 'monthly',
    filters: { status: 'active', role: 'admin' }
}

// 얕은 병합
fetchAndPublish('users', this, { filters: { status: 'inactive' } });
// 최종 param: {
//     period: 'monthly',
//     filters: { status: 'inactive' }  // role이 사라짐! ❌
// }

// 해결: 명시적으로 전체 객체 전달
fetchAndPublish('users', this, {
    filters: { status: 'inactive', role: 'admin' }
});
// 최종 param: {
//     period: 'monthly',
//     filters: { status: 'inactive', role: 'admin' }  // ✅
// }
```

---

## 베스트 프랙티스

### ✅ DO

```javascript
// 1. 명확한 topic 이름
registerMapping({ topic: 'userList', datasetInfo: {...} });  // ✅

// 2. 초기 param은 기본값
param: { period: 'monthly', limit: 20 }  // ✅

// 3. currentParams로 상태 관리 (대시보드)
this.currentParams = { users: {}, sales: {} };  // ✅

// 4. interval에서 currentParams 참조
setInterval(() => {
    fetchAndPublish('users', this, this.currentParams.users);
}, 5000);  // ✅

// 5. 필터 변경 시 상태 업데이트 + 즉시 갱신
this.currentParams.users = { period: 'weekly' };
fetchAndPublish('users', this, this.currentParams.users);  // ✅

// 6. before_unload에서 정리
clearInterval(this.refreshInterval);
unregisterMapping('users');  // ✅
```

### ❌ DON'T

```javascript
// 1. 모호한 topic 이름
registerMapping({ topic: 'data', datasetInfo: {...} });  // ❌

// 2. interval마다 새로운 객체 생성
setInterval(() => {
    fetchAndPublish('users', this, { period: 'monthly' });  // ❌ 매번 같은 객체
}, 5000);

// 3. 필터 변경 시 clearInterval + 재설정
clearInterval(this.refreshInterval);  // ❌ 불필요
this.refreshInterval = setInterval(...);

// 4. mappingTable 직접 조작
GlobalDataPublisher.mappingTable.set(...);  // ❌ private

// 5. cleanup 누락
// ❌ interval, mapping 정리 안함
```

---

## 내부 구조

```javascript
const GlobalDataPublisher = (() => {
  const mappingTable = new Map();      // topic → datasetInfo
  const subscriberTable = new Map();   // topic → Set<{instance, handler}>

  return {
    registerMapping({ topic, datasetInfo }) {
      mappingTable.set(topic, datasetInfo);
    },

    async fetchAndPublish(topic, page, paramUpdates = null) {
      const datasetInfo = mappingTable.get(topic);

      // param 병합
      const param = paramUpdates
        ? { ...datasetInfo.param, ...paramUpdates }
        : datasetInfo.param;

      const data = await WKit.fetchData(page, datasetInfo.datasetName, param);
      const subs = subscriberTable.get(topic) || new Set();

      // 모든 구독자에게 전파
      for (const { instance, handler } of subs) {
        handler.call(instance, data);
      }
    },

    subscribe(topic, instance, handler) {
      if (!subscriberTable.has(topic)) subscriberTable.set(topic, new Set());
      subscriberTable.get(topic).add({ instance, handler });
    },

    // ...
  };
})();
```

---

## 트러블슈팅

### 데이터가 전파되지 않는 경우

**체크리스트**:
1. ✅ registerMapping 호출 여부
2. ✅ subscribe 호출 여부 (컴포넌트)
3. ✅ fetchAndPublish 호출 여부
4. ✅ topic 이름 일치 여부
5. ✅ handler 바인딩 (`.bind(this)`)

### param 병합이 예상과 다른 경우

**원인**: 얕은 병합으로 중첩 객체가 덮어씌워짐

**해결**:
```javascript
// 중첩 객체는 명시적으로 전체 전달
fetchAndPublish('users', this, {
    filters: { ...existingFilters, status: 'inactive' }
});
```

### interval이 멈추는 경우

**원인**: clearInterval 호출됨

**해결**: currentParams 상태 관리 패턴 사용 (clearInterval 불필요)

---

## 참고 자료

**관련 파일**:
- `Utils/GlobalDataPublisher.js` - 구현
- `Runtime_Scaffold_code_sample/page_script/page_loaded.js` - 기본 패턴
- `Runtime_Scaffold_code_sample/page_script/page_loaded_dashboard.js` - 대시보드 패턴
- `Runtime_Scaffold_code_sample/component_script/component_common_register_subscribe_page.js` - 구독 패턴

**핵심 함수**:
- `registerMapping({ topic, datasetInfo })` - 매핑 등록
- `fetchAndPublish(topic, page, paramUpdates)` - 데이터 발행
- `subscribe(topic, instance, handler)` - 구독
- `unsubscribe(topic, instance)` - 구독 해제
- `unregisterMapping(topic)` - 매핑 제거

---

## 버전 정보

**버전**: 1.1.0
**최종 업데이트**: 2025-11-19
**주요 변경사항**:
- v1.1.0: `fetchAndPublish`에 `paramUpdates` 파라미터 추가 (param 병합 지원)
- v1.0.0: 초기 구현

**작성자**: Claude Code Analysis
