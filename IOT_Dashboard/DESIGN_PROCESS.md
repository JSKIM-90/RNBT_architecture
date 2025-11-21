# IoT 모니터링 대시보드 - 설계 문서

런타임 프레임워크의 다중 갱신 주기 패턴을 검증하기 위한 IoT 대시보드 예제

---

## 목표

**핵심 검증 사항**:
- 다중 갱신 주기 패턴 (실시간, 단기, 중기, 정적)
- 페이지 레벨 interval 관리
- 컴포넌트 독립성 유지
- 템플릿 기반 개발 용이성

---

## 설계 철학

### Primitive Building Blocks 원칙

프레임워크는 최소한의 primitive만 제공하고, 조합은 사용자에게 맡긴다.

**프레임워크가 제공하는 것**:
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

각 라이프사이클 단계를 독립적으로 개발:
- 각 단계의 책임이 명확
- 점진적 검증 가능
- 유지보수 용이

### 템플릿 기반 개발

- 빈 구조 + 샘플 하나로 명확한 가이드 제공
- 복사-붙여넣기로 확장 가능
- 5-10분 내 새 컴포넌트/페이지 추가 가능

---

## 시나리오 구상

### 선택한 도메인: 스마트 팩토리 환경 모니터링

**배경**: 공장 내 여러 구역에 설치된 센서들을 모니터링하고 관리하는 대시보드

### 데이터 카테고리 (갱신 주기별)

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
│  └─ TrendChart (🟢 시간별 트렌드 차트)
│
└─ Right Panel
   ├─ RecentEvents (🟡 최근 이벤트 로그)
   └─ ZoneStatistics (🟢 구역별 통계)
```

---

## API 서버 구축

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

## 페이지 라이프사이클 구현

### 5.1. page_before_load.js

**역할**: 컴포넌트 생성 전 초기 설정

**핵심 논리**:
> 컴포넌트는 독립적이고, 페이지에서 정의할 이벤트도 사용자 정의입니다.
> 이벤트가 정의될 영역을 빈 구조로 제공하고, 샘플로 패턴을 명시합니다.

**구현 특징**:
- ✅ 빈 구조 제공 (`this.eventBusHandlers = {}`)
- ✅ 샘플 하나로 패턴 명시
- ✅ Primitive 조합 방식 표현
- ✅ 선택적 기능은 주석 처리

**코드 예시**:
```javascript
const { onEventBusHandlers, fetchData } = WKit;

this.eventBusHandlers = {
    // 샘플: Primitive 조합 패턴
    '@sensorClicked': async ({ event, targetInstance }) => {
        const { datasetInfo } = targetInstance;
        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            // TODO: 데이터 처리
        }
    },

    // Param 업데이트 패턴 (아래 "고급 패턴" 섹션 참조)
    '@zoneFilterChanged': ({ event }) => {
        const zone = event.target.value;
        this.currentParams['sensorData'] = {
            ...this.currentParams['sensorData'],
            zone
        };
        GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);
    }
};

