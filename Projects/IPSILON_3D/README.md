# IPSILON_3D - Data Center Temperature Monitoring (3D)

데이터센터 온도 모니터링 대시보드 - 3D 센서 컴포넌트 버전

## 아키텍처

**Page Only** 아키텍처 (Master 레이어 없음)

## 컴포넌트

### TemperatureSensor (3D 컴포넌트)
- **역할**: 단일 온도 센서를 나타내는 3D 객체
- **Event**: `@sensorClicked`
- **datasetInfo**: `sensorDetail` (클릭 시 상세 정보 조회)

### SensorDetailPopup (2D 컴포넌트)
- **역할**: 센서 상세 정보 + 온도 히스토리 차트 (ECharts)
- **Methods**: `showDetail(sensor, history)`, `hideDetail()`
- **Events**: `@popupClosed`, `@periodChanged`, `@refreshDetailClicked`, `@configureClicked`

## 데이터 흐름

```
┌─────────────────────────────────────────────────────────────┐
│  Page - before_load                                          │
│  └─ initThreeRaycasting (canvas click 이벤트 설정)           │
│  └─ eventBusHandlers 등록                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  TemperatureSensor (3D)                                      │
│  └─ bind3DEvents → '@sensorClicked' 발행                    │
│  └─ datasetInfo: { datasetName: 'sensorDetail', param: {id} }│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Page - eventBusHandler                                      │
│  └─ '@sensorClicked': fetchData(sensorDetail) → popup.showDetail()│
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│  SensorDetailPopup                                           │
│  └─ showDetail(sensor, history) → ECharts 렌더링            │
└─────────────────────────────────────────────────────────────┘
```

## IPSILON vs IPSILON_3D 비교

| 항목 | IPSILON | IPSILON_3D |
|------|---------|------------|
| 센서 표현 | 2D 카드 그리드 | 3D 객체 |
| 데이터 조회 | 폴링 (15초) | On-demand (클릭 시) |
| 센서 단위 | SensorGrid가 12개 렌더링 | 개별 3D 컴포넌트 |
| 이벤트 | DOM click + delegate | Three.js Raycasting |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/sensor/:id` | 단일 센서 상세 |
| `GET /api/sensor/:id/history?period=24h` | 센서 히스토리 (차트용) |

## 실행 방법

```bash
# Mock Server 실행
cd mock_server
npm install
npm start  # Port: 3003

# 3D 씬에서 센서 클릭 시 팝업 표시
```

## 파일 구조

```
IPSILON_3D/
├── page/
│   ├── page_scripts/
│   │   ├── before_load.js      # 이벤트 핸들러 + Raycasting
│   │   ├── loaded.js           # 데이터 매핑 등록 (on-demand)
│   │   └── before_unload.js    # 정리 (3D 리소스 포함)
│   └── components/
│       ├── TemperatureSensor/
│       │   └── scripts/register.js  # 3D 컴포넌트
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

### sensorDetail Topic (on-demand)

```javascript
// Request param
{ id: 'sensor-001' }

// Response
{
  sensor: {
    id: 'sensor-001',
    name: 'Sensor sensor-001',
    zone: 'Zone-A',
    temperature: 24.5,
    humidity: 45,
    status: 'normal',     // normal | warning | critical
    threshold: { warning: 28, critical: 35 },
    lastUpdated: '2025-12-10T10:30:00'
  },
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

## 3D 컴포넌트 특징

1. **3D 리소스 정리**: 페이지 `disposeAllThreeResources()`에서 일괄 정리
2. **DOM 리소스 정리**: 자기완결 컴포넌트(Shadow DOM 팝업 등)는 destroy.js에서 `destroyPopup()` 호출
3. **bind3DEvents 사용**: DOM이 아닌 Three.js Raycasting 기반
4. **datasetInfo로 데이터 연결**: 클릭 시 페이지가 데이터 조회
5. **개별 컴포넌트**: 센서 하나 = 컴포넌트 하나 (실제 존재하는 단위)
