# WKit.makeIterator

## 위치
`WKit.js:111-124`

## 시그니처
```javascript
WKit.makeIterator(page: Page, ...layerList: string[]): Iterator<Instance>
```

## 역할
페이지의 여러 레이어(masterLayer, twoLayer, threeLayer)에서 컴포넌트 인스턴스들을 순회할 수 있는 통합 Iterator를 생성합니다.

**주요 기능**:
1. 레이어 목록이 없으면 기본값으로 모든 레이어 사용
2. 각 레이어에서 인스턴스 Map의 values() 가져오기
3. 여러 iterator를 하나로 결합

이 API는 **페이지 내 모든 컴포넌트를 순회하거나 특정 레이어만 순회**할 때 사용합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- 컴포넌트가 3개 레이어로 분리되어 있음 (2D master, 2D two, 3D three)
- 모든 컴포넌트를 순회하려면 각 레이어를 개별 접근해야 함
- 통합 iterator로 간결하게 처리 가능

## 사용 예시
```javascript
// 1. 모든 레이어 순회
const allInstances = WKit.makeIterator(page);
for (const instance of allInstances) {
  console.log(instance.name);
}

// 2. 3D 레이어만 순회
const threeInstances = WKit.makeIterator(page, 'threeLayer');
fx.go(
  threeInstances,
  fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
);

// 3. 특정 레이어들만 순회
const twoD Instances = WKit.makeIterator(page, 'masterLayer', 'twoLayer');

// 4. 인스턴스 찾기
const targetInstance = WKit.getInstanceByName(
  'MyComponent',
  WKit.makeIterator(page)
);
```

## 데이터 흐름
```
WKit.makeIterator(page, 'masterLayer', 'threeLayer')
  ↓
layerList = ['masterLayer', 'threeLayer']
  ↓
fx.map으로 각 레이어에서 values() 가져오기
  ↓
  ├─ page.masterLayer.componentInstanceListMap.values()
  └─ page.threeLayer._appendElementListMap.values()
  ↓
combineIterators로 결합
  ↓
통합 Iterator 반환
  → yield instance1 (from masterLayer)
  → yield instance2 (from masterLayer)
  → yield instance3 (from threeLayer)
  → ...
```

## 구현 분석

### 현재 코드
```javascript
// WKit.js:111-124
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

// WKit.js:353-357
function* combineIterators(iterables) {
  for (const iterable of iterables) {
    yield* iterable;
  }
}
```

### 잘된 점 ✅
1. **레이어 추상화**: 사용자는 레이어 내부 구조를 몰라도 됨
2. **유연한 파라미터**: ...layerList로 원하는 레이어만 선택 가능
3. **Generator 사용**: 메모리 효율적 (lazy evaluation)
4. **Optional chaining**: page?.[layer]로 안전한 접근
5. **기본값 제공**: 레이어 지정 안 하면 모든 레이어

### 개선점 ⚠️

#### 1. page null 체크 불충분
**현재 코드**:
```javascript
fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values())
```

**문제점**:
- page가 null이면 fx.map까지는 가지만, values()가 undefined
- combineIterators에서 에러 가능성

**개선안**:
```javascript
WKit.makeIterator = function (page, ...layerList) {
  if (!page) {
    console.warn('[WKit.makeIterator] page is null or undefined');
    return (function*() {})();  // 빈 iterator 반환
  }

  layerList = layerList.length ? layerList : ['masterLayer', 'twoLayer', 'threeLayer'];
  const mapName = {
    masterLayer: 'componentInstanceListMap',
    twoLayer: 'componentInstanceListMap',
    threeLayer: '_appendElementListMap',
  };

  return combineIterators(
    fx.go(
      layerList,
      fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values()),
      fx.filter(Boolean)  // undefined 제거
    )
  );
};
```

#### 2. 잘못된 레이어 이름 처리
**문제점**:
- 존재하지 않는 레이어 이름 전달 시 undefined 반환
- combineIterators에서 에러 가능

