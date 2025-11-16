# WKit Schema Functions

코드 생성 및 개발 가이드를 위한 스키마 예제 제공 함수들입니다.

---

## 개요

이 함수들은 **실제 기능을 수행하지 않고** 사용자가 어떤 구조로 데이터를 작성해야 하는지 보여주는 **예제 템플릿**을 반환합니다.

### 역할
1. **문서화**: 스키마 구조를 코드로 문서화
2. **코드 생성**: IDE에서 자동 완성이나 코드 생성 도구에 활용
3. **개발 가이드**: 개발자가 참고할 예제 제공

### 필요성
⭐⭐⭐ 개발 편의성 향상 (필수는 아니지만 유용)

---

## WKit.getDataMappingSchema

### 위치
`WKit.js:178-192`

### 시그니처
```javascript
WKit.getDataMappingSchema(): DataMappingSchema[]
```

### 반환값
```javascript
[
  {
    ownerId: 'ownerId',
    visualInstanceList: ['Chart_for_specific_model'],
    datasetInfo: {
      datasetName: 'dummyjson',
      param: {
        dataType: 'carts',
        id: 'ownerId',
      },
    },
  },
]
```

### 사용 예시
```javascript
// 개발자가 스키마 참고
const schema = WKit.getDataMappingSchema();
console.log(schema);

// 실제 사용 시 구조 복사
this.dataMapping = [
  {
    ownerId: this.id,
    visualInstanceList: ['MyChart', 'MyTable'],
    datasetInfo: {
      datasetName: 'myapi',
      param: { type: 'sales', period: 'monthly' }
    }
  }
];
```

### 개선점

#### 1. 명확한 주석 추가
```javascript
WKit.getDataMappingSchema = function () {
  return [
    {
      ownerId: 'comp-123',  // 컴포넌트 ID
      visualInstanceList: ['ChartComp', 'TableComp'],  // 시각화 컴포넌트 이름들
      datasetInfo: {
        datasetName: 'api-name',  // 데이터셋 이름
        param: {
          dataType: 'products',  // 데이터 타입
          id: 1  // 필터 ID
        }
      }
    }
  ];
};
```

#### 2. 여러 패턴 예제
```javascript
WKit.getDataMappingSchemas = function () {
  return {
    // 패턴 1: 단일 시각화
    single: {
      ownerId: 'comp-1',
      visualInstanceList: ['Chart'],
      datasetInfo: {
        datasetName: 'sales',
        param: { period: 'monthly' }
      }
    },

    // 패턴 2: 다중 시각화
    multiple: {
      ownerId: 'comp-2',
      visualInstanceList: ['Chart', 'Table', 'Card'],
      datasetInfo: {
        datasetName: 'analytics',
        param: { metrics: 'all' }
      }
    },

    // 패턴 3: 동적 ID
    dynamic: {
      ownerId: this.id,  // 동적 ID
      visualInstanceList: ['DynamicChart'],
      datasetInfo: {
        datasetName: 'userdata',
        param: {
          userId: this.userId  // 동적 파라미터
        }
      }
    }
  };
};
```

---

## WKit.getGlobalMappingSchema

### 위치
`WKit.js:194-211`

### 시그니처
```javascript
WKit.getGlobalMappingSchema(): GlobalMappingSchema[]
```

### 반환값
```javascript
[
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
]
```

### 사용 예시
```javascript
// Page - before_load
this.globalDataMappings = [
  {
    topic: 'products',
    datasetInfo: {
      datasetName: 'api',
      param: { category: 'all' }
    }
  },
  {
    topic: 'categories',
    datasetInfo: {
      datasetName: 'api',
      param: { type: 'tree' }
    }
  }
];
```

---

## WKit.getCustomEventsSchema

### 위치
`WKit.js:213-224`

### 시그니처
```javascript
WKit.getCustomEventsSchema(): CustomEventsSchema
```

### 반환값
```javascript
{
  click: {
    '.navbar-brand': '@triggerNavbarTitle',
    '.nav-link': '@triggerNavLink',
    '.dropdown-item': '@triggerDropDownItem',
  },
  submit: {
    form: '@submitForm',
  },
}
```

### 사용 예시
```javascript
// Component - register
this.customEvents = {
  click: {
    '.btn-submit': '@submitForm',
    '.btn-cancel': '@cancelForm'
  },
  input: {
    'input[type="text"]': '@inputChanged'
  }
};

WKit.bindEvents(this, this.customEvents);
```

---

## WKit.getCustomEventsSchemaFor3D

### 위치
`WKit.js:226-230`

### 시그니처
```javascript
WKit.getCustomEventsSchemaFor3D(): CustomEvents3DSchema
```

### 반환값
```javascript
{
  click: '@triggerClick',
}
```

### 사용 예시
```javascript
// 3D Component - register
this.customEvents = {
  click: '@3dObjectClicked',
  mousedown: '@3dMouseDown',
  mousemove: '@3dMouseMove'
};

WKit.bind3DEvents(this, this.customEvents);
```

---

## WKit.getSubscriptionSchema

### 위치
`WKit.js:232-237`

### 시그니처
```javascript
WKit.getSubscriptionSchema(): SubscriptionSchema
```

### 반환값
```javascript
{
  users: ['method1', 'method2'],
  comments: ['method3', 'method4'],
}
```

