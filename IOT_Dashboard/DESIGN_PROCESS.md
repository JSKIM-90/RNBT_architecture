# IoT 모니터링 대시보드 - 설계 프로세스

런타임 프레임워크의 패턴을 검증하기 위한 IoT 대시보드 예제 개발 과정 기록

---

## 목표

**핵심 검증 사항**:
- 다중 갱신 주기 패턴 (실시간, 단기, 중기, 정적)
- 페이지 레벨 interval 관리
- 컴포넌트 독립성 유지
- 템플릿 기반 개발 용이성

---

## 1단계: 시나리오 구상

### 왜 시나리오가 먼저인가?

시나리오가 먼저 구상되어야:
- **어떤 데이터**가 필요한지
- **어떤 컴포넌트**가 필요한지
- **갱신 주기**가 어떻게 달라야 하는지
- **컴포넌트 간 상호작용**이 무엇인지

이런 것들을 명확히 정의할 수 있습니다.

### 선택한 도메인: 스마트 팩토리 환경 모니터링

**배경**: 공장 내 여러 구역에 설치된 센서들을 모니터링하고 관리하는 대시보드

**데이터 카테고리 (갱신 주기별)**:

#### 🔴 초단위 실시간 (3-5초)
- 센서 실시간 값: 온도, 습도, 압력, CO2 농도
- 긴급 알림: 임계치 초과 경고

#### 🟡 단기 갱신 (10-15초)
- 디바이스 상태: 온라인/오프라인, 배터리 레벨, 신호 강도
- 최근 이벤트 로그: 최근 30분 이벤트

#### 🟢 중기 갱신 (30-60초)
- 시간별 트렌드: 지난 24시간 센서 데이터 차트
- 구역별 통계: 평균, 최대, 최소값

#### ⚪ 정적/수동 갱신
- 디바이스 목록: 등록된 모든 센서 목록
- 설정 정보: 임계치, 알림 규칙

### 컴포넌트 구성안

```
Dashboard Layout
├─ Header
│  └─ SystemStatus (🟡 디바이스 상태 요약)
│
├─ Left Panel
│  ├─ DeviceList (⚪ 디바이스 목록)
│  └─ AlertPanel (🔴 긴급 알림)
│
├─ Main Area
│  ├─ SensorGrid (🔴 실시간 센서 값 - 카드 형태)
│  │  ├─ TemperatureSensor
│  │  ├─ HumiditySensor
│  │  ├─ PressureSensor
│  │  └─ CO2Sensor
│  │
│  └─ TrendChart (🟢 시간별 트렌드 차트)
│
└─ Right Panel
   ├─ RecentEvents (🟡 최근 이벤트 로그)
   └─ ZoneStatistics (🟢 구역별 통계)
```

---

## 2단계: API 서버 구축

### 필요성

데이터의 반복 갱신을 통해 화면을 효과적으로 업데이트하는 방법을 검증하기 위해서는 실제 데이터 소스가 필요합니다.

### 구현

**위치**: `IOT_API/` 폴더
**기술**: Node.js + Express
**포트**: 3000

**API 엔드포인트**:

```
/api/iot
├─ /realtime (3-5초 갱신)
│  ├─ GET /sensors/current        # 모든 센서 현재 값
│  └─ GET /alerts/active          # 활성 알림
│
├─ /shortterm (10-15초 갱신)
│  ├─ GET /devices/status         # 디바이스 상태
│  └─ GET /events/recent          # 최근 이벤트
│
├─ /midterm (30-60초 갱신)
│  ├─ GET /sensors/trend/24h      # 24시간 트렌드
│  └─ GET /zones/statistics       # 구역별 통계
│
└─ /static (초기 로드만)
   ├─ GET /devices/list           # 디바이스 목록
   └─ GET /settings/thresholds    # 임계치 설정
```

**데이터 특성**:
- 센서 타입: 온도, 습도, 압력, CO2 (각 4개씩, 총 16개)
- 구역: Zone A, B, C, D
- 랜덤 변동 + 트렌딩 패턴
- 임계치 기반 자동 알림 생성

---

## 3단계: 페이지 스크립트 설계

### 설계 원칙: 독립적인 작업 단위

**접근 방식**:
- 각 라이프사이클 단계를 독립적인 작업 단위로 분리
- before_load → loaded → before_unload 순서대로 개발
- 각 단계마다 템플릿 작성 → 검토 → 다음 단계

**장점**:
- 독립성이 실제로 보장됨
- 점진적 검증 가능
- 통합 시점이 명확

---

### 3.1. page_before_load.js

**역할**: 컴포넌트 생성 전 초기 설정

**핵심 논리**:
> 컴포넌트는 독립적이고, 페이지에서 정의할 이벤트도 사용자 정의입니다.
> 가장 먼저 해야 할 일은 이벤트가 정의될 영역을 빈 객체로 비워두고,
> 샘플이 될 수 있는 것만 두는 것입니다.

**구현 특징**:
- ✅ 빈 구조 제공 (`this.eventBusHandlers = {}`)
- ✅ 샘플 하나로 패턴 명시 (`@sensorClicked`)
- ✅ Primitive 조합 방식 표현:
  1. `targetInstance`에서 `datasetInfo` 추출
  2. `fetchData()` primitive 사용
  3. 데이터 처리 (TODO 주석)
- ✅ 선택적 기능은 주석 처리 (Raycasting)

**사용자 관점**:
1. 파일 열어보면 구조 즉시 파악
2. 샘플 보고 패턴 이해
3. 필요한 이벤트를 같은 방식으로 추가

---

### 3.2. page_loaded.js

**역할**: 모든 컴포넌트 completed 후 데이터 발행

**핵심 논리**:
> 개별 컴포넌트가 가지고 있는 데이터셋 정보가 있겠지만,
> 많은 경우 데이터 소스가 중복될 것입니다.
> 단일 fetch를 통해 데이터를 컴포넌트에게 전달해주는 것이 맞습니다.
> 컴포넌트가 데이터를 받을 준비까지 되어있어야 합니다.
>
> 따라서 페이지(컨트롤러)는 어떤 데이터를 부를 것인지
> 자신의 속성으로 정의해놓고, 그 속성을 순회하면서 하나씩 publish합니다.
> 호출 시점은 컴포넌트가 준비된 시점인 page loaded입니다.

