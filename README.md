# 런타임 프레임워크 아키텍처

브라우저 런타임에서 자바스크립트 코드를 동적으로 실행하여 웹 페이지를 제작하는 **비주얼 웹 빌더 애플리케이션**의 런타임 프레임워크입니다.

---

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │    Master Layer     │    │          Page Layer             │ │
│  │  (공통 UI, 헤더,    │    │  (페이지별 콘텐츠, 대시보드,   │ │
│  │   사이드바, 알림)    │    │   차트, 데이터 테이블)         │ │
│  │                     │    │                                 │ │
│  │  common_component   │    │  page_scripts/                  │ │
│  │  └─ register.js     │    │  ├─ before_load.js              │ │
│  │  └─ destroy.js      │    │  ├─ loaded.js                   │ │
│  │                     │    │  └─ before_unload.js            │ │
│  │  components/        │    │                                 │ │
│  │  ├─ Header/         │    │  components/                    │ │
│  │  └─ Sidebar/        │    │  ├─ DataPanel/                  │ │
│  │                     │    │  └─ Chart/                      │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
│            │                              │                      │
│            └──────────────┬───────────────┘                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    Framework Layer                          │ │
│  │  ┌───────────┐  ┌──────────────────┐  ┌─────────────────┐  │ │
│  │  │  WKit.js  │  │ GlobalDataPublisher │  │ WEventBus.js │  │ │
│  │  │ (Facade)  │  │   (Data Layer)     │  │  (Pub-Sub)   │  │ │
│  │  └───────────┘  └──────────────────┘  └─────────────────┘  │ │
│  │                      ┌─────────┐                            │ │
│  │                      │  fx.js  │                            │ │
│  │                      │  (FP)   │                            │ │
│  │                      └─────────┘                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 레이어 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     User Script Layer                   │
│  (Component register/destroy, Page lifecycle scripts)   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                   Framework Layer                        │
├──────────────────────────────────────────────────────────┤
│  WKit.js (Facade)                                        │
│  ├─ Data Mapping Pipeline                               │
│  ├─ 2D Event Binding (delegate pattern)                 │
│  ├─ 3D Event Binding (raycasting)                       │
│  └─ Resource Management                                 │
├──────────────────────────────────────────────────────────┤
│  WEventBus.js (Pub-Sub)                                  │
│  └─ Component Communication                             │
├──────────────────────────────────────────────────────────┤
│  GlobalDataPublisher.js (Data Layer)                     │
│  └─ Topic-based Data Sharing                            │
├──────────────────────────────────────────────────────────┤
│  fx.js (FP Utilities)                                    │
│  └─ Functional Programming Toolkit                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                   Runtime Layer                          │
│  (Browser APIs, Three.js, DOM, Data Service)            │
└─────────────────────────────────────────────────────────┘
```

---

## 핵심 모듈 (Utils/)

| 모듈 | 패턴 | 역할 |
|------|------|------|
| **fx.js** | Functional Programming | `curry`, `pipe`, `go`, `map`, `filter`, Lazy Evaluation |
| **WEventBus.js** | Pub-Sub | 컴포넌트 간 이벤트 통신 (`on`, `off`, `emit`) |
| **GlobalDataPublisher.js** | Topic-based Pub-Sub | 데이터 매핑, fetch & 발행, 구독 관리 |
| **WKit.js** | Facade + Utility | 2D/3D 이벤트 바인딩, 리소스 관리, 헬퍼 함수 |

---

## 주요 특징

1. **선언적 스크립트 작성** - register/destroy 스크립트만 작성하면 프레임워크가 자동 실행
2. **자동 라이프사이클 관리** - 프레임워크가 init/cleanup 호출하여 메모리 누수 방지
3. **함수형 조합** - fx.js 기반 파이프라인으로 복잡한 로직을 간결하게 표현
4. **느슨한 결합** - EventBus와 GlobalDataPublisher로 컴포넌트 독립성 보장
5. **2D/3D 통합** - DOM 이벤트와 Three.js 이벤트를 일관된 방식으로 처리
6. **컴포넌트 정형화** - 스키마 기반 템플릿으로 5-10분 내 새 컴포넌트 추가 가능

---

## 폴더 구조

```
RNBT_architecture/
├── Utils/                          # 핵심 프레임워크 모듈
│   ├── fx.js                       # 함수형 프로그래밍
│   ├── WEventBus.js                # 이벤트 버스
│   ├── GlobalDataPublisher.js      # 데이터 발행 시스템
│   └── WKit.js                     # 통합 유틸리티
│
├── Analysis/                       # 설계 문서
│   ├── Lifecycle.md                # 라이프사이클 상세
│   ├── DEFAULT_JS.md               # 스크립트 템플릿
│   ├── PROJECT_TEMPLATE.md         # 프로젝트 설계 패턴
│   ├── ERROR_HANDLING.md           # 에러 처리 가이드
│   └── RUNTIME_COMPONENT_STRUCTURE.md  # 컴포넌트 구조
│
├── Examples/
│   ├── example_basic_01/           # Page Only 예제 (IoT 대시보드)
│   ├── example_master_01/          # Master + Page 예제
│   └── example_master_02/          # 확장 예제
│
├── Projects/                       # 실제 프로젝트
│
├── CLAUDE.md                       # 작업 지침
└── README.md                       # 이 파일
```

---

## 예제 가이드

### example_basic_01 - Page Only 아키텍처

- **목적**: 폴링 기반 다중 갱신 주기 패턴 검증
- **시나리오**: IoT 센서 모니터링 대시보드
- **특징**: 5초/15초/60초 독립적 갱신 주기

### example_master_01 - Master + Page 아키텍처

- **목적**: Master + Page 레이어 독립적 데이터 흐름 검증
- **시나리오**: 일반 대시보드 (헤더, 사이드바, 통계)
- **특징**: `common_component` 패턴, `this.page` 참조

---

## 문서 가이드

### Analysis 폴더

상세 설계 문서는 `Analysis/` 폴더에서 확인하세요:

| 문서 | 내용 |
|------|------|
| [Lifecycle.md](Analysis/Lifecycle.md) | 컴포넌트/페이지 라이프사이클 상세, 이벤트 순서 |
| [DEFAULT_JS.md](Analysis/DEFAULT_JS.md) | 복사해서 쓸 수 있는 스크립트 템플릿 |
| [PROJECT_TEMPLATE.md](Analysis/PROJECT_TEMPLATE.md) | 프로젝트 설계 패턴, 이벤트 위임, Param 관리 |
| [ERROR_HANDLING.md](Analysis/ERROR_HANDLING.md) | fetchAndPublish 에러 처리, fx.go 에러 메커니즘 |
| [RUNTIME_COMPONENT_STRUCTURE.md](Analysis/RUNTIME_COMPONENT_STRUCTURE.md) | 컴포넌트 구조, 컨테이너 규칙 |
| [FUNCTIONAL_COMPONENT.md](Analysis/FUNCTIONAL_COMPONENT.md) | 기능별 컴포넌트 패턴 (ECharts, Tabulator 등) |

### 작업 지침

- [CLAUDE.md](CLAUDE.md) - Claude Code 작업 시 지침

---

## datasetList.json 포맷

```json
{
  "version": "3.2.0",
  "data": [
    {
      "name": "datasetName",
      "dataset_id": "unique-id",
      "page_id": "MASTER|PAGE",
      "interval": "5000",
      "param_info": [],
      "rest_api": "{\"url\":\"...\",\"method\":\"GET\",\"headers\":{},\"body\":\"\"}"
    }
  ],
  "datasource": []
}
```

---

## 버전 정보

**문서 버전**: 3.0.0
**최종 업데이트**: 2025-12-17

### 주요 변경사항

- v3.0.0: 문서 구조 대폭 간소화 (2025-12-17)
  - 1568줄 → ~200줄로 축소
  - 상세 내용은 Analysis 폴더 문서로 분리
  - README.md는 개요 + 구조 + 문서 링크만 유지

- v2.3.0: 3D 컴포넌트 destroy.js 정책 명확화 (2025-12-17)
- v2.2.0: Shadow DOM / Mixin 개념 설명 추가 (2025-12-16)
- v2.1.0: 자기 완결 컴포넌트 패턴 추가 (2025-12-16)
- v2.0.0: 문서 구조 재편 (2025-12-15)
