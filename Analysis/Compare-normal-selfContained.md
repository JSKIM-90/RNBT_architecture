# 컴포넌트 패턴 비교 가이드

일반 컴포넌트와 자기 완결 컴포넌트의 차이점 비교

---

## 핵심 차이: 데이터 fetch 주체

| 구분 | 일반 컴포넌트 | 자기 완결 컴포넌트 |
|------|--------------|-------------------|
| **데이터 fetch** | 페이지가 fetch | 컴포넌트가 직접 fetch |
| **데이터 수신** | 구독 또는 주입 | 내부에서 직접 호출 |
| **페이지 역할** | 오케스트레이터 | 메소드 호출만 |

---

## 데이터 흐름 비교

### 일반 컴포넌트

**패턴 1: 구독 (주기적 데이터)**

```
Page                          Component
  │                              │
  ├─ fetchAndPublish() ─────────►│
  │                              ├─ subscribe(topic, callback)
  │                              │
  │   GlobalDataPublisher        │
  │         │                    │
  │         └── publish ────────►├─ callback(data)
  │                              └─ render
```

```javascript
// 페이지: loaded.js
GlobalDataPublisher.fetchAndPublish('sensorData', this);

// 컴포넌트: register.js
GlobalDataPublisher.subscribe('sensorData', this, this.renderSensorInfo);
```

**패턴 2: 주입 (이벤트 기반)**

```
User Click
    │
    ▼
Component ──@itemClicked──► Page EventBus Handler
                                    │
                                    ├─ fetchData()
                                    │
                                    └─ targetInstance.showDetail(data)
                                                          │
                                                          ▼
                                                    render(data)
```

```javascript
// 페이지: before_load.js
'@itemClicked': async ({ targetInstance }) => {
    const { datasetInfo } = targetInstance;
    for (const { datasetName, param } of datasetInfo) {
        const data = await fetchData(this, datasetName, param);
        targetInstance.showDetail(data);  // 데이터를 넘겨줌
    }
}

// 컴포넌트
showDetail(data) {
    this.renderSensorInfo(data);  // 받은 데이터로 렌더링
}
```

### 자기 완결 컴포넌트

```
User Click
    │
    ▼
Component ──@sensorClicked──► Page EventBus Handler
                                    │
                                    └─ targetInstance.showDetail()
                                                          │
                                                          ▼
                                              fetchData() (내부)
                                                          │
                                                          ▼
                                                    render(data)
```

```javascript
// 페이지: before_load.js
'@sensorClicked': ({ targetInstance }) => {
    targetInstance.showDetail();  // 메소드만 호출, 데이터 없음
}

// 컴포넌트
showDetail() {
    for (const { datasetName, param, render } of this.datasetInfo) {
        const data = await fetchData(this.page, datasetName, param);  // 직접 fetch
        render.forEach(fn => this[fn](data));
    }
}
```

---

## datasetInfo 구조 비교

### 일반 컴포넌트

```javascript
// 페이지에 "이 데이터 필요해요" 알림용
this.datasetInfo = [
    {
        datasetName: 'sensorData',
        param: { id: this.id }
    }
];
```

### 자기 완결 컴포넌트

```javascript
// 직접 fetch + 렌더링 정보 포함
this.datasetInfo = [
    {
        datasetName: 'sensor',
        param: { id: this.id },
        render: ['renderSensorInfo']  // 추가: 어떤 함수로 렌더링할지
    },
    {
        datasetName: 'sensorHistory',
        param: { id: this.id },
        render: ['renderChart']
    }
];
```

| 필드 | 일반 | 자기 완결 | 설명 |
|------|------|----------|------|
| `datasetName` | ✓ | ✓ | API 식별자 |
| `param` | ✓ | ✓ | API 파라미터 |
| `render` | ✗ | ✓ | 렌더링 함수 목록 |

---

## 페이지 이벤트 핸들러 비교

### 일반 컴포넌트 (주입 패턴)

```javascript
'@itemClicked': async ({ event, targetInstance }) => {
    const { datasetInfo } = targetInstance;
    
    if (datasetInfo?.length) {
        for (const { datasetName, param } of datasetInfo) {
            const data = await fetchData(this, datasetName, param);
            // 페이지가 데이터 처리 방법 결정
            targetInstance.showDetail(data);
        }
    }
}
```

**특징:**
- 페이지가 fetch 수행
- 페이지가 데이터를 어떻게 처리할지 결정
- 컴포넌트는 데이터만 받아서 렌더링

### 자기 완결 컴포넌트