onEventBusHandlers(this.eventBusHandlers);
```

---

### 5.2. page_loaded.js

**역할**: 모든 컴포넌트 completed 후 데이터 발행 및 갱신 관리

**핵심 논리**:
> 페이지는 컴포넌트가 공유할 데이터를 속성으로 정의하고,
> 구독자들에게 데이터를 전달합니다.
> 데이터마다 갱신 주기가 다를 수 있으므로 독립적인 interval을 관리합니다.

#### 데이터 매핑 정의

```javascript
this.globalDataMappings = [
    {
        topic: 'sensorData',
        datasetInfo: {
            datasetName: 'iotapi',
            param: { endpoint: '/api/iot/realtime/sensors/current' }
        },
        refreshInterval: 5000  // 5초 주기
    },
    {
        topic: 'deviceStatus',
        datasetInfo: {
            datasetName: 'iotapi',
            param: { endpoint: '/api/iot/shortterm/devices/status' }
        },
        refreshInterval: 15000  // 15초 주기
    }
];
```

**refreshInterval 있으면**: 주기적 갱신
**refreshInterval 없으면**: 한 번만 fetch

#### Param 관리

**문제**: param은 호출 시점마다 달라질 수 있어야 함 (필터, 시간 범위 등)

**해결**: `this.currentParams`로 topic별 param 관리

```javascript
// Initialize param storage
this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),           // 1. Register
    each(({ topic }) => this.currentParams[topic] = {}), // 2. Init params
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this)) // 3. Fetch
);
```

**관리 주체**: 페이지 (데이터셋 정보를 소유하므로)
**관리 구조**: `this.currentParams[topic]`
**사용**: `fetchAndPublish(topic, this, this.currentParams[topic])`

#### Interval 관리

**목적**: 각 topic마다 독립적인 갱신 주기 유지

```javascript
this.startAllIntervals = () => {
    this.refreshIntervals = {};  // Interval ID 저장용

    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval }) => {
            if (refreshInterval) {
                this.refreshIntervals[topic] = setInterval(() => {
                    // currentParams 병합하여 호출 (참조!)
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

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

this.startAllIntervals();  // 실행
```

**핵심**: `currentParams`는 참조이므로 interval 재시작 불필요 (고급 패턴에서 상세 설명)

---

### 5.3. page_before_unload.js

**역할**: 페이지 종료 시 모든 리소스 정리

**핵심 논리**:
> 생성된 모든 리소스는 1:1 매칭으로 정리되어야 합니다.
> 메모리 누수 방지 및 브라우저 리소스 확보.

#### 정리 순서

```javascript
function onPageUnLoad() {
    stopAllIntervals.call(this);     // 1. Interval 먼저 중단 (새 요청 방지)
    clearEventBus.call(this);        // 2. EventBus 정리
    clearDataPublisher.call(this);   // 3. DataPublisher 정리
}
```

#### 1. Interval 정리

```javascript
function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();  // loaded에서 정의한 메서드 호출
    }
    this.refreshIntervals = null;
}
```

#### 2. EventBus 정리

```javascript
function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}
```

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

#### 생성/정리 매칭 테이블

| 생성 (before_load / loaded) | 정리 (before_unload) |
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

## 완전한 라이프사이클 흐름

### 전체 흐름 요약

```
[Page - before_load]
  → 이벤트 핸들러 등록 (onEventBusHandlers)
  → 이벤트 준비 완료

[Component - register]
  → GlobalDataPublisher.subscribe() (구독 등록)
  → 데이터 수신 준비 완료

[Page - loaded]
  → 데이터셋 정의 (globalDataMappings)
  → currentParams 초기화
  → GlobalDataPublisher.registerMapping()
  → 최초 데이터 발행 (fetchAndPublish)
  → Interval 시작 (startAllIntervals)
  → 구독자들에게 데이터 자동 전파

[User Interaction]
  → DOM Event
  → WEventBus.emit()
  → Page EventBus Handler
  → currentParams 업데이트
  → 즉시 fetchAndPublish
  → 다음 interval에서 자동으로 새 param 사용

[Page - before_unload]
  → stopAllIntervals() (모든 interval 중단)
  → offEventBusHandlers() (이벤트 정리)
  → unregisterMapping() (DataPublisher 정리)
  → 모든 참조 제거 (null 할당)
```

### 핵심 원칙

1. **페이지 = 오케스트레이터**
   - 데이터 정의 (globalDataMappings)
   - Interval 관리 (refreshIntervals)
   - Param 관리 (currentParams)

2. **컴포넌트 = 독립적 구독자**
   - 필요한 topic만 구독
   - 데이터 렌더링만 집중
   - 페이지의 내부 구조 몰라도 됨

3. **Topic 기반 pub-sub**
   - 중복 fetch 방지
   - 여러 컴포넌트 공유 가능
   - 느슨한 결합

4. **동적 확장성**
   - refreshInterval로 주기 조절
   - currentParams로 동적 param
   - 새 topic 추가 용이

---

## 이벤트 실행 구조

### event vs targetInstance

사용자 이벤트 발생 시 두 가지 정보가 제공됩니다:

| 정보 타입 | event.target | targetInstance |
|-----------|--------------|----------------|
| **사용자 입력** | ✅ value, textContent | ❌ |
| **DOM 속성** | ✅ dataset, classList | ❌ |
| **인스턴스 메타** | ❌ | ✅ id, name |
| **데이터셋 정보** | ❌ | ✅ datasetInfo |
| **인스턴스 메소드** | ❌ | ✅ showDetail(), etc. |

**상호보완적**: 두 가지가 서로 다른 정보를 제공하여 완전한 컨텍스트 구성

### 이벤트 흐름

```
사용자 클릭
    ↓
브라우저 click 이벤트 발생
    ↓
WKit.delegate가 감지 (이벤트 위임)
    ↓
WEventBus.emit('@sensorClicked', { event, targetInstance })
    ↓
페이지 이벤트 핸들러 실행
```

### 실전 예시

**컴포넌트 (HTML)**:
```html
<div class="sensor-card"
     data-sensor-id="TEMP-001"
     data-zone="Zone A">
    Temperature: 23.5°C
</div>
```

**컴포넌트 (register)**:
```javascript
this.customEvents = {
    click: { '.sensor-card': '@sensorClicked' }
};

this.datasetInfo = {
    datasetName: 'iotapi',
    param: { endpoint: '/api/iot/sensors/detail' }
};

WKit.bindEvents(this, this.customEvents);
```

**페이지 (before_load)**:
```javascript
'@sensorClicked': async ({ event, targetInstance }) => {
    // 1. 사용자가 클릭한 센서 정보 (event.target)
    const { sensorId, zone } = event.target.dataset;

    // 2. 인스턴스의 데이터셋 정보 (targetInstance)
    const { datasetInfo } = targetInstance;
    const { datasetName, param } = datasetInfo;

    // 3. 상세 데이터 fetch
    const data = await WKit.fetchData(
        this,
        datasetName,
        { ...param, sensorId, zone }
    );

    // 4. 컴포넌트에 렌더링 위임
    if (targetInstance.showDetail) {
        targetInstance.showDetail(data);
    }
}
```

### 패턴의 가치

1. **표준성**: 표준 DOM API 사용 (event.target, dataset)
2. **관심사 분리**: 사용자 의도(event) vs 컴포넌트 메타(targetInstance)
3. **유연성**: 단순 값 전달부터 복잡한 처리까지 가능
4. **컴포넌트 독립성**: 페이지는 인스턴스 정보만 활용
5. **디버깅 용이성**: 명확한 컨텍스트

---

## 고급 패턴

### 8.1. 동적 Param 변경 패턴

#### 핵심 발견: Stop/Start 불필요!

**초기 가정** (dashboard_example 안티패턴):
> "param 변경 시 interval을 중단하고, 업데이트하고, 다시 시작해야 한다"

**문제점**:
- ❌ Interval 주기 리셋 (독립적 주기 깨짐)
- ❌ 불필요한 복잡성
- ❌ 성능 저하

**개선된 패턴 - 핵심 원리**:

`currentParams`는 **참조(Reference)**입니다.

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

#### 패턴 1: 특정 Topic만 영향

```javascript
'@zoneFilterChanged': ({ event }) => {
    const zone = event.target.value;

    // 1. Update currentParams
    this.currentParams['sensorData'] = {
        ...this.currentParams['sensorData'],
        zone
    };

    // 2. Immediate fetch - 사용자가 즉시 새 데이터 봄
    GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);

    // 3. Interval은 자동으로 업데이트된 param 사용
    // No stop/start needed!
}
```

#### 패턴 2: 모든 Topic에 영향

```javascript
'@periodFilterChanged': ({ event }) => {
    const period = event.target.value;

    fx.go(
        this.globalDataMappings,
        fx.each(({ topic }) => {
            this.currentParams[topic] = {
                ...this.currentParams[topic],
                period
            };
            GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
        })
    );

    // All intervals continue with updated params!
}
```

#### 타임라인 비교

**❌ Stop/Start (불필요한 복잡성)**:
```
T=0:   sensorData (5초), deviceStatus (15초) 시작
T=2:   사용자 필터 변경
       → stopAllIntervals()
       → startAllIntervals()  ← 모든 interval 0초부터 재시작
