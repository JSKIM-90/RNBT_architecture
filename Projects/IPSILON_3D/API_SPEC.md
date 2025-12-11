# IPSILON_3D API 명세

**Base URL**: `http://localhost:3003`

---

## API - 컴포넌트 기능 매핑

| API | 호출 시점 | 컴포넌트 | 기능 |
|-----|----------|----------|------|
| `GET /api/sensor/:id` | 3D 센서 클릭 | TemperatureSensor → SensorDetailPopup | 센서 현재 상태 표시 |
| `GET /api/sensor/:id/history` | 3D 센서 클릭 | TemperatureSensor → SensorDetailPopup | 차트 렌더링 |
| `GET /api/sensor/:id/alerts` | 3D 센서 클릭 | TemperatureSensor → SensorDetailPopup | 알림 목록 표시 |
| `GET /api/sensor/:id/history?period=` | 기간 버튼 클릭 | SensorDetailPopup | 차트 기간 변경 (24h/7d/30d) |
| `GET /api/sensor/:id` + `/history` | 새로고침 버튼 클릭 | SensorDetailPopup | 센서 + 차트 갱신 |

---

## 1. 센서 현재 상태 조회

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

### 컴포넌트 연동

```javascript
// SensorDetailPopup.updateSensor(sensor)
// - .popup-title: sensor.name
// - .current-temp: sensor.temperature
// - .status-badge-large: sensor.status
// - .threshold-warning-val, .threshold-critical-val
```

---

## 2. 온도 히스토리 조회

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

### 컴포넌트 연동

```javascript
// SensorDetailPopup.updateChart(history)
// - ECharts Line Chart
// - X축: history.timestamps
// - Y축: history.temperatures
// - 점선: thresholds.warning, thresholds.critical
```

---

## 3. 알림 목록 조회

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

### 컴포넌트 연동

```javascript
// SensorDetailPopup.updateAlerts(alertsData)
// - .alert-list에 알림 아이템 렌더링
// - severity에 따라 아이콘 변경 (⚠️ / ⚡)
// - 알림 없으면 "No recent alerts" 표시
```

---

## 상태 판정 로직

```
temperature >= critical(35°C)  → status: "critical"
temperature >= warning(28°C)   → status: "warning"
temperature < warning(28°C)    → status: "normal"
```

---

## 사용 예시

### 3D 센서 클릭 시 (병렬 호출)

```javascript
// Page - before_load.js '@sensorClicked' 핸들러
const [sensorResult, historyResult, alertsResult] = await Promise.all([
    fetchData(this, 'sensor', { id: sensorId }),
    fetchData(this, 'sensorHistory', { id: sensorId }),
    fetchData(this, 'sensorAlerts', { id: sensorId })
]);

popup.showDetail(sensor, history, alerts);
```

### 기간 변경 시 (history만 조회)

```javascript
// Page - before_load.js '@periodChanged' 핸들러
const historyResult = await fetchData(this, 'sensorHistory', {
    id: sensorId,
    period: '7d'
});

popup.updateChart(history);
```

### 새로고침 시 (sensor + history 조회)

```javascript
// Page - before_load.js '@refreshDetailClicked' 핸들러
const [sensorResult, historyResult] = await Promise.all([
    fetchData(this, 'sensor', { id: sensorId }),
    fetchData(this, 'sensorHistory', { id: sensorId })
]);

popup.updateSensor(sensor);
popup.updateChart(history);
```

---

## Mock Server 실행

```bash
cd IPSILON_3D/mock_server
npm install
npm start  # http://localhost:3003
```
