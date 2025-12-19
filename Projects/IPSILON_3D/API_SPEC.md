# IPSILON_3D API 명세

**Base URL**: `http://localhost:3003`

---

## API - 컴포넌트 기능 매핑

| API | 호출 시점 | 컴포넌트 | 기능 |
|-----|----------|----------|------|
| `GET /api/assets/summary` | 페이지 초기화 | Page | Summary만 조회 (타입 목록) |
| `GET /api/assets` | 페이지 로드 | Page | 전체 자산 목록 조회 |
| `GET /api/assets?type=sensor` | 타입 펼침 | Page | 해당 타입 자산만 조회 |
| `GET /api/asset/:id` | 개별 조회 | - | 단일 자산 조회 (404 if not found) |
| `POST /api/assets/validate` | 페이지 로드 완료 후 | OpenPageCommand | 배치 자산 유효성 검증 |
| `GET /api/sensor/:id` | 3D 센서 클릭 | TemperatureSensor | 센서 현재 상태 표시 |
| `GET /api/sensor/:id/history` | 3D 센서 클릭 | TemperatureSensor | 차트 렌더링 |
| `GET /api/sensor/:id/alerts` | - | (확장용) | 알림 목록 표시 |
| `GET /api/sensor/:id/history?period=` | - | (확장용) | 차트 기간 변경 (24h/7d/30d) |

> **Note**: TemperatureSensor는 자기 완결 컴포넌트로, 클릭 시 내부에서 직접 데이터를 조회합니다.

---

## 1. 자산 Summary 조회

페이지 초기화 시 타입별/상태별 자산 수만 조회합니다. (자산 목록 없음)

### Request

```
GET /api/assets/summary
```

### Response

```json
{
  "data": {
    "summary": {
      "total": 30,
      "byType": {
        "sensor": 12,
        "server": 8,
        "rack": 4,
        "cooling": 2,
        "power": 2,
        "network": 2
      },
      "byStatus": {
        "normal": 26,
        "warning": 3,
        "critical": 1
      }
    }
  }
}
```

### Response Fields - Summary

| Field | Type | Description |
|-------|------|-------------|
| total | number | 전체 자산 수 |
| byType | object | 타입별 자산 수 |
| byStatus | object | 상태별 자산 수 |

### 사용 시점

```
프론트 초기화 → GET /api/assets/summary (타입 목록 표시)
사용자가 sensor 펼침 → GET /api/assets?type=sensor (해당 타입 자산만)
```

---

## 2. 전체 자산 조회

데이터센터 내 자산 목록을 조회합니다. 타입 필터 지원.

### Request

```
GET /api/assets
GET /api/assets?type=sensor
GET /api/assets?type=sensor,server
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | - | 자산 타입 필터 (콤마로 복수 지정 가능) |

**지원하는 타입:**
- `sensor` - 온도/습도 센서
- `server` - 서버 장비
- `rack` - 랙
- `cooling` - 냉각 장치 (CRAC)
- `power` - 전력 장치 (PDU)
- `network` - 네트워크 장비 (스위치)

### Response

```json
{
  "data": {
    "assets": [
      {
        "id": "sensor-001",
        "type": "sensor",
        "name": "Temperature Sensor A-1",
        "zone": "Zone-A",
        "status": "normal"
      },
      {
        "id": "server-001",
        "type": "server",
        "name": "Server A-1",
        "zone": "Zone-A",
        "status": "normal"
      }
    ],
    "summary": {
      "total": 30,
      "byType": {
        "sensor": 12,
        "server": 8,
        "rack": 4,
        "cooling": 2,
        "power": 2,
        "network": 2
      },
      "byStatus": {
        "normal": 26,
        "warning": 3,
        "critical": 1
      }
    }
  }
}
```

**참고:** `?type=sensor` 필터 사용 시 summary도 **필터링된 자산 기준**으로 계산됩니다.

```json
// GET /api/assets?type=sensor 응답 예시
{
  "data": {
    "assets": [...],  // sensor 타입만 12개
    "summary": {
      "total": 12,
      "byType": { "sensor": 12 },
      "byStatus": { "normal": 8, "warning": 3, "critical": 1 }
    }
  }
}
```

### Response Fields - Asset

| Field | Type | Description |
|-------|------|-------------|
| id | string | 자산 ID |
| type | string | 자산 타입 |
| name | string | 자산 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |

### Response Fields - Summary

| Field | Type | Description |
|-------|------|-------------|
| total | number | (필터링된) 자산 수 |
| byType | object | 타입별 자산 수 |
| byStatus | object | 상태별 자산 수 |

---

## 3. 개별 자산 조회

단일 자산의 존재 여부를 확인합니다.

### Request

```
GET /api/asset/:id
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | ✓ | 자산 ID (path) |