**데이터 중복 방지**:
- 문제: 여러 컴포넌트가 같은 데이터 소스 필요 → 중복 fetch
- 해결: GlobalDataPublisher의 topic 기반 pub-sub
  - 페이지가 한 번만 fetch
  - 해당 topic 구독한 모든 컴포넌트에게 전파

**타이밍**:
```
Component register → subscribe 등록
      ↓
모든 컴포넌트 completed
      ↓
Page loaded → fetchAndPublish
      ↓
구독자들이 자동으로 데이터 수신
```

**페이지의 역할**:
- `this.globalDataMappings`: "어떤 데이터를 발행할지" 선언
- 속성 순회하며 `registerMapping` → `fetchAndPublish`
- 컴포넌트는 자신이 필요한 topic만 구독

---

### 3.3. 갱신 주기 관리

**핵심 논리**:
> 이 데이터들이 정말 한 번만 호출되고 말 것인가?
> 대시보드는 갱신이 되는 것이 보통입니다.
> 데이터마다 갱신 주기도 다를 것입니다.
>
> 가장 먼저 해야 할 일은 페이지가 현재 가지고 있는
> 데이터셋 정보가 interval 정보를 가지고 있어야 하는 것입니다.

**데이터 구조**:
```javascript
this.globalDataMappings = [
    {
        topic: 'sensorData',
        datasetInfo: {
            datasetName: 'iotapi',
            param: { endpoint: '/api/iot/realtime/sensors/current' }
        },
        refreshInterval: 5000  // Optional
    }
];
```

**refreshInterval 있으면**: 주기적 갱신
**refreshInterval 없으면**: 한 번만 fetch

---

### 3.4. Interval 관리 패턴

**참고**: `Runtime_Scaffold_code_sample/page_script/dashboard_example/page_loaded_dashboard.js`

**패턴 구성**:

#### 1. 최초 호출
```javascript
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```

#### 2. startAllIntervals 함수
```javascript
this.startAllIntervals = () => {
    this.refreshIntervals = {};  // 빈 객체 선언 (interval ID 저장용)

    fx.go(
        this.globalDataMappings,  // 다시 순회
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                // topic을 키로 interval ID 저장
                this.refreshIntervals[topic] = setInterval(() => {
                    GlobalDataPublisher.fetchAndPublish(topic, this);
                }, refreshInterval);  // setInterval과 함께 호출
            }
        })
    );
};
```

#### 3. stopAllIntervals 함수 (정리용)
```javascript
this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};
```

#### 4. 실행
```javascript
this.startAllIntervals();
```

**분리된 책임**:
- ✅ 최초 호출: 즉시 데이터 표시
- ✅ interval 시작: 주기적 갱신
- ✅ interval ID 저장: 정리 가능하게

**refreshIntervals 구조**:
```javascript
{
    'sensorData': intervalId1,
    'deviceStatus': intervalId2
}
```

**topic별 독립적 주기**: 각자 다른 interval로 동작

---

### 3.5. Param 관리

**핵심 논리**:
> 데이터셋 구조를 보면 알겠지만 이 데이터셋은 param을 받을 수 있습니다.
> 이 param은 달라질 수 있어야 합니다. 호출 시점마다 원하는 데이터 호출 param이 달라지는 것은 자연스러우니까요 (예를 들어 시간).
>
> GlobalDataPublisher를 보면, fetchAndPublish가 paramUpdates라는 세 번째 매개변수를 정의해두었습니다.
> 이 paramUpdates는 기존 datasetInfo.param을 병합해서 새로운 param으로 데이터를 호출할 수 있게 해줍니다.
>
> 그렇다면 나는 이 param 데이터를 어떻게 관리를 해야할까요?
> 우선 데이터셋 정보가 페이지에 있기 때문에 페이지가 이 param에 대해 고민하는 것이 맞습니다.
> 그렇다면 param 정보를 topic마다 가지고 있어야 겠지요.
> 그리고 topic을 호출할 때 topic에 해당하는 params를 넘긴다면 fetchAndPublish를 할 때 새로운 param이 병합되어서 호출되게 될 것입니다.

#### 문제 인식

**param은 동적이어야 함**:
- 데이터셋은 param을 받을 수 있음
- param은 호출 시점마다 달라질 수 있어야 함
- 예시: 시간 범위, 필터 조건, 페이지네이션 등

#### 해결 방법

**GlobalDataPublisher의 paramUpdates**:
```javascript
fetchAndPublish(topic, page, paramUpdates)
```
- 세 번째 매개변수: `paramUpdates`
- 기존 `datasetInfo.param`과 병합
- 새로운 param으로 데이터 호출

**병합 예시**:
```javascript
// 초기 등록
datasetInfo.param = { endpoint: '/api/sensors', limit: 10 }

// 호출 시
paramUpdates = { startTime: '2025-11-21' }

// 병합 결과
최종 param = { endpoint: '/api/sensors', limit: 10, startTime: '2025-11-21' }
```

#### 관리 주체

**왜 페이지가 관리해야 하는가?**:
- ✅ 페이지가 데이터셋 정보를 소유 (`this.globalDataMappings`)
- ✅ 페이지가 발행 시점 제어 (loaded, interval)
- ✅ 페이지가 오케스트레이터 역할
- ✅ 컴포넌트는 데이터만 받아서 렌더링 (param 관리 불필요)

#### 관리 구조

**topic을 key로 사용**:
```javascript
this.currentParams = {
    'sensorData': { startTime: '2025-11-21T00:00:00Z' },
    'deviceStatus': { online: true },
    'trends': { period: '24h' }
}
```

**장점**:
- topic별 독립적 관리
- 필요할 때만 업데이트
- 명확한 구조

#### 사용 흐름

```
1. 페이지 loaded 시점
   → this.currentParams = {} 초기화
   → topic마다 빈 객체로 초기화

2. 초기 호출
   → fetchAndPublish(topic, this)
   → datasetInfo.param만 사용

3. Interval 호출
   → fetchAndPublish(topic, this, this.currentParams[topic])
   → datasetInfo.param + currentParams[topic] 병합

4. Param 업데이트 필요 시
   → this.currentParams[topic] = { newValue: ... }
   → 다음 호출 시 자동 반영
```

#### 구현 (page_loaded.js)

**currentParams 초기화**:
```javascript
// Initialize param storage (for dynamic param updates)
this.currentParams = {};

// Register all mappings and fetch initial data (chaining pattern)
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),           // 1. Register
    each(({ topic }) => this.currentParams[topic] = {}), // 2. Init params
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this)) // 3. Fetch
);
```

