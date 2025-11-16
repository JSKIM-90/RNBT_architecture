# WKit Helper Functions

간단하지만 자주 사용되는 유틸리티 함수들입니다.

---

## WKit.getInstanceByName

### 위치
`WKit.js:126-128`

### 시그니처
```javascript
WKit.getInstanceByName(instanceName: string, iter: Iterator<Instance>): Instance | undefined
```

### 역할
Iterator에서 name이 일치하는 첫 번째 인스턴스를 찾습니다.

### 필요성
⭐⭐⭐⭐⭐ 매우 자주 사용

### 사용 예시
```javascript
const chart = WKit.getInstanceByName(
  'ProductChart',
  WKit.makeIterator(page)
);

if (chart) {
  // 차트 업데이트
}
```

### 구현
```javascript
WKit.getInstanceByName = function (instanceName, iter) {
  return fx.find((ins) => ins.name === instanceName, iter);
};
```

### 잘된 점 ✅
- **간결함**: fx.find 활용으로 1줄 구현
- **Lazy evaluation**: iterator 전체 순회하지 않음 (첫 매칭에서 중단)

### 개선점 ⚠️

#### 1. 파라미터 검증 없음
```javascript
// 개선안
WKit.getInstanceByName = function (instanceName, iter) {
  if (!instanceName) {
    console.warn('[WKit.getInstanceByName] instanceName is required');
    return undefined;
  }

  if (!iter) {
    console.warn('[WKit.getInstanceByName] iterator is required');
    return undefined;
  }

  return fx.find((ins) => ins?.name === instanceName, iter);
};
```

#### 2. 대소문자 구분
```javascript
// 대소문자 무시 옵션 추가
WKit.getInstanceByName = function (instanceName, iter, { caseSensitive = true } = {}) {
  if (!instanceName) return undefined;

  if (caseSensitive) {
    return fx.find((ins) => ins?.name === instanceName, iter);
  } else {
    const lowerName = instanceName.toLowerCase();
    return fx.find((ins) => ins?.name?.toLowerCase() === lowerName, iter);
  }
};
```

---

## WKit.getInstanceById

### 위치
`WKit.js:130-132`

### 시그니처
```javascript
WKit.getInstanceById(targetId: string, iter: Iterator<Instance>): Instance | undefined
```

### 역할
Iterator에서 id가 일치하는 첫 번째 인스턴스를 찾습니다.

### 필요성
⭐⭐⭐⭐ 자주 사용

### 사용 예시
```javascript
const instance = WKit.getInstanceById(
  'comp-12345',
  WKit.makeIterator(page)
);
```

### 구현
```javascript
WKit.getInstanceById = function (targetId, iter) {
  return fx.find((ins) => ins.id === targetId, iter);
};
```

### 잘된 점 ✅
- **간결함**: fx.find 활용
- **ID는 고유**: 첫 매칭에서 바로 반환

### 개선점 ⚠️

#### 1. getInstanceByName과 동일한 개선 필요
```javascript
WKit.getInstanceById = function (targetId, iter) {
  if (!targetId) {
    console.warn('[WKit.getInstanceById] targetId is required');
    return undefined;
  }

  if (!iter) {
    console.warn('[WKit.getInstanceById] iterator is required');
    return undefined;
  }

  return fx.find((ins) => ins?.id === targetId, iter);
};
```

---

## WKit.fetchData

### 위치
`WKit.js:134-141`

### 시그니처
```javascript
WKit.fetchData(page: Page, datasetName: string, param: Object): Promise<any>
```

### 역할
페이지의 dataService를 통해 데이터셋에서 데이터를 fetch합니다.

### 필요성
⭐⭐⭐⭐⭐ 매우 필요함 (데이터 매핑 핵심)

### 사용 예시
```javascript
const data = await WKit.fetchData(
  page,
  'dummyjson',
  { dataType: 'products', id: 1 }
);

console.log(data);
```

### 구현
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