### 사용 예시
```javascript
// Component - register
this.subscriptions = {
  users: ['renderUserList', 'updateStats'],
  products: ['renderProductTable']
};

this.renderUserList = renderUserList.bind(this);
this.updateStats = updateStats.bind(this);
this.renderProductTable = renderProductTable.bind(this);

fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, fnList]) =>
    fx.each(fn => this[fn] && GlobalDataPublisher.subscribe(topic, this, this[fn]), fnList)
  )
);
```

---

## 통합 개선안

### 1. 하나의 함수로 통합
```javascript
WKit.getSchemas = function () {
  return {
    dataMapping: {
      description: '컴포넌트별 데이터 매핑 설정',
      example: [
        {
          ownerId: 'comp-id',  // 컴포넌트 ID
          visualInstanceList: ['ChartComp'],  // 시각화할 컴포넌트들
          datasetInfo: {
            datasetName: 'api-name',  // API 이름
            param: { id: 1 }  // 파라미터
          }
        }
      ]
    },

    globalMapping: {
      description: '페이지 레벨 글로벌 데이터 매핑',
      example: [
        {
          topic: 'users',  // Topic 이름
          datasetInfo: {
            datasetName: 'api',
            param: { type: 'all' }
          }
        }
      ]
    },

    customEvents2D: {
      description: '2D 컴포넌트 이벤트 바인딩',
      example: {
        click: {
          '.selector': '@eventName'  // CSS selector → 이벤트명
        },
        submit: {
          'form': '@submitForm'
        }
      }
    },

    customEvents3D: {
      description: '3D 컴포넌트 이벤트 바인딩',
      example: {
        click: '@3dClick',  // 이벤트 타입 → 이벤트명
        mousedown: '@3dMouseDown'
      }
    },

    subscription: {
      description: 'GlobalDataPublisher 구독 설정',
      example: {
        topicName: ['method1', 'method2']  // Topic → 메소드 목록
      }
    }
  };
};

// 사용
const schemas = WKit.getSchemas();
console.log(schemas.dataMapping.description);
console.log(schemas.dataMapping.example);
```

### 2. 타입 정의 제공 (TypeScript/JSDoc)
```javascript
/**
 * @typedef {Object} DataMappingSchema
 * @property {string} ownerId - 컴포넌트 ID
 * @property {string[]} visualInstanceList - 시각화 컴포넌트 이름 배열
 * @property {DatasetInfo} datasetInfo - 데이터셋 정보
 */

/**
 * @typedef {Object} DatasetInfo
 * @property {string} datasetName - 데이터셋 이름
 * @property {Object} param - 파라미터
 */

/**
 * 데이터 매핑 스키마 예제
 * @returns {DataMappingSchema[]}
 */
WKit.getDataMappingSchema = function () {
  // ...
};
```

### 3. 검증 함수 추가
```javascript
WKit.validateDataMapping = function (dataMapping) {
  const errors = [];

  if (!Array.isArray(dataMapping)) {
    errors.push('dataMapping must be an array');
    return { valid: false, errors };
  }

  dataMapping.forEach((mapping, index) => {
    if (!mapping.ownerId) {
      errors.push(`[${index}] ownerId is required`);
    }

    if (!Array.isArray(mapping.visualInstanceList)) {
      errors.push(`[${index}] visualInstanceList must be an array`);
    }

    if (!mapping.datasetInfo || !mapping.datasetInfo.datasetName) {
      errors.push(`[${index}] datasetInfo.datasetName is required`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// 사용
const validation = WKit.validateDataMapping(this.dataMapping);
if (!validation.valid) {
  console.error('Invalid dataMapping:', validation.errors);
}
```

---

## 실제 활용 방법

### 1. IDE 자동 완성
```javascript
// 개발자가 타이핑 시작
this.dataMapping = WKit.getDataMappingSchema();
// → 자동으로 스키마 구조가 채워짐
// → 개발자가 값만 수정
```

### 2. 코드 생성 도구
```javascript
// 코드 생성기에서 활용
function generateComponentScript(componentType) {
  const schemas = WKit.getSchemas();

  if (componentType === '2D') {
    return `
this.customEvents = ${JSON.stringify(schemas.customEvents2D.example, null, 2)};
WKit.bindEvents(this, this.customEvents);
    `;
  } else if (componentType === '3D') {
    return `
this.customEvents = ${JSON.stringify(schemas.customEvents3D.example, null, 2)};
WKit.bind3DEvents(this, this.customEvents);
    `;
  }
}
```

### 3. 유효성 검사
```javascript
// 사용자가 작성한 스크립트 검증
const userDataMapping = getUserInputDataMapping();
const schema = WKit.getDataMappingSchema()[0];

// 스키마와 비교하여 필수 필드 확인
const requiredKeys = Object.keys(schema);
const userKeys = Object.keys(userDataMapping);

const missingKeys = requiredKeys.filter(key => !userKeys.includes(key));
if (missingKeys.length > 0) {
  console.error('Missing required fields:', missingKeys);
}
```

---

## 개선 우선순위

1. **Medium**: JSDoc 타입 정의 추가
2. **Low**: 하나의 통합 함수로 리팩토링
3. **Low**: 검증 함수 추가
4. **Low**: 여러 패턴 예제 제공

---

## 결론

Schema 함수들은:
- **문서화**: 코드로 스키마를 문서화
- **가이드**: 개발자에게 올바른 구조 제시
- **자동화**: 코드 생성 도구에 활용 가능

실제 기능은 없지만 **개발 경험(DX) 향상**에 기여하는 유틸리티 함수들입니다.