**Interval에서 currentParams 사용**:
```javascript
this.refreshIntervals[topic] = setInterval(() => {
    // Pass currentParams to support dynamic param updates
    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
}, refreshInterval);
```

#### 실제 사용 예시 (page_before_load.js)

**시나리오 1: 구역 필터 변경**
```javascript
'@zoneFilterChanged': ({ zone }) => {
    // Update param for specific topic
    this.currentParams['sensorData'] = { zone };

    // Immediately refresh with new param
    GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);
}
```

**시나리오 2: 시간 범위 변경**
```javascript
'@timeRangeChanged': ({ startTime, endTime }) => {
    this.currentParams['trends'] = { startTime, endTime };
    GlobalDataPublisher.fetchAndPublish('trends', this, this.currentParams['trends']);
}
```

#### Param 관리 원칙

1. ✅ **관리 주체**: 페이지
2. ✅ **관리 구조**: `this.currentParams[topic]`
3. ✅ **초기화**: loaded에서 빈 객체로 시작
4. ✅ **사용**: `fetchAndPublish(topic, this, this.currentParams[topic])`
5. ✅ **업데이트**: 필요할 때 `this.currentParams[topic] = { ... }`

---

### 3.6. page_before_unload.js

**역할**: 페이지 종료 시 모든 리소스 정리

**핵심 논리**:
> 페이지에서 생성한 모든 리소스는 before_unload 시점에 정리되어야 합니다.
> 메모리 누수를 방지하고, 브라우저 리소스를 확보하기 위함입니다.
> 생성된 것과 1:1 매칭되어 정리되어야 합니다.

**정리 대상**:

#### 1. Interval 정리
```javascript
function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();  // page_loaded.js에서 정의한 메서드 호출
    }
    this.refreshIntervals = null;  // 참조 제거
}
```
- `this.stopAllIntervals()`: 모든 topic의 interval clearInterval
- `this.refreshIntervals = null`: interval ID 저장 객체 정리

#### 2. EventBus 정리
```javascript
function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}
```
- `offEventBusHandlers`: page_before_load.js에서 등록한 핸들러 제거
- `this.eventBusHandlers = null`: 핸들러 객체 정리

#### 3. DataPublisher 정리
```javascript
function clearDataPublisher() {
    go(
        this.globalDataMappings,
        each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
    );

    this.globalDataMappings = null;
    this.currentParams = null;
}
```
- `unregisterMapping`: 각 topic 매핑 해제
- `this.globalDataMappings = null`: 데이터 매핑 정보 정리
- `this.currentParams = null`: param 저장 객체 정리

**실행 순서**:
```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);     // 1. Interval 먼저 중단 (새 요청 방지)
    clearEventBus.call(this);        // 2. 이벤트 핸들러 제거
    clearDataPublisher.call(this);   // 3. 데이터 매핑 해제
}
```

**생성/정리 매칭**:

| 생성 (page_before_load / loaded) | 정리 (page_before_unload) |
|-----------------------------------|---------------------------|
| `this.eventBusHandlers = {...}` | `this.eventBusHandlers = null` |
| `onEventBusHandlers(...)` | `offEventBusHandlers(...)` |
| `this.globalDataMappings = [...]` | `this.globalDataMappings = null` |
| `this.currentParams = {}` | `this.currentParams = null` |
| `this.refreshIntervals = {}` | `this.refreshIntervals = null` |
| `GlobalDataPublisher.registerMapping(...)` | `GlobalDataPublisher.unregisterMapping(...)` |
| `setInterval(...)` | `clearInterval(...)` |

**1:1 매칭 확인**: ✅ 모든 생성된 리소스가 정리됨

---

## 중간 점검: 전체 흐름 정리

### 핵심 흐름 요약

페이지는 **beforeLoad 시점에 사용할 이벤트를 미리 등록**할 것입니다.

그리고 **모든 컴포넌트가 준비된 시점에 데이터를 전달**할 것입니다. 이때 데이터의 네트워크 요청을 중복해서 하기보다는 **여러 컴포넌트가 공유할 데이터를 페이지(컨트롤러)가 속성으로서 가지고 있을 것**입니다.

그리고 그 데이터 정보를 순회하면서 요청하고 **컴포넌트들에게 구독 시스템을 통해 데이터를 전달**할 것입니다.

이 데이터는 **요청 주기가 데이터마다 다를 수 있기 때문에** 각 데이터 정보는 **interval 정보를 가지고 있고**, 최초 요청 이후에 **interval을 모든 데이터를 순회하면서 실행**할 것입니다.

그리고 이 인터벌에 대한 정보를 **나중에 정리할 수 있게 하기 위해 intervals 객체를 topic마다 등록해서 관리**할 것입니다.

또한 **파라미터 또한 요청마다 다를 수 있기 때문에**, 이 파라미터 정보를 **topic마다 가지고 있을 수 있어야 하고**, 그 **관리 주체는 데이터셋 정보를 관리하는 페이지**가 되어야 할 것입니다.

**최초에 currentParams 객체를 데이터셋 정보를 순회하면서 객체에 key로 빈 객체를 우선 할당**할 것입니다. (최초에는 어떻게 사용자가 파라미터를 변경할지 알 수 없기 때문에)

그리고 페이지는 **모든 인터벌을 종료할 수 있는 stop 함수도 가지고 있게 될 것**입니다.

---

### 단계별 상세 흐름

#### 1. before_load: 이벤트 등록
```javascript
// 이벤트 핸들러 미리 등록
this.eventBusHandlers = { '@sensorClicked': ... };
onEventBusHandlers(this.eventBusHandlers);
```
- 컴포넌트 생성 전에 이벤트 준비
- Primitive 조합 패턴 제시

#### 2. Component register: 구독 등록
```javascript
// 컴포넌트가 필요한 topic 구독
GlobalDataPublisher.subscribe('sensorData', this, this.renderData);
```
- 각 컴포넌트가 독립적으로 구독
- 페이지는 컴포넌트 내부를 알 필요 없음

#### 3. loaded: 데이터 발행 준비

**3-1. 데이터셋 정의**
```javascript
this.globalDataMappings = [
    {
        topic: 'sensorData',
        datasetInfo: { datasetName: 'iotapi', param: {...} },
        refreshInterval: 5000  // 각 데이터마다 다른 주기
    },
    {
        topic: 'deviceStatus',
        datasetInfo: { datasetName: 'iotapi', param: {...} },
        refreshInterval: 15000
    }
];
```
- 페이지가 공유 데이터를 속성으로 보유
- 중복 fetch 방지