### 잘된 점 ✅
- **Promise 래핑**: dataService의 이벤트 기반 API를 Promise로 변환
- **에러 처리**: error 이벤트를 reject로 전달

### 개선점 ⚠️

#### 1. page.dataService 존재 확인 없음
**현재 코드**:
```javascript
page.dataService.call(...)  // page 또는 dataService가 null이면 에러
```

**개선안**:
```javascript
WKit.fetchData = function (page, datasetName, param) {
  if (!page || !page.dataService) {
    return Promise.reject(new Error('page.dataService is not available'));
  }

  if (!datasetName) {
    return Promise.reject(new Error('datasetName is required'));
  }

  return new Promise((res, rej) => {
    page.dataService
      .call(datasetName, { param })
      .on('success', (data) => res(data))
      .on('error', (err) => rej(err));
  });
};
```

#### 2. 타임아웃 없음
**문제점**:
- 데이터 fetch가 무한정 대기할 수 있음
- 네트워크 문제 시 응답 없음

**개선안**:
```javascript
WKit.fetchData = function (page, datasetName, param, timeout = 30000) {
  if (!page || !page.dataService) {
    return Promise.reject(new Error('page.dataService is not available'));
  }

  return new Promise((res, rej) => {
    let timeoutId;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    // 타임아웃 설정
    timeoutId = setTimeout(() => {
      cleanup();
      rej(new Error(`fetchData timeout after ${timeout}ms`));
    }, timeout);

    page.dataService
      .call(datasetName, { param })
      .on('success', (data) => {
        cleanup();
        res(data);
      })
      .on('error', (err) => {
        cleanup();
        rej(err);
      });
  });
};
```

#### 3. 중복 이벤트 리스너
**문제점**:
- dataService.call()이 EventEmitter라면 이벤트 리스너가 누적될 수 있음
- once() 사용이 더 안전

**개선안** (dataService가 once 지원한다면):
```javascript
WKit.fetchData = function (page, datasetName, param) {
  if (!page || !page.dataService) {
    return Promise.reject(new Error('page.dataService is not available'));
  }

  return new Promise((res, rej) => {
    const service = page.dataService.call(datasetName, { param });

    // once 사용 (지원한다면)
    if (service.once) {
      service
        .once('success', (data) => res(data))
        .once('error', (err) => rej(err));
    } else {
      service
        .on('success', (data) => res(data))
        .on('error', (err) => rej(err));
    }
  });
};
```

---

## 통합 개선안

### 개선된 Helper Functions
```javascript
// getInstanceByName
WKit.getInstanceByName = function (instanceName, iter, options = {}) {
  if (!instanceName) {
    console.warn('[WKit.getInstanceByName] instanceName is required');
    return undefined;
  }

  if (!iter) {
    console.warn('[WKit.getInstanceByName] iterator is required');
    return undefined;
  }

  const { caseSensitive = true } = options;

  if (caseSensitive) {
    return fx.find((ins) => ins?.name === instanceName, iter);
  } else {
    const lowerName = instanceName.toLowerCase();
    return fx.find((ins) => ins?.name?.toLowerCase() === lowerName, iter);
  }
};

// getInstanceById
WKit.getInstanceById = function (targetId, iter) {
  if (!targetId) {
    console.warn('[WKit.getInstanceById] targetId is required');
    return undefined;
  }

  if (!iter) {
    console.warn('[WKit.getInstanceById] iterator is required');
    return undefined;
  }

  return fx.find((ins) => ins?.id === targetId, iter);
};

// fetchData
WKit.fetchData = function (page, datasetName, param, timeout = 30000) {
  if (!page || !page.dataService) {
    return Promise.reject(new Error('[WKit.fetchData] page.dataService is not available'));
  }

  if (!datasetName) {
    return Promise.reject(new Error('[WKit.fetchData] datasetName is required'));
  }

  return new Promise((res, rej) => {
    let timeoutId;
    let resolved = false;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    const resolve = (data) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      res(data);
    };

    const reject = (err) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      rej(err);
    };

    // 타임아웃 설정
    timeoutId = setTimeout(() => {
      reject(new Error(`[WKit.fetchData] timeout after ${timeout}ms for ${datasetName}`));
    }, timeout);

    try {
      page.dataService
        .call(datasetName, { param })
        .on('success', resolve)
        .on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
};
```