### Response (200 OK)

```json
{
  "data": {
    "id": "sensor-001",
    "type": "sensor",
    "name": "Temperature Sensor A-1",
    "zone": "Zone-A",
    "status": "normal"
  }
}
```

### Response (404 Not Found)

```json
{
  "error": "Asset not found",
  "id": "invalid-id"
}
```

---

## 4. 배치 자산 유효성 검증

여러 자산 ID의 유효성을 한 번에 검증합니다.

### Request

```
POST /api/assets/validate
Content-Type: application/json
```

```json
{
  "ids": ["sensor-001", "sensor-002", "invalid-id", "server-001"]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| ids | string[] | ✓ | 검증할 자산 ID 배열 |

### Response

```json
{
  "data": {
    "validIds": ["sensor-001", "sensor-002", "server-001"],
    "invalidIds": ["invalid-id"]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| validIds | string[] | 유효한 (존재하는) 자산 ID 목록 |
| invalidIds | string[] | 유효하지 않은 자산 ID 목록 |

### 사용 시점

페이지 로드 완료 후 `OpenPageCommand`에서 호출하여, 저장된 인스턴스의 assetId가 유효한지 검증합니다.

```javascript
// Editor: 유효하지 않은 assetId를 가진 인스턴스 자동 삭제
// Viewer: 유효하지 않은 assetId를 가진 인스턴스 경고 로그만 출력
```

### 설정 (config.json)

```json
{
  "config": {
    "asset": {
      "api_url": "http://localhost:3003",
      "validate_on_page_load": true
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| api_url | string | "http://localhost:3003" | Asset API 서버 URL |
| validate_on_page_load | boolean | false | 페이지 로드 시 자동 검증 여부 |

---

## 5. 센서 현재 상태 조회

단일 센서의 현재 상태를 조회합니다.

### Request

```
GET /api/sensor/:id
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | ✓ | 센서 ID (3D 컴포넌트 ID) |

### Response

```json
{
  "data": {
    "id": "sensor-001",
    "name": "Sensor sensor-001",
    "zone": "Zone-A",
    "temperature": 24.5,
    "humidity": 45,
    "status": "normal",
    "threshold": {
      "warning": 28,
      "critical": 35
    },
    "lastUpdated": "2025-12-11T08:30:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | 센서 ID |
| name | string | 센서 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| temperature | number | 현재 온도 (°C) |
| humidity | number | 습도 (%) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |
| threshold.warning | number | 경고 임계값 (°C) |
| threshold.critical | number | 위험 임계값 (°C) |
| lastUpdated | string | 마지막 업데이트 (ISO 8601) |

### 컴포넌트 연동 (자기 완결 패턴)

```javascript
// TemperatureSensor.renderSensorInfo(data)
// Config 기반 렌더링:
// - .sensor-name: data.name
// - .sensor-zone: data.zone
// - .sensor-status: data.status (+ data-status attribute)
// - .sensor-temp: data.temperature
// - .sensor-humidity: data.humidity
```

---

## 6. 온도 히스토리 조회

센서의 과거 온도 데이터를 조회합니다. (차트 렌더링용)

### Request

```
GET /api/sensor/:id/history
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | ✓ | 센서 ID (path) |
| period | string | - | 조회 기간 (query, default: `24h`) |

**period 옵션:**

| 값 | 기간 | 데이터 포인트 | 간격 |
|----|------|--------------|------|
| `24h` | 24시간 | 24개 | 1시간 |
| `7d` | 7일 | 168개 | 1시간 |
| `30d` | 30일 | 720개 | 1시간 |

### Response

```json
{
  "data": {
    "sensorId": "sensor-001",
    "period": "24h",
    "timestamps": ["08:00", "09:00", "10:00", "..."],
    "temperatures": [23.5, 24.1, 24.8, "..."],
    "thresholds": {
      "warning": 28,
      "critical": 35
    }
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| sensorId | string | 센서 ID |
| period | string | 조회 기간 |
| timestamps | string[] | 시간 라벨 (HH:mm 형식) |
| temperatures | number[] | 온도 데이터 배열 |
| thresholds.warning | number | 경고 임계값 |
| thresholds.critical | number | 위험 임계값 |

### 컴포넌트 연동 (자기 완결 패턴)

```javascript
// TemperatureSensor.renderChart(data)
// chartConfig 기반 ECharts Line Chart:
// - xKey: 'timestamps' → X축
// - series[0].yKey: 'temperatures' → Y축 데이터
// - series[0].color: '#3b82f6'
// - series[0].smooth: true, areaStyle: true
```

---

## 7. 알림 목록 조회

센서의 최근 알림 목록을 조회합니다.

### Request

```
GET /api/sensor/:id/alerts
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | ✓ | 센서 ID (path) |

### Response

```json
{
  "data": {
    "sensorId": "sensor-001",
    "alerts": [
      {
        "id": "alert-1",
        "severity": "warning",
        "message": "Temperature reached 29.5°C (warning)",
        "timestamp": "2025-12-11T06:15:00.000Z"
      },
      {
        "id": "alert-2",
        "severity": "critical",
        "message": "Temperature reached 36.2°C (critical)",
        "timestamp": "2025-12-11T02:30:00.000Z"
      }
    ]
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| sensorId | string | 센서 ID |
| alerts | Alert[] | 알림 목록 (최신순 정렬) |

### Alert Object

| Field | Type | Description |
|-------|------|-------------|
| id | string | 알림 ID |
| severity | string | 심각도 (`warning` \| `critical`) |
| message | string | 알림 메시지 |
| timestamp | string | 발생 시간 (ISO 8601) |

### 컴포넌트 연동 (확장용)

```javascript
// 현재 미구현 - 향후 확장 시 사용
// datasetInfo에 sensorAlerts 추가 후:
// - .alert-list에 알림 아이템 렌더링
// - severity에 따라 스타일 변경
```

---

## 상태 판정 로직

```
temperature >= critical(35°C)  → status: "critical"
temperature >= warning(28°C)   → status: "warning"
temperature < warning(28°C)    → status: "normal"
```

---

## 사용 예시 (자기 완결 패턴)

### 3D 센서 클릭 시

```javascript
// Page - before_load.js '@sensorClicked' 핸들러
'@sensorClicked': ({ event, targetInstance }) => {
    // Page는 "어떤 메서드를 호출할지"만 결정
    targetInstance.showDetail();
}

// TemperatureSensor 내부에서 처리:
// 1. showPopup() → Shadow DOM 팝업 표시
// 2. datasetInfo 순회 → fetchData 호출
// 3. 결과를 render 함수에 전달
```

### TemperatureSensor.showDetail() 내부 흐름

```javascript
function showDetail() {
    this.showPopup();  // Mixin 제공

    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, param, render }) =>
            fx.go(
                fetchData(this.page, datasetName, param),
                result => result?.response?.data,
                data => data && render.forEach(fn => this[fn](data))
            )
        )
    );
}

// datasetInfo 정의:
const assetId = this.setter.ipsilonAssetInfo.assetId;

this.datasetInfo = [
    { datasetName: 'sensor', param: { id: assetId }, render: ['renderSensorInfo'] },
    { datasetName: 'sensorHistory', param: { id: assetId }, render: ['renderChart'] }
];
```

### 확장 예시: Alerts 추가 시

```javascript
// datasetInfo에 추가하면 자동으로 호출됨
const assetId = this.setter.ipsilonAssetInfo.assetId;

this.datasetInfo = [
    { datasetName: 'sensor', param: { id: assetId }, render: ['renderSensorInfo'] },
    { datasetName: 'sensorHistory', param: { id: assetId }, render: ['renderChart'] },
    { datasetName: 'sensorAlerts', param: { id: assetId }, render: ['renderAlerts'] }  // 추가
];
```

---

## Mock Server 실행

```bash
cd IPSILON_3D/mock_server
npm install
npm start  # http://localhost:3003
```
