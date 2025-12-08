# Page Only 아키텍처 예제

런타임 프레임워크의 **폴링 기반 다중 갱신 주기 대시보드 패턴**을 검증하기 위한 IoT 예제

---

## 목표

**핵심 검증 사항**:
- 폴링 기반 다중 갱신 주기 패턴 (5초/15초/60초)
- Topic 기반 pub-sub으로 중복 fetch 방지
- 페이지 레벨 interval 관리
- 동적 param 업데이트
- 컴포넌트 독립성 유지

**명시적 범위**:
- Master 레이어 없이 Page만 사용
- 읽기 중심 대시보드 (데이터 표시)
- 폴링 방식 (setInterval 기반)

---

## 아키텍처 구조

```
example_basic_01/
├── page/                      # Page 레이어 (전체)
│   ├── page_scripts/
│   │   ├── before_load.js     # 이벤트 핸들러 등록
│   │   ├── loaded.js          # 데이터 발행, interval 관리
│   │   └── before_unload.js   # 리소스 정리
│   ├── views/
│   │   ├── SensorPanel.html   # 센서 데이터 카드 그리드
│   │   ├── AlertList.html     # 알림 목록
│   │   └── TrendChart.html    # ECharts 트렌드 차트
│   ├── styles/
│   │   ├── SensorPanel.css
│   │   ├── AlertList.css
│   │   └── TrendChart.css
│   └── components/
│       ├── SensorPanel_*.js
│       ├── AlertList_*.js
│       └── TrendChart_*.js    # ECharts 통합
│
├── mock_server/               # 목 API 서버 (port: 3000)
├── datasetList.json           # 데이터셋 정의
├── CONTAINER_STYLES.md        # 컨테이너 스타일 가이드
└── README.md
```

---

## 데이터 흐름

```
[page_before_load]
  → onEventBusHandlers() (이벤트 핸들러 등록)

[SensorPanel, AlertList, TrendChart - register]
  → subscribe('sensors', ...)
  → subscribe('alerts', ...)
  → subscribe('trend', ...)

[page_loaded]
  → registerMapping()
  → fetchAndPublish()
  → startAllIntervals()
```

**Topics**:
| Topic | 구독자 | 갱신 주기 |
|-------|--------|----------|
| sensors | SensorPanel | 5초 |
| alerts | AlertList | 5초 |
| trend | TrendChart | 60초 |

---

## Mock Server

### 실행

```bash
cd mock_server
npm install
npm start  # port 3000
```

### API 엔드포인트

| Endpoint | 설명 |
|----------|------|
| GET /api/iot/sensors | 센서 현재 값 |
| GET /api/iot/alerts | 활성 알림 |
| GET /api/iot/trend | 24시간 트렌드 |

---

## 구현된 컴포넌트

| 컴포넌트 | 구독 Topic | 기능 |
|----------|-----------|------|
| SensorPanel | sensors | 센서 카드 그리드, 상태별 스타일 |
| AlertList | alerts | 알림 목록, 카운트 배지, 빈 상태 |
| TrendChart | trend | ECharts 온도 트렌드, ResizeObserver |

---

## 작성 일시

- **최초 작성**: 2025-11-21
- **목적**: 폴링 기반 다중 갱신 주기 패턴 검증