---

## 테스트 시나리오

### getInstanceByName
```javascript
// 1. 정상 케이스
const iter = WKit.makeIterator(page);
const comp = WKit.getInstanceByName('ProductCard', iter);
// comp: { id: ..., name: 'ProductCard', ... }

// 2. 없는 이름
const notFound = WKit.getInstanceByName('NotExist', iter);
// notFound: undefined

// 3. 대소문자 무시 (개선 후)
const comp2 = WKit.getInstanceByName('productcard', iter, { caseSensitive: false });
// comp2: { name: 'ProductCard', ... }

// 4. null 파라미터
const invalid = WKit.getInstanceByName(null, iter);
// 현재: 에러 또는 undefined
// 개선 후: 경고 로그 + undefined
```

### getInstanceById
```javascript
// 1. 정상 케이스
const comp = WKit.getInstanceById('comp-12345', WKit.makeIterator(page));
// comp: { id: 'comp-12345', ... }

// 2. 없는 ID
const notFound = WKit.getInstanceById('invalid-id', WKit.makeIterator(page));
// notFound: undefined
```

### fetchData
```javascript
// 1. 정상 케이스
const data = await WKit.fetchData(page, 'dummyjson', {
  dataType: 'products',
  id: 1
});
// data: [{ id: 1, title: '...', ... }]

// 2. 에러 케이스
try {
  await WKit.fetchData(page, 'invalid-dataset', {});
} catch (err) {
  console.error(err);  // dataService error 이벤트
}

// 3. 타임아웃 (개선 후)
try {
  await WKit.fetchData(page, 'slow-api', {}, 5000);  // 5초 타임아웃
} catch (err) {
  console.error(err);  // "timeout after 5000ms"
}

// 4. page 없음
try {
  await WKit.fetchData(null, 'dataset', {});
} catch (err) {
  console.error(err);  // "page.dataService is not available"
}
```

---

## 실제 사용 흐름

### 컴포넌트 찾아서 데이터 업데이트
```javascript
// 1. 이름으로 찾기
const chart = WKit.getInstanceByName(
  'SalesChart',
  WKit.makeIterator(page)
);

if (chart) {
  // 2. 데이터 fetch
  const salesData = await WKit.fetchData(page, 'analytics', {
    type: 'sales',
    period: 'monthly'
  });

  // 3. 차트 업데이트
  chart.updateData(salesData);
}
```

### 여러 컴포넌트 일괄 업데이트
```javascript
const targetNames = ['Chart1', 'Chart2', 'Chart3'];

for (const name of targetNames) {
  const comp = WKit.getInstanceByName(name, WKit.makeIterator(page));

  if (comp && comp.refresh) {
    const data = await WKit.fetchData(page, comp.datasetName, comp.params);
    comp.refresh(data);
  }
}
```

### ID 기반 직접 접근
```javascript
// URL 파라미터에서 컴포넌트 ID 가져오기
const compId = new URLSearchParams(window.location.search).get('compId');

if (compId) {
  const instance = WKit.getInstanceById(compId, WKit.makeIterator(page));
  if (instance) {
    // 특정 컴포넌트로 스크롤
    instance.element.scrollIntoView({ behavior: 'smooth' });
  }
}
```

---

## 개선 우선순위

### getInstanceByName & getInstanceById
1. **Medium**: 파라미터 검증
2. **Low**: 대소문자 무시 옵션 (getInstanceByName)

### fetchData
1. **High**: page.dataService 존재 확인
2. **Medium**: 타임아웃 구현
3. **Low**: 중복 resolve/reject 방지
