# 3트랙 작업 완료 후 기대 산출물

## 1. 템플릿 자산

### 산출물
```
/templates
├── dashboard-main.html
├── card-stats.html
├── chart-bar.html
├── table-data.html
└── form-filter.html
```

### 가치
**회사 디자인을 RENOBIT 템플릿으로 접근 가능**

```
Before: Figma 디자인만 존재
→ 매번 처음부터 퍼블리싱

After: RENOBIT 템플릿 존재
→ 복사 & 커스터마이징
→ 퍼블리싱 시간 70% 단축
```

**활용 방식**:
- 시스템적 접근 X (자동화된 템플릿 시스템 아님)
- 예제로서 접근 O (참고해서 수동 작업)
- 학습 자료로 활용

---

## 2. 표준 패턴 가이드

### 산출물
```
/docs
├── standard-pattern.md
├── case-studies.md
└── best-practices.md
```

### 가치
**개발자들에게 프로젝트 만드는 일반적 패턴 설명 가능**

**가이드 내용**:
```
1. 아키텍처 원칙
   - 단방향 데이터 흐름
   - 페이지 vs 컴포넌트 역할 분리

2. 패턴별 예제
   - 전역 데이터 구독 패턴
   - 이벤트 기반 데이터 매핑
   - 마스터-디테일 패턴
   - 실시간 업데이트 패턴

3. 대시보드 만드는 과정 (Step-by-Step)
   Step 1: 페이지에서 전역 데이터 등록
   Step 2: 컴포넌트에서 구독 정의
   Step 3: 이벤트 핸들러 등록
   Step 4: 비즈니스 로직 구현
```

**활용 시나리오**:
```
신입 개발자 온보딩:
"이 가이드 보고 따라해보세요"
→ 1주일 내 패턴 습득

프로젝트 시작 전:
"이번 프로젝트는 표준 패턴으로 진행합니다"
→ 일관성 확보
```

---

## 3. 유틸 API 명세

### 산출물
```
/docs/api
├── WKit-api.md
├── GlobalDataPublisher-api.md
├── WEventBus-api.md
└── fx-usage-guide.md
```

### 가치
**자체 유틸 API를 명세 기반으로 설명 및 활용법 제공**

**API 문서 구조**:
```markdown
# WKit API

## pipeForDataMapping(targetInstance)
**설명**: 컴포넌트의 dataMapping 정보를 기반으로 데이터 fetch

**파라미터**:
- targetInstance: 데이터 매핑 정보를 가진 컴포넌트 인스턴스

**반환값**: Promise<Array<{ ownerId, visualInstanceList, data }>>

**사용 예시**:
```javascript
this.eventBusHandlers = {
  '@myEvent': async ({ targetInstance }) => {
    const results = await WKit.pipeForDataMapping(targetInstance);
    // ...
  }
};
```

**주의사항**:
- targetInstance에 dataMapping 속성 필수
- 비동기 함수이므로 await 사용

---

## bindEvents(instance, customEvents)
**설명**: 컴포넌트에 이벤트 위임 패턴으로 이벤트 바인딩
...
```

**효과**:
```
Before: "이 함수 어떻게 쓰는 거지?" → 코드 뒤져보기

After: "API 문서 보면 되네" → 5분 내 파악
```

---

## 4. 도메인 컴포넌트 개발 기반

### 산출물
```
/docs/domain-component
├── component-structure.md
├── development-guide.md
└── examples/
    └── EquipmentMonitor-example.md
```

### 가치
**도메인별 기능 탐색 및 컴포넌트 추가 기반 마련**

---

### 4.1 컴포넌트 구조 정립

**컴포넌트 = Property + Method + DataInfo**

