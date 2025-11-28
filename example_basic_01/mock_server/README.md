# IoT Monitoring Dashboard API Server

스마트 팩토리 환경 모니터링을 위한 샘플 데이터 API 서버입니다.

## 설치

```bash
cd IOT_API
npm install
```

## 실행

```bash
# 일반 실행
npm start

# 개발 모드 (nodemon - 파일 변경 시 자동 재시작)
npm run dev
```

서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## API 엔드포인트

### 실시간 데이터 (3-5초 갱신 권장)

#### GET /api/iot/realtime/sensors/current
현재 모든 센서의 실시간 값을 반환합니다.

**응답 예시:**
```json
{
  "timestamp": "2025-11-21T10:30:00.000Z",
  "sensors": [
    {
      "id": "TEMP-001",
      "zone": "Zone A",
      "type": "temperature",
      "value": 23.5,
      "unit": "°C",
      "status": "normal"
    }
  ]
}
```

#### GET /api/iot/realtime/alerts/active
현재 활성화된 알림을 반환합니다.

**응답 예시:**
```json
{
  "alerts": [
    {
      "id": "ALERT-123",
      "sensorId": "TEMP-002",
      "zone": "Zone B",
      "type": "critical",
      "message": "temperature exceeded threshold: 35.2°C",
      "timestamp": "2025-11-21T10:29:45.000Z"
    }
  ]
}
```

### 단기 갱신 데이터 (10-15초 갱신 권장)

#### GET /api/iot/shortterm/devices/status
모든 디바이스의 상태 정보를 반환합니다.

**응답 예시:**
```json
{
  "devices": [
    {
      "id": "TEMP-001",
      "name": "Temperature Sensor 1",
      "type": "temperature",
      "zone": "Zone A",
      "online": true,
      "battery": 85,
      "signalStrength": -45,
      "lastSeen": "2025-11-21T10:30:00.000Z"
    }
  ]
}
```

#### GET /api/iot/shortterm/events/recent
최근 30분간의 이벤트 로그를 반환합니다.

**응답 예시:**
```json
{
  "events": [
    {
      "id": "EVENT-456",
      "type": "sensor_reading",
      "deviceId": "TEMP-001",
      "message": "TEMP-001 sent new reading",
      "timestamp": "2025-11-21T10:25:00.000Z"
    }
  ]
}
```

### 중기 갱신 데이터 (30-60초 갱신 권장)

#### GET /api/iot/midterm/sensors/trend/24h
지난 24시간의 센서 트렌드 데이터를 반환합니다.

**응답 예시:**
```json
{
  "trends": {
    "temperature": [
      {
        "deviceId": "TEMP-001",
        "data": [
          {
            "timestamp": "2025-11-20T10:30:00.000Z",
            "value": 22.3
          }
        ]
      }
    ]
  }
}
```

#### GET /api/iot/midterm/zones/statistics
구역별 통계 데이터를 반환합니다.

**응답 예시:**
```json
{
  "statistics": [
    {
      "zone": "Zone A",
      "sensors": {
        "temperature": {
          "average": 23.2,
          "min": 20.1,
          "max": 26.5,
          "unit": "°C"
        }
      }
    }
  ]
}
```

### 정적 데이터 (초기 로드만)

#### GET /api/iot/static/devices/list
등록된 모든 디바이스 목록을 반환합니다.

**응답 예시:**
```json
{
  "devices": [
    {
      "id": "TEMP-001",
      "name": "Temperature Sensor 1",
      "type": "temperature",
      "zone": "Zone A",
      "model": "TEMPERATURE-X123",
      "installedDate": "2024-03-15T00:00:00.000Z",
      "status": "active"
    }
  ]
}
```

#### GET /api/iot/static/settings/thresholds
센서 타입별 임계치 설정을 반환합니다.

**응답 예시:**
```json
{
  "thresholds": {
    "temperature": {
      "warning": 28,
      "critical": 35,
      "unit": "°C"
    }
  }
}
```

### 헬스 체크

#### GET /health
서버 상태를 확인합니다.

**응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-21T10:30:00.000Z",
  "uptime": 3600
}
```

## 데이터 특성

### 센서 타입
- **temperature**: 온도 센서 (°C)
  - 정상 범위: 15-40°C
  - Warning: 28°C 이상
  - Critical: 35°C 이상

- **humidity**: 습도 센서 (%)
  - 정상 범위: 30-90%
  - Warning: 70% 이상
  - Critical: 80% 이상

- **pressure**: 압력 센서 (hPa)
  - 정상 범위: 990-1050 hPa
  - Warning: 1030 hPa 이상
  - Critical: 1040 hPa 이상

- **co2**: CO2 센서 (ppm)
  - 정상 범위: 350-1200 ppm
  - Warning: 800 ppm 이상
  - Critical: 1000 ppm 이상

### 구역
- Zone A, Zone B, Zone C, Zone D

### 디바이스 수
- 각 센서 타입당 4개 디바이스
- 총 16개 디바이스

## 데이터 생성 로직

- **실시간 센서 값**: 랜덤한 변동 + 트렌딩 패턴
- **알림**: 임계치 초과 시 자동 생성
- **디바이스 상태**: 90% 온라인 확률
- **트렌드 데이터**: 24시간 데이터 포인트 생성

## 포트 변경

환경 변수로 포트를 변경할 수 있습니다:

```bash
PORT=4000 npm start
```

## 개발 참고사항

- CORS가 활성화되어 있어 모든 origin에서 접근 가능합니다.
- 각 요청은 콘솔에 로그가 남습니다.
- 데이터는 메모리에서 생성되며 영구 저장되지 않습니다.