T=7:   sensorData (5초), deviceStatus (5초)  ← 동기화됨! 문제!
```

**✅ 개선된 패턴**:
```
T=0:   sensorData (5초), deviceStatus (15초) 시작
T=2:   사용자 필터 변경
       → currentParams 업데이트
       → 즉시 fetchAndPublish  ← 사용자가 바로 봄
T=5:   sensorData interval → 새 param 자동 사용 ✅
T=15:  deviceStatus interval → 새 param 자동 사용 ✅
```

**장점**:
- ✅ 독립적 주기 유지 (5초, 15초)
- ✅ 즉시 반영
- ✅ 자동 업데이트

#### 베스트 프랙티스

**✅ DO**:
```javascript
this.currentParams[topic] = { ...this.currentParams[topic], newParam };
GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
```

**❌ DON'T**:
```javascript
this.stopAllIntervals();
// ... 업데이트 ...
this.startAllIntervals();  // 불필요!
```

---

### 8.2. Interval 주기 변경 기능 평가

**질문**: Interval 주기를 동적으로 변경하는 기능이 필요한가?

**결론**: ❌ **불필요함 (YAGNI 원칙)**

#### 불필요한 이유

**1. 사전 정의로 충분**:
```javascript
this.globalDataMappings = [
    { topic: 'sensorData', refreshInterval: 5000 },    // 실시간
    { topic: 'deviceStatus', refreshInterval: 15000 }, // 중기
    { topic: 'trends', refreshInterval: 60000 }        // 통계
];
```

**2. 사용자가 조절할 이유가 없음**:
- 사용자 관심사: "데이터를 본다", "필터를 변경한다"
- 기술적 세부사항: "갱신 주기" ← 노출 불필요

**3. 복잡도만 증가**:

| 기능 | 복잡도 | 실용성 | 권장 |
|------|--------|--------|------|
| Param 변경 | 낮음 | 매우 높음 | ✅ 필수 |
| Interval on/off | 낮음 | 높음 | ✅ 유용 |
| Interval 주기 변경 | 높음 | 매우 낮음 | ❌ 불필요 |

#### 유용한 대안: Visibility API

**유일하게 실용적인 케이스**: 탭 포커스 감지

```javascript
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        this.stopAllIntervals();  // 백그라운드: interval 중단
    } else {
        this.startAllIntervals();  // 포그라운드: 재시작
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
- ✅ 리소스 절약
- ✅ 서버 부하 감소
- ✅ 단순함
- ✅ 사용자 경험 개선

#### YAGNI 원칙

> "필요할 때 추가하라. 미리 추가하지 마라."

**현재 상황**:
- ✅ Param 변경: 명확히 필요함 → 구현 완료
- ✅ Interval on/off: 유용할 수 있음 → 선택적 구현
- ❌ Interval 주기 변경: 필요성 불명확 → **구현하지 말 것**

---

## 현재 상황 및 다음 단계

### ✅ 완료

- [x] **시나리오 구상** (IoT 모니터링 대시보드)
- [x] **API 서버 구축** (IOT_API/)
  - 8개 API 엔드포인트
  - 다양한 갱신 주기 시뮬레이션
  - 실시간 데이터 생성 로직
- [x] **page_before_load.js 템플릿**
  - 이벤트 핸들러 등록
  - Primitive 조합 패턴
  - Param 업데이트 예시
- [x] **page_loaded.js 템플릿**
  - 데이터 매핑 및 발행
  - Interval 관리 (startAllIntervals, stopAllIntervals)
  - Param 관리 (currentParams)
  - Topic별 독립적 갱신 주기
- [x] **page_before_unload.js 템플릿**
  - Interval 정리
  - EventBus 정리
  - DataPublisher 정리
  - 생성/정리 1:1 매칭 완료

### ⏳ 다음 단계

1. **컴포넌트 템플릿 1개** (10-15분)
   - Subscribe 패턴
   - 데이터 렌더링
   - Destroy 정리

2. **실제 통합 및 동작 검증** ← 중요!
   - API 서버와 프레임워크 연결 확인
   - Topic 기반 pub-sub 동작 확인
   - Interval 정상 작동 (5초, 15초 주기)
   - Param 병합 동작 확인
   - 메모리 누수 검증

3. **추가 컴포넌트 작성** (검증 성공 시)
   - AlertPanel
   - DeviceList
   - TrendChart

4. **패턴 문서화**
   - 발견한 문제점 정리
   - 베스트 프랙티스 정리
   - CLAUDE.md 업데이트

### 평가

**논리적 완성도**: 9/10 (거의 완벽)
- ✅ 체계적인 설계
- ✅ 일관된 패턴
- ✅ 명확한 책임 분리
- ⚠️ 실제 동작 미검증

**실용적 완성도**: 6/10 (현재) → 8-9/10 (잠재적)
- ✅ 페이지 템플릿 완성
- ❌ 컴포넌트 미구현
- ❌ 통합 검증 필요

**다음 행동**:
1. 컴포넌트 1개 최소 구현
2. **즉시 통합 검증** ← 가장 중요
3. 문제 발견 시 수정
4. 그 후 확장

---

**작성 일시**: 2025-11-21
**최종 업데이트**: 문서 구조 재조립 (처음 보는 사람 기준 흐름 개선)