**3-2. currentParams 초기화**
```javascript
this.currentParams = {};
fx.go(
    this.globalDataMappings,
    each(({ topic }) => this.currentParams[topic] = {})  // 빈 객체로 초기화
);
```
- 최초에는 param 변경을 알 수 없음
- topic별로 빈 객체 준비

**3-3. 최초 데이터 발행**
```javascript
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
```
- 구독자들에게 즉시 데이터 전달

#### 4. Interval 시작

**4-1. Interval 설정**
```javascript
this.startAllIntervals = () => {
    this.refreshIntervals = {};  // Interval ID 저장용

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    // currentParams 병합하여 호출
                    GlobalDataPublisher.fetchAndPublish(
                        topic,
                        this,
                        this.currentParams[topic] || {}
                    );
                }, refreshInterval);
            }
        })
    );
};
```
- 데이터마다 다른 주기로 갱신
- topic별로 interval ID 관리 (정리 위해)

**4-2. Interval 실행**
```javascript
this.startAllIntervals();
```

#### 5. 동적 Param 업데이트 (이벤트 발생 시)

```javascript
// 이벤트 핸들러에서
'@zoneFilterChanged': ({ zone }) => {
    // Param 업데이트
    this.currentParams['sensorData'] = { zone };

    // 즉시 반영
    GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);
}
```
- 다음 interval 호출 시에도 자동 반영
- 페이지가 param 관리 주체

#### 6. before_unload: 정리

```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);     // 1. Interval 중단
    clearEventBus.call(this);        // 2. EventBus 정리
    clearDataPublisher.call(this);   // 3. DataPublisher 정리
}

function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();  // loaded에서 정의한 메서드 호출
    }
    this.refreshIntervals = null;
}

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}

function clearDataPublisher() {
    go(
        this.globalDataMappings,
        each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
    );
    this.globalDataMappings = null;
    this.currentParams = null;
}
```
- 모든 interval 종료 (clearInterval)
- EventBus 핸들러 제거 (offEventBusHandlers)
- GlobalDataPublisher 매핑 해제 (unregisterMapping)
- 모든 참조 제거 (null 할당)
- 생성/정리 1:1 매칭으로 메모리 누수 방지

---

### 핵심 원칙

1. **페이지 = 오케스트레이터**
   - 데이터 정의 (globalDataMappings)
   - Interval 관리 (refreshIntervals)
   - Param 관리 (currentParams)

2. **컴포넌트 = 독립적 구독자**
   - 필요한 topic만 구독
   - 데이터 렌더링만 집중

3. **Topic 기반 pub-sub**
   - 중복 fetch 방지
   - 여러 컴포넌트 공유 가능

4. **동적 확장성**
   - refreshInterval로 주기 조절
   - currentParams로 동적 param
   - 새 topic 추가 용이

---

## 이벤트 실행 구조

### 핵심 개념

컴포넌트는 완성되었다고 가정합니다. (어차피 독립적 요소이기 때문)

사용자가 브라우저에서 컴포넌트를 통해 이벤트를 발생시키면 **브라우저 이벤트가 커스텀 이벤트로 전환**될 것입니다.

beforeLoad에 정의했던 **이벤트 핸들러로 event 객체와 targetInstance로 넘어오게** 됩니다.

이때 **element에 바인딩된 value를 통해 사용자의 의도를 알 수 있습니다**. 이것은 **event object라는 공식적인 객체의 target으로 알 수 있는 표준적인 패턴**입니다.

또한 **targetInstance를 통해 사용자의 입력 이벤트로 전달되지 못하는 인스턴스 정보**도 확인할 수 있습니다. (인스턴스에 등록한 데이터셋 정보, 메소드, 인스턴스에 등록된 property 등)

---

### 이벤트 흐름

#### 1. 컴포넌트에서 이벤트 정의

```javascript
// Component - register
this.customEvents = {
    click: {
        '.sensor-card': '@sensorClicked'  // 브라우저 click → 커스텀 @sensorClicked
    }
};

// 데이터셋 정보 (인스턴스 property)
this.datasetInfo = {
    datasetName: 'iotapi',
    param: { endpoint: '/api/iot/sensors/detail' }
};

// 이벤트 바인딩
WKit.bindEvents(this, this.customEvents);
```

#### 2. HTML 렌더링 (dataset 활용)

```html
<div class="sensor-card"
     data-sensor-id="TEMP-001"
     data-zone="Zone A">
    Temperature: 23.5°C
</div>
```

**베스트 프랙티스**: HTML dataset에 식별자와 단순 값만 저장

#### 3. 사용자 인터랙션

```
사용자 클릭
    ↓
브라우저 click 이벤트 발생
    ↓
WKit.delegate가 감지 (이벤트 위임 패턴)
    ↓
WEventBus.emit('@sensorClicked', { event, targetInstance })
    ↓
페이지 이벤트 핸들러 실행
```

#### 4. 페이지 이벤트 핸들러에서 처리

```javascript
// page_before_load.js
this.eventBusHandlers = {
    '@sensorClicked': async ({ event, targetInstance }) => {
        // === event.target으로 사용자 의도 파악 ===
        // 표준 DOM API 사용
        const { sensorId, zone } = event.target.dataset;
        const value = event.target.value;              // input인 경우
        const textContent = event.target.textContent;  // 텍스트

        console.log(`User clicked: ${sensorId} in ${zone}`);

        // === targetInstance로 인스턴스 정보 활용 ===
        // 1. 데이터셋 정보
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;

            // 2. Primitive 조합
            const detailData = await WKit.fetchData(
                this,
                datasetName,
                { ...param, sensorId }  // param + sensorId 병합
            );

            // 3. 인스턴스 메소드 호출 (컴포넌트에 위임)
            if (targetInstance.showDetail) {
                targetInstance.showDetail(detailData);
            }
        }

        // 4. 인스턴스 property 접근
        const componentId = targetInstance.id;
        const componentName = targetInstance.name;
    }
};
```

---

### event vs targetInstance 비교

