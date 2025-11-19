# ~~WKit.pipeForDataMapping~~ (DEPRECATED)

> **⚠️ 이 API는 v1.1.0에서 제거되었습니다**
>
> **제거 이유**: Primitive Building Blocks 원칙 적용
> - 프레임워크는 비즈니스 로직 조합을 제공하지 않음
> - 사용자가 primitive(`fetchData`, `getInstanceByName`)를 직접 조합하도록 변경
>
> **대안**: 아래 "제거 후 사용 방법" 참고

## 위치
~~`WKit.js:4-11`~~ - **제거됨**

## 시그니처
```javascript
WKit.pipeForDataMapping(targetInstance: Instance): Promise<MappingResult[]>
```

## 역할 (제거 전)
컴포넌트(targetInstance)의 데이터 매핑 설정을 읽어, 각 매핑에 대해:
1. 데이터셋에서 데이터를 fetch
2. 시각화할 컴포넌트 인스턴스들을 찾아서 매핑
3. 결과를 Promise로 반환

## 제거 이유

### 1. 비즈니스 로직의 조합
프레임워크가 "어떻게 조합할지"를 강제했습니다. 사용자가 필요한 부분만 선택적으로 사용할 수 없었습니다.

### 2. 불필요한 추상화
`visualInstanceList` 매핑 기능이 실제로 사용되지 않았습니다. 대부분 `data`만 필요했습니다.

### 3. 명확성 저하
내부에서 여러 primitive를 숨김 (`fetchData`, `getInstanceByName`, `makeIterator`, `resolveMappingInfo`, `getDataFromMapping`).

### 4. 유연성 부족
사용자가 데이터를 어떻게 처리할지 자유롭게 결정할 수 없었습니다.

## 제거 후 사용 방법

### Before (제거 전)
```javascript
const results = await WKit.pipeForDataMapping(targetInstance);
console.log(results[0].data);
```

### After (제거 후)
```javascript
// primitive 조합으로 명확한 흐름
const { dataMapping } = targetInstance;
const { datasetName, param } = dataMapping[0].datasetInfo;
const data = await WKit.fetchData(this, datasetName, param);
console.log(data);
```

### 장점
- ✅ 코드 흐름이 명확해짐
- ✅ 사용자가 필요한 만큼만 사용
- ✅ 디버깅 용이
- ✅ 프레임워크 API 표면 최소화

## 제거된 Internal 함수들

### resolveMappingInfo(targetInstance)
- targetInstance에서 dataMapping 추출
- 대안: `targetInstance.dataMapping` 직접 접근

### getDataFromMapping(mappingInfo)
- 데이터 fetch + 인스턴스 검색 + 결과 조합
- 대안: 필요한 primitive만 직접 조합

---

## 과거 필요성 평가 (참고용)
**매우 필요함** ⭐⭐⭐⭐⭐ → **불필요** ❌

**과거 이유**:
- 사용자가 에디터에서 "이 차트는 이 데이터를 보여줘"라고 선언적으로 설정하면, 런타임에서 자동으로 데이터를 가져와 연결해야 함
- 이벤트 핸들러에서 데이터를 가져올 때 일관된 방법 제공
- 데이터 소스와 시각화 레이어 분리로 유지보수성 향상

**재평가**:
- primitive 조합으로 더 명확하고 유연하게 달성 가능

## 사용 예시
```javascript
// Page - loaded (이벤트 핸들러)
this.eventBusHandlers = {
  '@myClickEvent': async ({ event, targetInstance }) => {
    // targetInstance의 dataMapping 설정에 따라 데이터 fetch
    const mappingResults = await WKit.pipeForDataMapping(targetInstance);

    // mappingResults 구조:
    // [
    //   {
    //     ownerId: 'component-123',
    //     visualInstanceList: [ChartComponentInstance, TableComponentInstance],
    //     data: [...fetched data...]
    //   }
    // ]

    console.log('Fetched data:', mappingResults);
  }
};
```

## 데이터 흐름
```
targetInstance (dataMapping 속성 보유)
  ↓
resolveMappingInfo() - 매핑 정보 추출
  ↓
fx.map(getDataFromMapping) - 각 매핑에 대해:
  ↓
  ├─ WKit.fetchData() - 데이터셋에서 데이터 fetch
  ├─ WKit.getInstanceByName() - 시각화 컴포넌트 찾기
  └─ 결과 객체 생성 {ownerId, visualInstanceList, data}
  ↓
Promise<MappingResult[]> 반환
```

## 구현 분석

