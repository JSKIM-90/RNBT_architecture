# IPSILON - Data Center Temperature Monitoring

데이터센터 온도 모니터링 대시보드 프로젝트

## 아키텍처

**Page Only** 아키텍처 (Master 레이어 없음)

## 컴포넌트

### TemperatureSensor
- **역할**: 센서 카드 그리드 표시
- **Topic**: `temperatureSensors`
- **Event**: `@sensorClicked`

### SensorDetailPopup
- **역할**: 센서 상세 정보 + 온도 히스토리 차트 (ECharts)
- **Methods**: `showDetail(sensor, history)`, `hideDetail()`
- **Events**: `@popupClosed`, `@periodChanged`, `@configureClicked`

## 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  Page - loaded                                               │
│  └─ fetchAndPublish('temperatureSensors') - 15초 폴링       │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TemperatureSensor                                           │
│  └─ subscribe('temperatureSensors', renderSensors)          │
│  └─ emit('@sensorClicked')                                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Page - eventBusHandler                                      │
│  └─ '@sensorClicked': fetchData → popup.showDetail()        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SensorDetailPopup                                           │
│  └─ showDetail(sensor, history) → ECharts 렌더링            │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sensors` | 전체 센서 목록 + 요약 |
| `GET /api/sensors/:id` | 단일 센서 상세 |
| `GET /api/sensors/:id/history?period=24h` | 센서 히스토리 (차트용) |

## 실행 방법

```bash
# Mock Server 실행
cd mock_server
npm install
npm start  # Port: 3002

# Preview 테스트
# 브라우저에서 각 컴포넌트의 preview.html 열기
```

## 파일 구조

```
IPSILON/
├── page/
│   ├── page_scripts/
│   │   ├── before_load.js      # 이벤트 핸들러 등록
│   │   ├── loaded.js           # 데이터 발행 + 15초 폴링
│   │   └── before_unload.js    # 정리
│   └── components/
│       ├── TemperatureSensor/
│       │   ├── views/component.html
│       │   ├── styles/component.css
│       │   ├── scripts/register.js
│       │   ├── scripts/destroy.js
│       │   └── preview.html
│       └── SensorDetailPopup/
│           ├── views/component.html
│           ├── styles/component.css
│           ├── scripts/register.js
│           ├── scripts/destroy.js
│           └── preview.html
├── mock_server/
│   ├── server.js
│   └── package.json
├── datasetList.json
└── README.md
```

## Contract 정의

### temperatureSensors Topic
```javascript
{
  sensors: [
    {
      id: 'sensor-001',
      name: 'Rack A-01',
      zone: 'Zone-A',
      temperature: 24.5,
      humidity: 45,
      status: 'normal',     // normal | warning | critical
      threshold: { warning: 28, critical: 35 },
      lastUpdated: '2025-12-10T10:30:00'
    }
  ],
  summary: {
    total: 12,
    normal: 8,
    warning: 3,
    critical: 1,
    avgTemperature: 25.2
  }
}
```

### sensorDetail Topic (on-demand)
```javascript
{
  sensor: { ... },  // 위와 동일
  history: {
    timestamps: ['00:00', '01:00', ...],
    temperatures: [24.5, 25.1, ...],
    thresholds: { warning: 28, critical: 35 },
    alerts: [
      {
        id: 'alert-1',
        severity: 'warning',
        message: 'Temperature reached 29.5°C',
        timestamp: '2025-12-10T14:15:00'
      }
    ]
  }
}
```