| 정보 타입 | event.target | targetInstance |
|-----------|--------------|----------------|
| **사용자 입력** | ✅ value, textContent | ❌ |
| **DOM 속성** | ✅ dataset, classList | ❌ |
| **인스턴스 메타** | ❌ | ✅ id, name |
| **데이터셋 정보** | ❌ | ✅ datasetInfo |
| **인스턴스 메소드** | ❌ | ✅ showDetail(), etc. |
| **커스텀 property** | ❌ | ✅ myCustomProperty |

**상호보완적**: 두 가지가 서로 다른 정보를 제공하여 완전한 컨텍스트 구성

---

### 패턴의 가치

#### 1. 표준성
- **event.target**: 표준 DOM API 사용
- **dataset**: HTML5 표준 data-* 속성
- 추가 학습 비용 없음

#### 2. 관심사 분리
- **event.target**: 사용자 인터랙션 정보
- **targetInstance**: 컴포넌트 메타데이터
- 명확한 책임 구분

#### 3. 유연성
```javascript
// 시나리오 1: 단순 값 전달
'@inputChanged': ({ event }) => {
    const newValue = event.target.value;
    this.currentParams['sensorData'] = { search: newValue };
}

// 시나리오 2: 복잡한 처리
'@sensorClicked': async ({ event, targetInstance }) => {
    const userIntent = event.target.dataset;       // 사용자 의도
    const instanceInfo = targetInstance.datasetInfo; // 인스턴스 정보

    // 두 가지를 조합하여 비즈니스 로직 처리
}
```

#### 4. 컴포넌트 독립성 유지
- 페이지는 인스턴스 정보만 활용
- 컴포넌트 내부 구현 변경에 영향받지 않음
- 느슨한 결합 유지

#### 5. 디버깅 용이성
```javascript
'@sensorClicked': ({ event, targetInstance }) => {
    console.log('User action:', event.target);        // DOM 정보
    console.log('Component:', targetInstance.name);   // 컴포넌트 정보
    // 명확한 컨텍스트로 빠른 문제 파악
}
```

---

### 실전 예시: 센서 상세 보기

**시나리오**: 사용자가 센서 카드 클릭 → 상세 정보 표시

**HTML (컴포넌트 렌더링)**:
```html
<div class="sensor-card"
     data-sensor-id="TEMP-001"
     data-zone="Zone A"
     data-current-value="23.5">
    <h3>Temperature Sensor</h3>
    <p>Current: 23.5°C</p>
</div>
```

**Component**:
```javascript
this.customEvents = {
    click: { '.sensor-card': '@sensorClicked' }
};

this.datasetInfo = {
    datasetName: 'iotapi',
    param: { endpoint: '/api/iot/sensors/detail' }
};

this.showDetail = function(data) {
    // 상세 정보 렌더링
    this.element.querySelector('.detail-panel').innerHTML = `
        <h4>${data.name}</h4>
        <p>24h Trend: ${data.trend}</p>
    `;
}.bind(this);
```

**Page**:
```javascript
'@sensorClicked': async ({ event, targetInstance }) => {
    // 1. 사용자가 클릭한 센서 정보 (event.target)
    const { sensorId, zone, currentValue } = event.target.dataset;

    // 2. 인스턴스의 데이터셋 정보 (targetInstance)
    const { datasetInfo } = targetInstance;
    const { datasetName, param } = datasetInfo;

    // 3. 상세 데이터 fetch
    const detailData = await WKit.fetchData(
        this,
        datasetName,
        { ...param, sensorId, zone }  // 병합
    );

    // 4. 컴포넌트에 렌더링 위임
    targetInstance.showDetail(detailData);

    // 5. 로그 기록 (선택)
    console.log(`[Analytics] User viewed sensor ${sensorId} with value ${currentValue}`);
}
```

**데이터 흐름**:
```
User Click
    ↓
event.target.dataset → { sensorId: 'TEMP-001', zone: 'Zone A' }
    ↓
targetInstance.datasetInfo → { datasetName: 'iotapi', param: {...} }
    ↓
WKit.fetchData(page, 'iotapi', { ...param, sensorId, zone })
    ↓
targetInstance.showDetail(data)
    ↓
UI Updated
```

---

### 프로덕션 레벨 체크리스트

#### ✅ 표준 준수
- [x] 표준 DOM API (event.target)
- [x] HTML5 dataset
- [x] 이벤트 위임 패턴

#### ✅ 성능
- [x] 이벤트 위임으로 리스너 최소화
- [x] 동적 요소 처리 가능
- [x] 메모리 효율적

#### ✅ 유지보수성
- [x] 명확한 책임 분리
- [x] 디버깅 용이
- [x] 확장 가능한 구조

#### ✅ 보안
- [x] 민감 정보는 dataset에 저장 안 함
- [x] 인스턴스 정보는 서버에서 검증
- [x] XSS 방지 (textContent 사용)

---

## 동적 Param 변경 패턴

### 핵심 발견: Stop/Start 불필요!

**초기 가정** (dashboard_example):
> "사용자가 필터를 변경하면 interval을 중단하고, param을 업데이트하고, 다시 시작해야 한다"

```javascript
// ❌ 불필요하게 복잡한 패턴 (dashboard_example)
'@periodFilterChanged': ({ period }) => {
    this.stopAllIntervals();        // 1. 중단

    // 2. 업데이트 & 즉시 호출
    fx.go(this.globalDataMappings, each(({ topic }) => {
        this.currentParams[topic] = { ...this.currentParams[topic], period };
        GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
    }));

    this.startAllIntervals();       // 3. 재시작
}
```

**문제점**:
1. ❌ Interval 주기 리셋 (독립적 주기 깨짐)
2. ❌ 불필요한 복잡성
3. ❌ 성능 저하 (모든 interval 재생성)

---

### 개선된 패턴

**핵심 원리**: `currentParams`는 **참조(Reference)**

```javascript
// Interval 설정 시 (startAllIntervals)
setInterval(() => {
    GlobalDataPublisher.fetchAndPublish(
        topic,
        this,
        this.currentParams[topic]  // ← 참조!
    );
}, refreshInterval);
```

**즉시 호출로 사용자 피드백 + Interval은 자동으로 업데이트된 param 사용**

---

### 패턴 1: 특정 Topic만 영향

**사용 케이스**: Zone 필터 변경 시 sensorData만 영향

```javascript
'@zoneFilterChanged': ({ event }) => {
    const zone = event.target.value;

    // 1. Update currentParams for specific topic
    this.currentParams['sensorData'] = {
        ...this.currentParams['sensorData'],
        zone
    };

    // 2. Immediate fetch - user sees new data right away
    GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);

    // 3. Interval continues automatically with updated param
    // No stop/start needed!
}
```