### 잘된 점 ✅
1. **비동기 처리**: Promise 기반으로 안정적인 비동기 처리
2. **함수형 파이프라인**: `fx.go`와 `fx.map`으로 데이터 변환 과정이 명확
3. **컨텍스트 전달**: `getDataFromMapping.bind(currentPage)`로 페이지 컨텍스트를 명시적으로 전달
4. **페이지 자동 해결**: targetInstance가 페이지면 그대로, 컴포넌트면 `.page`로 자동 추출
5. **에러 핸들링**: catch를 통한 에러 처리

### 개선점 ⚠️

#### 1. 불필요한 Promise 래핑
**현재 코드**:
```javascript
WKit.pipeForDataMapping = function (targetInstance) {
  const currentPage = wemb.isPage(targetInstance) ? targetInstance : targetInstance.page;
  return new Promise((res, rej) => {
    fx.go(resolveMappingInfo(targetInstance), fx.map(getDataFromMapping.bind(currentPage)))
      .then(res)
      .catch(rej);
  });
};
```

**문제점**:
- `getDataFromMapping`이 async 함수이므로 `fx.go`가 이미 Promise를 반환
- `new Promise`로 한번 더 래핑할 필요 없음
- `.then(res).catch(rej)` 패턴은 그냥 Promise를 그대로 반환하는 것과 동일

**개선안**:
```javascript
WKit.pipeForDataMapping = function (targetInstance) {
  const currentPage = wemb.isPage(targetInstance) ? targetInstance : targetInstance.page;
  return fx.go(
    resolveMappingInfo(targetInstance),
    fx.map(getDataFromMapping.bind(currentPage))
  );
};
```

#### 2. resolveMappingInfo의 로직 버그
**현재 코드** (`WKit.js:255-268`):
```javascript
function resolveMappingInfo(targetInstance) {
  let dataMapping = [];

  if (!dataMapping.length && targetInstance.dataMapping) {
    dataMapping = targetInstance.dataMapping;
    console.info('[Fallback] instance.dataMapping 사용됨');
  }

  if (!dataMapping.length) {
    throw new Error(`매핑 정보가 없습니다. instanceId: ${targetInstance.id}`);
  }

  return dataMapping;
}
```

**문제점**:
- `dataMapping`을 빈 배열로 초기화한 후 `!dataMapping.length` 체크는 항상 true
- '[Fallback]' 로그 메시지가 혼란스러움 (실제로는 항상 여기서 가져옴)
- 첫 번째 if문의 `!dataMapping.length` 조건이 무의미함

**원래 의도 추측**:
아마도 다른 소스에서 먼저 매핑 정보를 찾고, 없을 때만 instance.dataMapping을 사용하려 했던 것으로 보임

**개선안 1** (현재 동작 유지):
```javascript
function resolveMappingInfo(targetInstance) {
  const dataMapping = targetInstance.dataMapping;

  if (!dataMapping || !dataMapping.length) {
    throw new Error(`매핑 정보가 없습니다. instanceId: ${targetInstance.id}`);
  }

  return dataMapping;
}
```

**개선안 2** (원래 의도대로 구현한다면):
```javascript
function resolveMappingInfo(targetInstance) {
  // 1순위: 페이지 레벨 글로벌 매핑 (존재한다면)
  let dataMapping = targetInstance.page?.globalDataMapping?.[targetInstance.id];

  // 2순위: 인스턴스 자체 매핑 (Fallback)
  if (!dataMapping || !dataMapping.length) {
    dataMapping = targetInstance.dataMapping;
    console.info('[Fallback] instance.dataMapping 사용됨');
  }

  if (!dataMapping || !dataMapping.length) {
    throw new Error(`매핑 정보가 없습니다. instanceId: ${targetInstance.id}`);
  }

  return dataMapping;
}
```

#### 3. getDataFromMapping의 this 의존성
**현재 코드** (`WKit.js:240-253`):
```javascript
async function getDataFromMapping({
  ownerId,
  visualInstanceList,
  datasetInfo: { datasetName, param },
}) {
  return {
    ownerId,
    visualInstanceList: fx.map(
      (visualInstanceName) => WKit.getInstanceByName(visualInstanceName, WKit.makeIterator(this)),
      visualInstanceList
    ),
    data: await WKit.fetchData(this, datasetName, param).catch((err) => (console.error(err), [])),
  };
}
```

**문제점**:
- `this` 컨텍스트에 의존 (`.bind(currentPage)`로 전달됨)
- 함수 시그니처만 봐서는 `this`가 필요한지 알 수 없음
- 테스트와 디버깅이 어려움