```javascript
'@sensorClicked': ({ targetInstance }) => {
    targetInstance.showDetail();
}
```

**특징:**
- 페이지는 메소드 호출만
- 데이터 fetch/처리는 컴포넌트 내부 관심사
- 페이지가 데이터 흐름을 알 필요 없음

---

## 아키텍처 원칙 대조

| 원칙 | 일반 컴포넌트 | 자기 완결 컴포넌트 |
|------|--------------|-------------------|
| 페이지 = 오케스트레이터 | ✓ | ✗ |
| 컴포넌트 = 독립적 구독자 | ✓ | ✗ |
| 느슨한 결합 (pub-sub) | ✓ | △ |
| 컴포넌트 자율성 | △ | ✓ |
| 캡슐화 | △ | ✓ |

### 자기 완결 컴포넌트의 의존성

```javascript
// this.page 참조 필요
fetchData(this.page, datasetName, param)
```

- 컴포넌트가 `this.page`를 알아야 함
- 컴포넌트가 `datasetName`, `param`을 직접 관리

---

## 언제 어떤 패턴을 사용하는가

### 일반 컴포넌트가 적합한 경우

| 상황 | 이유 |
|------|------|
| 여러 컴포넌트가 같은 데이터 공유 | 중복 fetch 방지 |
| 주기적 갱신 필요 | interval 관리는 페이지 책임 |
| 페이지가 데이터 흐름 파악 필요 | 오케스트레이션 |
| 데이터 변환/가공 후 배포 | 페이지에서 일괄 처리 |

```javascript
// 예: 대시보드의 여러 위젯이 같은 센서 데이터 구독
// Widget A, B, C 모두 'sensorData' topic 구독
// 페이지가 한 번 fetch → 세 컴포넌트에 배포
```

### 자기 완결 컴포넌트가 적합한 경우

| 상황 | 이유 |
|------|------|
| 이 컴포넌트만 쓰는 전용 데이터 | 공유 불필요 |
| 사용자 상호작용 시점에만 fetch | 불필요한 네트워크 절약 |
| 복잡한 내부 상태 관리 (팝업, 차트) | 캡슐화 |
| 재사용 가능한 독립 모듈 | 페이지 의존 최소화 |

```javascript
// 예: 3D 센서 클릭 → 상세 팝업
// 클릭할 때만 해당 센서의 상세 데이터 fetch
// 다른 컴포넌트는 이 데이터 필요 없음
```

---

## 정리 패턴 비교

### 일반 컴포넌트: destroy.js

```javascript
// 구독 해제
fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, _]) => GlobalDataPublisher.unsubscribe(topic, this))
);
this.subscriptions = null;

// 이벤트 해제
WKit.removeCustomEvents(this, this.customEvents);
this.customEvents = null;
```

### 자기 완결 컴포넌트: destroy.js

```javascript
// DOM 리소스만 정리 (Shadow DOM 팝업 등)
this.destroyPopup();

// 3D 리소스는 페이지의 disposeAllThreeResources()에서 일괄 정리
```

| 정리 대상 | 일반 컴포넌트 | 자기 완결 컴포넌트 |
|----------|--------------|-------------------|
| subscriptions | destroy.js | disposeAllThreeResources |
| customEvents | destroy.js | disposeAllThreeResources |
| datasetInfo | destroy.js | disposeAllThreeResources |
| DOM 리소스 (팝업) | - | destroy.js |
| 3D 리소스 | 페이지 | 페이지 |

---

## 하이브리드 패턴

자기 완결 컴포넌트도 GlobalDataPublisher 구독을 함께 사용할 수 있습니다:

```javascript
// 자기 완결 컴포넌트 + 구독 패턴
constructor() {
    // 자기 완결: 클릭 시 상세 데이터
    this.datasetInfo = [
        { datasetName: 'sensorDetail', param: { id: this.id }, render: ['renderDetail'] }
    ];
    
    // 구독: 주기적 상태 업데이트
    this.subscriptions = {
        'sensorStatus': ['updateStatusIndicator']
    };
}
```

**사용 시나리오:**
- 상태 표시(온/오프)는 주기적 구독으로 실시간 갱신
- 상세 정보는 클릭 시에만 직접 fetch

---

## 참조 문서

| 문서 | 내용 |
|------|------|
| `PROJECT_TEMPLATE.md` | 아키텍처 원칙, 페이지 라이프사이클 |
| `DEFAULT_JS.md` | 복사해서 쓰는 기본 템플릿 |
| `FUNCTIONAL_COMPONENT.md` | 자기 완결 컴포넌트 상세 구현 |

---

*작성일: 2025-12-18*