**동작**:
- ✅ sensorData 즉시 갱신
- ✅ deviceStatus는 영향받지 않음
- ✅ sensorData interval은 다음 주기에 자동으로 새 zone 사용

---

### 패턴 2: 모든 Topic에 영향

**사용 케이스**: 시간 범위 변경 시 모든 데이터 영향

```javascript
'@periodFilterChanged': ({ event }) => {
    const period = event.target.value;  // '24h', '7d', '30d'

    fx.go(
        this.globalDataMappings,
        fx.each(({ topic }) => {
            // 1. Update all topics with new period
            this.currentParams[topic] = {
                ...this.currentParams[topic],
                period
            };

            // 2. Immediate fetch for all topics
            GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
        })
    );

    // 3. All intervals continue with updated params
    // No stop/start needed!
}
```

**동작**:
- ✅ 모든 topic 즉시 갱신
- ✅ 각 interval은 독립적 주기 유지 (5초, 15초 등)
- ✅ 다음 주기에 자동으로 새 period 사용

---

### 타임라인 비교

#### ❌ Stop/Start 패턴 (불필요한 복잡성)

```
T=0:   sensorData interval 시작 (5초 주기)
       deviceStatus interval 시작 (15초 주기)

T=2:   사용자 필터 변경
       stopAllIntervals() → 모든 interval 중단
       currentParams 업데이트
       즉시 fetchAndPublish
       startAllIntervals() → 모든 interval 새로 시작 (0초부터)

T=7:   sensorData interval 실행 (5초 후)
       deviceStatus interval 실행 (5초 후) ← 원래 15초인데!

T=12:  sensorData interval 실행
T=12:  deviceStatus interval 실행
```

**문제**: 독립적 주기가 깨짐 (동기화됨)

---

#### ✅ 개선된 패턴 (간결하고 효율적)

```
T=0:   sensorData interval 시작 (5초 주기)
       deviceStatus interval 시작 (15초 주기)

T=2:   사용자 필터 변경
       currentParams 업데이트
       즉시 fetchAndPublish → 사용자가 바로 새 데이터 봄 ✅

T=5:   sensorData interval 실행
       currentParams 읽음 → 새 값 자동 사용 ✅

T=15:  deviceStatus interval 실행
       currentParams 읽음 → 새 값 자동 사용 ✅

T=10:  sensorData interval 실행
T=20:  sensorData interval 실행
T=30:  deviceStatus interval 실행
```

**장점**:
- ✅ 독립적 주기 유지 (5초, 15초)
- ✅ 즉시 반영 (T=2)
- ✅ 자동 업데이트 (T=5, T=15)

---

### 왜 이렇게 작동하는가?

#### JavaScript 참조(Reference) 방식

```javascript
// 1. Interval 설정
const params = this.currentParams[topic];  // 참조!
setInterval(() => {
    fetchAndPublish(topic, this, params);  // 같은 객체 참조
}, 5000);

// 2. 나중에 업데이트
this.currentParams[topic] = { newValue: 1 };  // 참조 대상 변경

// 3. 다음 interval 실행
// → 자동으로 { newValue: 1 } 사용 ✅
```

**핵심**:
- Interval 중단 불필요
- 참조가 자동으로 업데이트된 값 사용
- 즉시 호출은 사용자 피드백을 위함

---

### 패턴 선택 가이드

| 상황 | 패턴 | 예시 |
|------|------|------|
| **특정 topic만 영향** | Pattern 1 | Zone 필터, Category 필터 |
| **모든 topic 영향** | Pattern 2 | 시간 범위, Period 필터 |
| **여러 param 동시 변경** | Pattern 1 변형 | Date range (start + end) |
| **명시적 완전 리셋** | Stop/Start 사용 | 드물게 필요 (예: 대시보드 초기화) |

---

### 베스트 프랙티스

#### ✅ DO
```javascript
// 1. Update currentParams
this.currentParams[topic] = { ...this.currentParams[topic], newParam };

// 2. Immediate fetch
GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);

// 3. Done! (Interval은 자동으로 처리)
```

#### ❌ DON'T
```javascript
// 불필요하게 복잡
this.stopAllIntervals();
// ... 업데이트 ...
this.startAllIntervals();
```

#### ⚠️ EXCEPTION (드물게)
```javascript
// 명시적 리셋이 필요한 경우만
'@resetDashboard': () => {
    this.stopAllIntervals();
    // ... 완전 리셋 ...
    this.startAllIntervals();
}
```

---

### 구현 위치

**page_before_load.js**에 구현:

```javascript
this.eventBusHandlers = {
    '@sensorClicked': {...},

    // Pattern 1: Specific topic
    '@zoneFilterChanged': ({ event }) => {
        const zone = event.target.value;
        this.currentParams['sensorData'] = { ...this.currentParams['sensorData'], zone };
        GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);
    },

    // Pattern 2: All topics
    '@periodFilterChanged': ({ event }) => {
        const period = event.target.value;
        fx.go(this.globalDataMappings, fx.each(({ topic }) => {
            this.currentParams[topic] = { ...this.currentParams[topic], period };
            GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
        }));
    }
};
```

---

## Interval 주기 변경 기능 평가

### 질문: Interval 주기를 동적으로 변경하는 기능이 필요한가?

**결론**: ❌ **불필요함 (YAGNI 원칙)**

---

### 실제 사용 사례 분석

#### 🤔 언제 필요할 수 있을까?

| 사용 사례 | 예시 | 필요성 평가 |
|-----------|------|-------------|
| **네트워크 상황 대응** | 네트워크 느릴 때 5초 → 10초 | ⚠️ 드물게 필요 |
| **배터리 절약 (모바일)** | 배터리 절약 모드 시 주기 2배 | ⚠️ 특수한 경우만 |
| **탭 포커스 변경** | 백그라운드 시 주기 늘림 | ✅ 실제로 유용할 수 있음 |
| **관리자 동적 조절** | 실시간 모니터링 모드 시 1초 | ⚠️ 특수한 경우만 |

---

### 불필요한 이유

#### 1. **사전 정의로 충분**

```javascript
// 데이터 특성에 맞는 초기 설정으로 해결
this.globalDataMappings = [
    { topic: 'sensorData', refreshInterval: 5000 },    // 실시간 데이터
    { topic: 'deviceStatus', refreshInterval: 15000 }, // 중기 데이터
    { topic: 'trends', refreshInterval: 60000 }        // 통계 데이터
];
```

