# ECO API 명세

**Base URL**: `http://localhost:3004`

**프로젝트 설명**: 데이터센터 전력/냉방 장비 모니터링 대시보드

---

## API - 컴포넌트 기능 매핑

| API | 호출 시점 | 컴포넌트 | 기능 |
|-----|----------|----------|------|
| `GET /api/assets` | 페이지 로드 | AssetList | 전체 자산 목록 조회 |
| `GET /api/ups/:id` | 행 클릭 / 3D 클릭 | UPS | UPS 현재 상태 표시 |
| `GET /api/ups/:id/history` | 행 클릭 / 3D 클릭 | UPS | 부하/배터리 차트 렌더링 |
| `GET /api/pdu/:id` | 행 클릭 / 3D 클릭 | PDU | PDU 현재 상태 표시 |
| `GET /api/pdu/:id/circuits` | 행 클릭 / 3D 클릭 | PDU | 회로 테이블 렌더링 |
| `GET /api/pdu/:id/history` | 행 클릭 / 3D 클릭 | PDU | 전력 사용량 차트 렌더링 |
| `GET /api/crac/:id` | 행 클릭 / 3D 클릭 | CRAC | CRAC 현재 상태 표시 |
| `GET /api/crac/:id/history` | 행 클릭 / 3D 클릭 | CRAC | 온습도 차트 렌더링 |
| `GET /api/sensor/:id` | 행 클릭 / 3D 클릭 | TempHumiditySensor | 센서 현재 상태 표시 |
| `GET /api/sensor/:id/history` | 행 클릭 / 3D 클릭 | TempHumiditySensor | 온습도 차트 렌더링 |

---

## 1. 전체 자산 조회

### Request

```
GET /api/assets
```

### Response