**개선안**:
```javascript
function getDataFromMapping(currentPage) {
  return async function({
    ownerId,
    visualInstanceList,
    datasetInfo: { datasetName, param },
  }) {
    return {
      ownerId,
      visualInstanceList: fx.map(
        (visualInstanceName) => WKit.getInstanceByName(visualInstanceName, WKit.makeIterator(currentPage)),
        visualInstanceList
      ),
      data: await WKit.fetchData(currentPage, datasetName, param).catch((err) => (console.error(err), [])),
    };
  };
}

// 사용
WKit.pipeForDataMapping = function (targetInstance) {
  const currentPage = wemb.isPage(targetInstance) ? targetInstance : targetInstance.page;
  return fx.go(
    resolveMappingInfo(targetInstance),
    fx.map(getDataFromMapping(currentPage))
  );
};
```

#### 4. 에러 처리 개선
**현재 코드**:
```javascript
data: await WKit.fetchData(this, datasetName, param).catch((err) => (console.error(err), []))
```

**문제점**:
- 에러를 조용히 삼킴 (빈 배열 반환)
- 사용자는 데이터 fetch 실패를 알 수 없음
- 디버깅 어려움

**개선안**:
```javascript
// 옵션 1: 에러 정보를 결과에 포함
data: await WKit.fetchData(currentPage, datasetName, param)
  .catch((err) => {
    console.error(`[WKit.pipeForDataMapping] 데이터 fetch 실패:`, err);
    return { error: err.message, data: [] };
  })

// 옵션 2: 에러를 상위로 전파 (사용자가 선택)
data: await WKit.fetchData(currentPage, datasetName, param)
```

#### 5. 타입 안전성 부족
**문제점**:
- visualInstanceList가 문자열 배열인지 검증 없음
- datasetInfo 구조 검증 없음
- 잘못된 데이터 구조 전달 시 런타임 에러

**개선안**:
```javascript
function validateMappingSchema(mapping) {
  if (!mapping.ownerId) {
    throw new Error('dataMapping.ownerId is required');
  }
  if (!Array.isArray(mapping.visualInstanceList)) {
    throw new Error('dataMapping.visualInstanceList must be an array');
  }
  if (!mapping.datasetInfo || !mapping.datasetInfo.datasetName) {
    throw new Error('dataMapping.datasetInfo.datasetName is required');
  }
  return mapping;
}

function resolveMappingInfo(targetInstance) {
  const dataMapping = targetInstance.dataMapping;

  if (!dataMapping || !dataMapping.length) {
    throw new Error(`매핑 정보가 없습니다. instanceId: ${targetInstance.id}`);
  }

  // 각 매핑 스키마 검증
  return dataMapping.map(validateMappingSchema);
}
```

## 개선 우선순위
1. **High**: resolveMappingInfo 로직 버그 수정
2. **Medium**: 불필요한 Promise 래핑 제거
3. **Medium**: getDataFromMapping의 this 의존성 제거
4. **Low**: 타입 검증 추가
5. **Low**: 에러 처리 개선

## 관련 함수
- `resolveMappingInfo()` - Internal (`WKit.js:255-268`)
- `getDataFromMapping()` - Internal (`WKit.js:240-253`)
- `WKit.fetchData()` - Public API (`WKit.js:134-141`)
- `WKit.makeIterator()` - Public API (`WKit.js:111-124`)
- `WKit.getInstanceByName()` - Public API (`WKit.js:126-128`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스
const instance = {
  id: 'chart-1',
  dataMapping: [
    {
      ownerId: 'chart-1',
      visualInstanceList: ['TableComponent'],
      datasetInfo: {
        datasetName: 'dummyjson',
        param: { dataType: 'carts', id: 1 }
      }
    }
  ],
  page: currentPage
};

const result = await WKit.pipeForDataMapping(instance);
// 예상: [{ ownerId: 'chart-1', visualInstanceList: [...], data: [...] }]

// 2. dataMapping 없는 경우
const instanceWithoutMapping = { id: 'test', page: currentPage };
await WKit.pipeForDataMapping(instanceWithoutMapping);
// 예상: Error('매핑 정보가 없습니다. instanceId: test')

// 3. 데이터 fetch 실패
const instanceWithBadDataset = {
  id: 'chart-2',
  dataMapping: [{
    ownerId: 'chart-2',
    visualInstanceList: [],
    datasetInfo: { datasetName: 'invalid', param: {} }
  }],
  page: currentPage
};

const result2 = await WKit.pipeForDataMapping(instanceWithBadDataset);
// 현재: result2[0].data === [] (에러 무시)
// 개선 후: 에러 정보 포함 또는 throw
```

---

## ⚠️ DEPRECATED 알림

**이 문서는 v1.1.0 (2025-11-19)부터 deprecated되었습니다.**

과거 구현과 개선 사항들은 참고용으로 남겨두었습니다.
새로운 코드에서는 primitive 조합 방식을 사용하세요.

**문서 버전**: 1.1.0 (DEPRECATED)
**최종 업데이트**: 2025-11-19