**개선안**:
```javascript
WKit.makeIterator = function (page, ...layerList) {
  if (!page) {
    console.warn('[WKit.makeIterator] page is null or undefined');
    return (function*() {})();
  }

  const validLayers = ['masterLayer', 'twoLayer', 'threeLayer'];

  // 레이어 검증
  const invalidLayers = layerList.filter(layer => !validLayers.includes(layer));
  if (invalidLayers.length > 0) {
    console.warn(`[WKit.makeIterator] Invalid layers: ${invalidLayers.join(', ')}`);
  }

  // 기본값 또는 유효한 레이어만 사용
  layerList = layerList.length
    ? layerList.filter(layer => validLayers.includes(layer))
    : validLayers;

  if (layerList.length === 0) {
    console.warn('[WKit.makeIterator] No valid layers specified');
    return (function*() {})();
  }

  const mapName = {
    masterLayer: 'componentInstanceListMap',
    twoLayer: 'componentInstanceListMap',
    threeLayer: '_appendElementListMap',
  };

  return combineIterators(
    fx.go(
      layerList,
      fx.map((layer) => page?.[layer]?.[mapName[layer]]?.values()),
      fx.filter(Boolean)
    )
  );
};
```

#### 3. mapName 하드코딩
**문제점**:
- mapName 매핑이 함수 내부에 하드코딩
- 레이어 구조 변경 시 함수 수정 필요

**개선안** (설정 외부화 - 선택사항):
```javascript
// 레이어 설정을 외부로 (권장하지는 않음, 현재 방식도 충분)
const LAYER_CONFIG = {
  masterLayer: 'componentInstanceListMap',
  twoLayer: 'componentInstanceListMap',
  threeLayer: '_appendElementListMap',
};

WKit.makeIterator = function (page, ...layerList) {
  // LAYER_CONFIG 사용
  const mapName = LAYER_CONFIG;
  // ...
};
```

#### 4. combineIterators에서 undefined 처리
**현재 코드**:
```javascript
function* combineIterators(iterables) {
  for (const iterable of iterables) {
    yield* iterable;  // iterable이 undefined면 에러
  }
}
```

**문제점**:
- iterable이 undefined/null이면 `yield*` 에러

**개선안**:
```javascript
function* combineIterators(iterables) {
  for (const iterable of iterables) {
    if (iterable && iterable[Symbol.iterator]) {
      yield* iterable;
    }
  }
}
```

#### 5. 반환 타입 명시 부족
**문제점**:
- Generator 함수 반환하는데 명확하지 않음
- JSDoc이나 TypeScript 타입 정의 부재

**개선안** (JSDoc 추가):
```javascript
/**
 * 페이지의 여러 레이어에서 컴포넌트 인스턴스를 순회하는 iterator 생성
 * @param {Page} page - 페이지 객체
 * @param {...string} layerList - 순회할 레이어 목록 (기본값: 모든 레이어)
 * @returns {Iterator<Instance>} 컴포넌트 인스턴스 iterator
 * @example
 * // 모든 레이어
 * for (const instance of WKit.makeIterator(page)) { ... }
 *
 * // 특정 레이어만
 * for (const instance of WKit.makeIterator(page, 'threeLayer')) { ... }
 */
WKit.makeIterator = function (page, ...layerList) {
  // ...
};
```

## 개선 우선순위
1. **High**: undefined iterator 필터링 (fx.filter(Boolean))
2. **Medium**: combineIterators에서 안전한 처리
3. **Low**: 잘못된 레이어 이름 검증
4. **Low**: JSDoc 추가