```javascript
class EquipmentMonitor {
  // 1. Property (상태)
  currentFilter = 'all';
  alertCount = 0;

  // 2. Method (데이터를 다루는 코드)
  renderTable(data) {
    // 설비 데이터 렌더링
    const filtered = this.filterData(data);
    this.updateDOM(filtered);
  }

  filterData(data) {
    // 비즈니스 로직
    return data.filter(item =>
      this.currentFilter === 'all' || item.status === this.currentFilter
    );
  }

  updateAlertBadge(data) {
    this.alertCount = data.filter(item => item.status === 'error').length;
    // UI 업데이트
  }

  // 3. DataInfo (메타정보)
  subscriptions = {
    equipmentStatus: ['renderTable', 'updateAlertBadge']
  };

  dataMapping = [
    {
      ownerId: this.id,
      visualInstanceList: ['DetailChart'],
      datasetInfo: {
        datasetName: 'equipmentApi',
        param: { line: this.id }
      }
    }
  ];
}
```

**핵심 원칙**:
```
컴포넌트는 페이지와 독립적
├── Property: 자체 상태 보유
├── Method: 데이터 처리 로직 캡슐화
└── DataInfo: 필요한 데이터만 메타정보로 선언

→ 페이지 없어도 컴포넌트 자산으로 축적 가능
```

---

### 4.2 페이지의 역할 정립

**페이지 = 도메인 이벤트 정의 + 컴포넌트 메소드 호출**

```javascript
// Page - loaded
this.eventBusHandlers = {
  // 도메인 이벤트: 설비 클릭
  '@equipmentClicked': async ({ event, targetInstance }) => {
    // 1. 데이터 조회
    const data = await WKit.pipeForDataMapping(targetInstance);

    // 2. 컴포넌트 찾기
    const detailPanel = WKit.getInstanceByName('DetailPanel',
      WKit.makeIterator(this));

    // 3. 컴포넌트 메소드 호출 (비즈니스 로직)
    detailPanel.renderDetail(data);
  },

  // 도메인 이벤트: 필터 변경
  '@filterChanged': async ({ event, targetInstance }) => {
    // 1. 컴포넌트 상태 업데이트
    targetInstance.currentFilter = event.target.value;

    // 2. 데이터 재조회
    const data = await GlobalDataPublisher.fetchAndPublish(
      'equipmentStatus', this);

    // 3. 자동으로 구독자(컴포넌트)에게 전달
    // renderTable 메소드 자동 호출됨
  },

  // 도메인 이벤트: 알람 확인
  '@alertConfirmed': ({ targetInstance }) => {
    // 컴포넌트 메소드 호출
    targetInstance.clearAlert();
  }
};
```

**패턴**:
```
페이지의 책임:
1. 도메인 이벤트 정의 (비즈니스 의미)
   - '@equipmentClicked' (설비를 클릭했다)
   - '@filterChanged' (필터를 변경했다)

2. 컴포넌트 오케스트레이션
   - 어떤 컴포넌트의
   - 어떤 메소드를
   - 언제 호출할지

3. 데이터 관리
   - 전역 데이터 등록/발행
   - 컴포넌트 간 데이터 전달
```

---

### 4.3 컴포넌트 독립성의 의미

**핵심 인사이트**:
```
페이지가 없어도 컴포넌트는 완전함
├── Property: 자체 상태
├── Method: 비즈니스 로직
└── DataInfo: 데이터 요구사항

→ 컴포넌트 자산 축적 가능
```

**예시**:
```
프로젝트 A: 제조 설비 모니터링
→ EquipmentMonitor 컴포넌트 개발
   - renderTable(data)
   - filterData(data)
   - updateAlertBadge(data)

프로젝트 B: 물류 창고 관리
→ EquipmentMonitor 재사용
   - 메소드는 동일
   - 페이지에서 다른 이벤트 연결
   - 다른 데이터 토픽 구독

→ 컴포넌트 코드 수정 없이 재사용
```

---

### 4.4 도메인 컴포넌트 라이브러리 구축 기반

**작업 완료 후 할 수 있는 것**:

```
1. 도메인 분석
   - 제조: 설비, 생산, 품질
   - 물류: 재고, 배송, 입출고
   - 에너지: 전력, 설비, 환경

2. 컴포넌트 설계
   - Property 정의
   - Method 구현
   - DataInfo 메타정보 작성

3. 컴포넌트 개발
   - 표준 패턴 준수
   - 재사용 가능하게 설계
   - 테스트 코드 작성

4. 라이브러리 등록
   @company/manufacturing-components
   └── EquipmentMonitor
       ├── properties: currentFilter, alertCount
       ├── methods: renderTable, filterData, updateAlertBadge
       └── dataInfo: subscriptions, dataMapping
```