**장점**:
- ✅ 데이터 특성에 최적화된 주기
- ✅ 단순하고 명확
- ✅ 변경 불필요

---

#### 2. **사용자가 조절할 이유가 없음**

**사용자의 관심사**:
- ✅ "데이터를 본다"
- ✅ "필터를 변경한다"
- ❌ "갱신 주기를 조절한다" ← 기술적인 세부사항

**결론**: 일반 사용자에게 노출할 필요 없음

---

#### 3. **복잡도 증가**

**Param 변경 (간단)**:
```javascript
// 2단계만
this.currentParams[topic] = { newParam };
GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
```

**Interval 주기 변경 (복잡)**:
```javascript
// 3단계 + 복잡한 상태 관리
this.stopAllIntervals();
this.globalDataMappings[0].refreshInterval = 10000;
this.startAllIntervals();
// + refreshInterval 저장/복원 로직 필요
```

**복잡도 비교**:

| 기능 | 복잡도 | 실용성 | 권장 |
|------|--------|--------|------|
| **Param 변경** | 낮음 | 매우 높음 | ✅ 필수 |
| **Interval on/off** | 낮음 | 높음 | ✅ 유용 |
| **Interval 주기 변경** | 높음 | 매우 낮음 | ❌ 불필요 |

---

### ✅ 유용한 대안: Visibility API

**유일하게 실용적인 케이스**: 탭 포커스 감지

#### 옵션 1: 완전 중단/재시작 (권장)

```javascript
// 더 단순하고 효과적
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 백그라운드: 모든 interval 중단
        this.stopAllIntervals();
    } else {
        // 포그라운드: interval 재시작 + 즉시 갱신
        this.startAllIntervals();

        // 즉시 최신 데이터 fetch
        fx.go(
            this.globalDataMappings,
            fx.each(({ topic }) => {
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
            })
        );
    }
});
```

**장점**:
- ✅ 리소스 절약 (백그라운드에서 요청 없음)
- ✅ 서버 부하 감소
- ✅ 단순함 (주기 변경 불필요)
- ✅ 사용자 경험 개선 (복귀 시 즉시 갱신)

#### 옵션 2: 주기 변경 (복잡, 불필요)

```javascript
// 복잡하고 효과도 애매함
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.stopAllIntervals();
        // 모든 주기를 60초로 변경
        this.globalDataMappings.forEach(m => {
            m.originalInterval = m.refreshInterval;
            m.refreshInterval = 60000;
        });
        this.startAllIntervals();
    } else {
        this.stopAllIntervals();
        // 원래 주기로 복원
        this.globalDataMappings.forEach(m => {
            m.refreshInterval = m.originalInterval;
        });
        this.startAllIntervals();
    }
});
```

**단점**:
- ❌ 복잡함
- ❌ 상태 관리 필요 (originalInterval)
- ❌ 버그 가능성 증가
- ❌ 옵션 1과 효과 비슷

---

### 권장 접근 단계

#### Phase 1: 고정 Interval (현재)

```javascript
// 데이터 특성에 맞는 최적 주기로 고정
this.globalDataMappings = [
    { topic: 'sensorData', refreshInterval: 5000 },
    { topic: 'deviceStatus', refreshInterval: 15000 }
];
```

**충분한 이유**:
- ✅ 대부분의 경우에 적합
- ✅ 단순하고 안정적
- ✅ 유지보수 용이

---

#### Phase 2: Visibility 지원 (선택)

```javascript
// 탭 포커스 변경 시 on/off만
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.stopAllIntervals();
    } else {
        this.startAllIntervals();
        // 즉시 갱신
    }
});
```

**추가 조건**:
- 리소스 절약이 중요한 경우
- 모바일 환경 지원
- 서버 부하 관리 필요

---

#### Phase 3: 동적 주기 변경 (거의 불필요)

**99%의 경우 필요 없음**

**추가 조건** (모두 만족해야 함):
1. 실제 사용자 요구사항 존재
2. Visibility API로 해결 불가능
3. 복잡도 증가를 감수할 가치 있음

**예시** (극히 드문 케이스):
- 관리자가 실시간으로 모니터링 강도 조절
- 네트워크 품질에 따른 자동 조절

---

### YAGNI 원칙 (You Aren't Gonna Need It)

> "필요할 때 추가하라. 미리 추가하지 마라."

**현재 상황**:
- ✅ Param 변경: 명확히 필요함 → 구현 완료
- ✅ Interval on/off: 유용할 수 있음 → 선택적 구현
- ❌ Interval 주기 변경: 필요성 불명확 → **구현하지 말 것**

**철학**:
```
복잡도는 실제 필요성이 증명될 때만 추가한다.
예측으로 추가하지 않는다.
```

---

### 최종 권장사항

#### ✅ DO

1. **데이터 특성에 맞는 고정 주기 설정**
   ```javascript
   refreshInterval: 5000  // 실시간
   refreshInterval: 60000 // 통계
   ```

2. **Param 변경 패턴 사용**
   ```javascript
   // 사용자 필터 변경
   this.currentParams[topic] = { newParam };
   GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
   ```

3. **Visibility API (선택)**
   ```javascript
   // 탭 포커스 변경 시 on/off
   document.addEventListener('visibilitychange', ...);
   ```

#### ❌ DON'T

1. **Interval 주기 동적 변경 기능 추가하지 말 것**
   - 복잡도만 증가
   - 실제 필요성 없음
   - 나중에 진짜 필요하면 그때 추가

2. **사용자에게 기술적 세부사항 노출하지 말 것**
   - "갱신 주기 선택" UI 불필요
   - 사용자는 데이터만 보면 됨

---

## 현재 진행 상황

### ✅ 완료
- [x] 시나리오 구상 (IoT 모니터링 대시보드)
- [x] API 서버 구축 (IOT_API/)
  - 8개 API 엔드포인트
  - 다양한 갱신 주기 시뮬레이션
  - 실시간 데이터 생성 로직
- [x] page_before_load.js 템플릿
  - 이벤트 핸들러 등록
  - Primitive 조합 패턴
  - Param 업데이트 예시 (주석)
- [x] page_loaded.js 템플릿
  - 데이터 매핑 및 발행
  - Interval 관리 (startAllIntervals, stopAllIntervals)
  - Param 관리 (currentParams)
  - Topic별 독립적 갱신 주기