```json
{
  "data": [
    {
      "id": "ups-001",
      "type": "ups",
      "name": "UPS A-1",
      "zone": "Zone-A",
      "status": "normal"
    },
    {
      "id": "pdu-001",
      "type": "pdu",
      "name": "PDU A-1",
      "zone": "Zone-A",
      "status": "warning"
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | 자산 ID |
| type | string | 자산 타입 (`ups` \| `pdu` \| `crac` \| `sensor`) |
| name | string | 자산 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |

---

## 2. UPS 현재 상태 조회

### Request

```
GET /api/ups/:id
```

### Response

```json
{
  "data": {
    "id": "ups-001",
    "name": "UPS A-1",
    "zone": "Zone-A",
    "inputVoltage": 220.5,
    "outputVoltage": 220.0,
    "load": 65.2,
    "batteryLevel": 100,
    "batteryHealth": 98,
    "runtime": 45,
    "temperature": 32.5,
    "status": "normal",
    "mode": "online",
    "threshold": {
      "loadWarning": 70,
      "loadCritical": 90,
      "batteryWarning": 30,
      "batteryCritical": 15
    },
    "lastUpdated": "2025-12-22T08:30:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | UPS ID |
| name | string | UPS 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| inputVoltage | number | 입력 전압 (V) |
| outputVoltage | number | 출력 전압 (V) |
| load | number | 부하율 (%) |
| batteryLevel | number | 배터리 잔량 (%) |
| batteryHealth | number | 배터리 건강도 (%) |
| runtime | number | 예상 가동 시간 (분) |
| temperature | number | 내부 온도 (°C) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |
| mode | string | 운전 모드 (`online` \| `bypass` \| `battery`) |

### 상태 판정 로직

```
load >= 90% OR batteryLevel <= 15%  → status: "critical"
load >= 70% OR batteryLevel <= 30%  → status: "warning"
otherwise                           → status: "normal"
```

---

## 3. UPS 히스토리 조회

### Request

```
GET /api/ups/:id/history
```

### Response

```json
{
  "data": {
    "upsId": "ups-001",
    "period": "24h",
    "timestamps": ["08:00", "09:00", "10:00", "..."],
    "load": [62.5, 65.1, 68.8, "..."],
    "battery": [100, 100, 99, "..."],
    "thresholds": {
      "loadWarning": 70,
      "loadCritical": 90
    }
  }
}
```

---

## 4. PDU 현재 상태 조회

### Request

```
GET /api/pdu/:id
```

### Response

```json
{
  "data": {
    "id": "pdu-001",
    "name": "PDU A-1",
    "zone": "Zone-A",
    "totalPower": 12.5,
    "totalCurrent": 56.8,
    "voltage": 220.0,
    "circuitCount": 24,
    "activeCircuits": 18,
    "powerFactor": 0.95,
    "status": "normal",
    "threshold": {
      "powerWarning": 15,
      "powerCritical": 18
    },
    "lastUpdated": "2025-12-22T08:30:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | PDU ID |
| name | string | PDU 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| totalPower | number | 총 전력 (kW) |
| totalCurrent | number | 총 전류 (A) |
| voltage | number | 전압 (V) |
| circuitCount | number | 전체 회로 수 |
| activeCircuits | number | 활성 회로 수 |
| powerFactor | number | 역률 |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |

---

## 5. PDU 회로 목록 조회

### Request

```
GET /api/pdu/:id/circuits
```

### Response

```json
{
  "data": {
    "pduId": "pdu-001",
    "circuits": [
      {
        "id": 1,
        "name": "Server Rack A-1",
        "current": 8.5,
        "power": 1.87,
        "status": "active",
        "breaker": "on"
      }
    ],
    "totalCount": 24
  }
}
```

---

## 6. PDU 히스토리 조회

### Request

```
GET /api/pdu/:id/history
```

### Response

```json
{
  "data": {
    "pduId": "pdu-001",
    "period": "24h",
    "timestamps": ["08:00", "09:00", "10:00", "..."],
    "power": [11.2, 12.5, 12.8, "..."],
    "current": [50.9, 56.8, 58.2, "..."]
  }
}
```

---

## 7. CRAC 현재 상태 조회

### Request

```
GET /api/crac/:id
```

### Response

```json
{
  "data": {
    "id": "crac-001",
    "name": "CRAC A-1",
    "zone": "Zone-A",
    "supplyTemp": 18.5,
    "returnTemp": 24.8,
    "setpoint": 18.0,
    "humidity": 45,
    "humiditySetpoint": 50,
    "fanSpeed": 75,
    "compressorStatus": "running",
    "coolingCapacity": 85,
    "status": "normal",
    "mode": "cooling",
    "threshold": {
      "tempWarning": 28,
      "tempCritical": 32,
      "humidityLow": 30,
      "humidityHigh": 70
    },
    "lastUpdated": "2025-12-22T08:30:00.000Z"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| id | string | CRAC ID |
| name | string | CRAC 이름 |
| zone | string | 존 (Zone-A ~ Zone-D) |
| supplyTemp | number | 공급 온도 (°C) |
| returnTemp | number | 환기 온도 (°C) |
| setpoint | number | 설정 온도 (°C) |
| humidity | number | 현재 습도 (%) |
| humiditySetpoint | number | 설정 습도 (%) |
| fanSpeed | number | 팬 속도 (%) |
| compressorStatus | string | 압축기 상태 (`running` \| `idle` \| `fault`) |
| coolingCapacity | number | 냉각 용량 (%) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |
| mode | string | 운전 모드 (`cooling` \| `heating` \| `dehumidifying` \| `standby`) |

---

## 8. CRAC 히스토리 조회

### Request

```
GET /api/crac/:id/history
```

### Response

```json
{
  "data": {
    "cracId": "crac-001",
    "period": "24h",
    "timestamps": ["08:00", "09:00", "10:00", "..."],
    "supplyTemp": [18.2, 18.5, 18.3, "..."],
    "returnTemp": [24.5, 24.8, 25.1, "..."],
    "humidity": [45, 46, 44, "..."]
  }
}
```

---

## 9. 온습도 센서 현재 상태 조회

### Request

```
GET /api/sensor/:id
```

### Response

```json
{
  "data": {
    "id": "sensor-001",
    "name": "Sensor A-1",
    "zone": "Zone-A",
    "temperature": 24.5,
    "humidity": 45,
    "dewpoint": 12.3,
    "status": "normal",
    "threshold": {
      "tempWarning": 28,
      "tempCritical": 32,
      "humidityLow": 30,
      "humidityHigh": 70
    },
    "lastUpdated": "2025-12-22T08:30:00.000Z"
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
| humidity | number | 현재 습도 (%) |
| dewpoint | number | 이슬점 (°C) |
| status | string | 상태 (`normal` \| `warning` \| `critical`) |

### 상태 판정 로직

```
temperature >= 32°C OR humidity < 30% OR humidity > 70%  → status: "critical"
temperature >= 28°C OR humidity < 40% OR humidity > 60%  → status: "warning"
otherwise                                                 → status: "normal"
```

---

## 10. 온습도 센서 히스토리 조회

### Request

```
GET /api/sensor/:id/history
```

### Response

```json
{
  "data": {
    "sensorId": "sensor-001",
    "period": "24h",
    "timestamps": ["08:00", "09:00", "10:00", "..."],
    "temperatures": [23.5, 24.1, 24.8, "..."],
    "humidities": [45, 46, 44, "..."]
  }
}
```

---

## Mock Server 실행

```bash
cd ECO/mock_server
npm install
npm start  # http://localhost:3004
```