---

## 5. 종합 가치

### 개발자 온보딩
```
Before:
- RENOBIT 코드를 어떻게 작성해야 할지 모름
- 기존 프로젝트 코드 뒤지면서 학습
- 제각각 다른 패턴 혼란

After:
- 표준 패턴 가이드 제공
- 템플릿 예제 참고
- API 명세 문서 제공
- 1주일 내 독립 개발 가능
```

### 프로젝트 개발
```
Before:
- 매번 처음부터 구현
- 개발자마다 다른 코드 스타일
- 유지보수 어려움

After:
- 템플릿 복사 & 커스터마이징
- 표준 패턴 준수
- 코드 일관성 확보
- 개발 시간 50% 단축
```

### 자산 축적
```
Before:
- 프로젝트마다 새로 개발
- 재사용 불가능한 코드

After:
- 도메인 컴포넌트 축적
- 프로젝트 간 재사용
- 시간이 갈수록 생산성 증가
```

### 제품 경쟁력
```
Before:
RENOBIT = Bootstrap + 관리 기능
→ 프론트엔드 가치 희박

After:
RENOBIT = 표준 패턴 + 템플릿 + 도메인 컴포넌트
→ 진정한 저코드 플랫폼
→ 경쟁 우위 확보
```

---

## 6. 산출물 활용 시나리오

### 시나리오 1: 신규 프로젝트 시작
```
Step 1: 템플릿 선택
"대시보드 메인 레이아웃 템플릿 복사"

Step 2: 표준 패턴 적용
"가이드 보고 페이지 before_load 작성"
"컴포넌트 register 작성"

Step 3: 유틸 API 활용
"WKit.pipeForDataMapping API 문서 참고"
"GlobalDataPublisher 활용"

Step 4: 도메인 컴포넌트 검토
"기존 컴포넌트 중 재사용 가능한 것 있나?"
"없으면 신규 개발 후 라이브러리에 추가"

→ 2주 만에 프로토타입 완성
```

### 시나리오 2: 코드 리뷰
```
리뷰어: "표준 패턴 준수했나요?"
개발자: "네, 전역 데이터 구독 패턴 사용했습니다"

리뷰어: "WKit API 잘못 사용한 것 같은데?"
개발자: "API 문서 다시 확인하겠습니다"

→ 명확한 기준으로 리뷰 가능
```

### 시나리오 3: 유지보수
```
1년 후 다른 개발자가 인수인계:
"표준 패턴으로 작성되어 있네?"
"가이드 보고 구조 파악"
"API 문서 보고 함수 사용법 확인"

→ 인수인계 시간 70% 단축
```

---

## 7. 예상 타임라인

### 완료 시점
3개월 후

### 즉시 활용 가능
- 템플릿 자산 (복사해서 사용)
- 표준 패턴 가이드 (온보딩 교육)
- 유틸 API 명세 (개발 참고)

### 점진적 축적
- 도메인 컴포넌트 (프로젝트마다 추가)
- 패턴 개선 (피드백 반영)

---

## 결론

**3개월 작업으로 얻는 것**:

```
즉시 산출물:
✓ 템플릿 자산 (5개 이상)
✓ 표준 패턴 가이드
✓ 유틸 API 명세
✓ 도메인 컴포넌트 개발 기반

장기 가치:
✓ 개발 생산성 50% 향상
✓ 코드 일관성 확보
✓ 자산 축적 시스템
✓ RENOBIT 경쟁력 강화
```

**핵심**:
```
컴포넌트 = Property + Method + DataInfo
페이지 = 도메인 이벤트 + 컴포넌트 오케스트레이션

→ 컴포넌트는 페이지와 독립적
→ 프로젝트 간 재사용 가능
→ 자산이 쌓일수록 생산성 증가
```

이것이 RENOBIT의 진정한 가치입니다.