## 관련 함수
- `combineIterators()` - Internal (`WKit.js:353-357`)
- `WKit.getInstanceByName()` - Public API (`WKit.js:126-128`)
- `WKit.getInstanceById()` - Public API (`WKit.js:130-132`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스 - 모든 레이어
const page = {
  masterLayer: {
    componentInstanceListMap: new Map([
      ['id1', { id: 'id1', name: 'Comp1' }],
      ['id2', { id: 'id2', name: 'Comp2' }],
    ])
  },
  twoLayer: {
    componentInstanceListMap: new Map([
      ['id3', { id: 'id3', name: 'Comp3' }],
    ])
  },
  threeLayer: {
    _appendElementListMap: new Map([
      ['id4', { id: 'id4', name: '3DComp' }],
    ])
  }
};

const iter = WKit.makeIterator(page);
const all = [...iter];
// all.length === 4
// [Comp1, Comp2, Comp3, 3DComp]

// 2. 특정 레이어만
const iterThree = WKit.makeIterator(page, 'threeLayer');
const threeOnly = [...iterThree];
// threeOnly.length === 1
// [3DComp]

// 3. 여러 레이어 선택
const iterMasterThree = WKit.makeIterator(page, 'masterLayer', 'threeLayer');
const selected = [...iterMasterThree];
// selected.length === 3
// [Comp1, Comp2, 3DComp]

// 4. 빈 페이지
const emptyPage = {
  masterLayer: { componentInstanceListMap: new Map() },
  twoLayer: { componentInstanceListMap: new Map() },
  threeLayer: { _appendElementListMap: new Map() }
};

const iterEmpty = WKit.makeIterator(emptyPage);
const empty = [...iterEmpty];
// empty.length === 0

// 5. 잘못된 레이어 이름
const iterInvalid = WKit.makeIterator(page, 'invalidLayer');
// 현재: 에러 또는 빈 iterator
// 개선 후: 경고 로그 + 빈 iterator

// 6. null 페이지
const iterNull = WKit.makeIterator(null);
// 현재: 에러 가능
// 개선 후: 경고 로그 + 빈 iterator
```

## 실제 사용 흐름
```javascript
// 1. 모든 컴포넌트에서 특정 이름 찾기
const targetInstance = WKit.getInstanceByName(
  'ProductCard',
  WKit.makeIterator(wemb.mainPageComponent)
);

// 2. 모든 3D 객체 정리
fx.go(
  WKit.makeIterator(this, 'threeLayer'),
  fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
);

// 3. 모든 2D 컴포넌트의 이벤트 제거
fx.go(
  WKit.makeIterator(this, 'masterLayer', 'twoLayer'),
  fx.each((instance) => {
    if (instance.customEvents) {
      WKit.removeCustomEvents(instance, instance.customEvents);
    }
  })
);

// 4. 데이터 매핑된 컴포넌트만 필터링
const mappedComponents = fx.go(
  WKit.makeIterator(page),
  fx.filter((instance) => instance.dataMapping && instance.dataMapping.length > 0),
  fx.takeAll
);

// 5. 디버깅 - 모든 컴포넌트 이름 출력
fx.go(
  WKit.makeIterator(page),
  fx.each((instance) => console.log(instance.name))
);
```

## 레이어 구조 이해
```
Page
├─ masterLayer
│   └─ componentInstanceListMap: Map<id, Instance>
│       ├─ 'comp-1' → { id, name, element, ... }
│       ├─ 'comp-2' → { id, name, element, ... }
│       └─ ...
│
├─ twoLayer
│   └─ componentInstanceListMap: Map<id, Instance>
│       ├─ 'comp-3' → { id, name, element, ... }
│       └─ ...
│
└─ threeLayer
    └─ _appendElementListMap: Map<id, Instance>
        ├─ '3d-1' → { id, name, appendElement, ... }
        ├─ '3d-2' → { id, name, appendElement, ... }
        └─ ...

makeIterator(page)
  → masterLayer의 모든 인스턴스
  → twoLayer의 모든 인스턴스
  → threeLayer의 모든 인스턴스
  → 순서대로 yield
```

## 성능 특성
```javascript
// Generator이므로 lazy evaluation
const iter = WKit.makeIterator(page);  // 이 시점엔 순회 안 함

for (const instance of iter) {
  if (instance.name === 'Target') {
    break;  // 찾으면 즉시 종료, 나머지 순회 안 함
  }
}

// 배열로 변환 시 모든 인스턴스 순회
const all = [...WKit.makeIterator(page)];  // 모든 인스턴스 메모리에 적재

// 메모리 효율적 사용 (권장)
fx.go(
  WKit.makeIterator(page),
  fx.filter(predicate),  // Lazy
  fx.take(5)             // 5개만 평가
);
```

## 보완 제안
```javascript
// 레이어별 카운트 가져오기
WKit.getLayerCounts = function (page) {
  if (!page) return { masterLayer: 0, twoLayer: 0, threeLayer: 0 };

  return {
    masterLayer: page.masterLayer?.componentInstanceListMap?.size || 0,
    twoLayer: page.twoLayer?.componentInstanceListMap?.size || 0,
    threeLayer: page.threeLayer?._appendElementListMap?.size || 0,
  };
};

// 사용
const counts = WKit.getLayerCounts(page);
console.log(`Total: ${counts.masterLayer + counts.twoLayer + counts.threeLayer}`);
```