- [x] page_before_unload.js 템플릿
  - Interval 정리 (stopAllIntervals, refreshIntervals = null)
  - EventBus 정리 (offEventBusHandlers, eventBusHandlers = null)
  - DataPublisher 정리 (unregisterMapping, globalDataMappings = null, currentParams = null)
  - 생성/정리 1:1 매칭 완료

### ⏳ 다음 단계 (즉시 진행 필요)
- [ ] 컴포넌트 템플릿 1개 작성 (10-15분)
  - Subscribe 패턴
  - 데이터 렌더링
  - Destroy 정리
- [ ] **실제 통합 및 동작 검증** ← 중요!
  - 페이지 생성
  - 컴포넌트 추가
  - 데이터 흐름 확인
  - Interval 동작 확인
  - 메모리 누수 검증

---

## 설계 철학

### Primitive Building Blocks 원칙

프레임워크는 최소한의 primitive만 제공하고, 조합은 사용자에게 맡긴다.

**DO**:
- ✅ `WKit.fetchData(page, datasetName, param)` - 데이터 fetch
- ✅ `WKit.getInstanceByName(name, iter)` - 인스턴스 검색
- ✅ `GlobalDataPublisher.fetchAndPublish(topic, page)` - 데이터 발행

**사용자가 직접 조합**:
```javascript
const { datasetInfo } = targetInstance;
if (datasetInfo) {
    const { datasetName, param } = datasetInfo;
    const data = await WKit.fetchData(this, datasetName, param);
    // 사용자가 원하는 대로 처리
}
```

### 독립적 작업 단위

각 라이프사이클 단계를 독립적으로 개발하여:
- 각 단계의 책임이 명확
- 점진적 검증 가능
- 유지보수 용이

### 템플릿 기반 개발

- 빈 구조 + 샘플 하나로 명확한 가이드 제공
- 복사-붙여넣기로 확장 가능
- 5-10분 내 새 컴포넌트/페이지 추가 가능

---

## 다음 단계 - 검증으로 전환

### 즉시 수행 (템플릿 완성)

1. **page_before_unload.js 작성** (5분)
   - `stopAllIntervals()` 호출
   - `GlobalDataPublisher.unregisterMapping()` 호출
   - `offEventBusHandlers()` 호출
   - currentParams, refreshIntervals 정리

2. **컴포넌트 템플릿 1개** (10-15분)
   - Subscribe 패턴 (`GlobalDataPublisher.subscribe`)
   - 간단한 데이터 렌더링 (console.log 수준)
   - Destroy 정리 (`unsubscribe`)
   - 예시: SensorCard 컴포넌트

### 필수 검증 단계 (템플릿 완성 즉시)

3. **통합 및 동작 검증** ← **매우 중요!**

   **검증 항목**:
   - [ ] API 서버와 프레임워크 연결 확인
   - [ ] iotapi 데이터셋 처리 확인
   - [ ] Topic 기반 pub-sub 동작 확인
   - [ ] Interval 정상 작동 (5초, 15초 주기)
   - [ ] Param 병합 동작 확인
   - [ ] before_unload에서 정리 확인
   - [ ] 메모리 누수 없는지 확인

   **검증 방법**:
   - 최소 구성으로 시작 (페이지 1개 + 컴포넌트 1개)
   - 브라우저 콘솔에서 데이터 흐름 확인
   - DevTools로 interval 개수 확인
   - 페이지 이동 후 interval 정리 확인

   **예상 소요 시간**: 20-30분

### 검증 후 확장

4. **추가 컴포넌트 작성** (검증 성공 시)
   - AlertPanel
   - DeviceList
   - TrendChart
   - 각 컴포넌트별 10분 내외

5. **패턴 문서화**
   - 발견한 문제점 정리
   - 베스트 프랙티스 정리
   - CLAUDE.md 업데이트

---

## 중요 경고

**지금까지 논리적으로는 완벽하지만, 실제 동작은 미검증 상태입니다.**

**다음 조치**:
1. ✅ before_unload 템플릿 완성
2. ✅ 컴포넌트 템플릿 1개 완성
3. 🚨 **즉시 통합 검증으로 전환**
4. ❌ 더 이상 템플릿만 만들지 말 것

**목표**: 30-40분 내로 "동작하는 대시보드" 완성

---

## 현재 구현 수준 평가

### 논리성: 9/10 (거의 완벽)

**✅ 강점**:
- 체계적인 사고 흐름 (시나리오 → API → 페이지 스크립트)
- 일관된 패턴 (dashboard_example 참고)
- 명확한 책임 분리 (before_load, loaded, before_unload)
- 확장 가능한 구조 (currentParams, topic별 interval)
- 논리적 비약 없음

**⚠️ 약점**:
- GlobalDataPublisher 실제 동작 미검증
- iotapi 데이터셋 처리 방식 미확인

### 실용성: 6/10 (현재) → 8-9/10 (잠재적)

**❌ 현재 문제**:
- 템플릿만 있고 실행해본 적 없음
- API 서버와 프레임워크 미연결
- 컴포넌트 하나도 없음
- 예상치 못한 통합 문제 가능성

**✅ 하지만 거의 완성**:
```
✅ before_load 완성
✅ loaded 완성 (interval + param)
⏳ before_unload (5분)
⏳ 컴포넌트 1개 (10-15분)
⏳ 통합 검증 (20-30분)
───────────────────────────
총 35-50분이면 동작 확인 가능
```

### 위험 요소

1. **템플릿 함정** (낮음)
   - 계속 템플릿만 만들 위험
   - 하지만 before_unload만 남음

2. **통합 문제** (중간)
   - 프레임워크 API가 예상과 다를 수 있음
   - dashboard_example 참고했으므로 위험 감소

3. **iotapi 데이터셋** (높음)
   - 프레임워크가 어떻게 처리할지 불명확
   - **조기 검증 필요**

### 결론

**논리적 완성도**: 거의 완벽
**실용적 완성도**: 아직 낮음, 하지만 통합 검증 임박

**다음 행동**:
1. ✅ ~~before_unload 빠르게 완성~~ (완료)
2. 컴포넌트 1개 최소 구현
3. **즉시 통합 검증** ← 가장 중요
4. 문제 발견 시 수정
5. 그 후 확장

---

**작성 일시**: 2025-11-21
**최종 업데이트**: page_before_unload.js 완성, 리소스 정리 패턴 추가
