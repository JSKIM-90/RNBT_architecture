# Sales Dashboard Example

판매 실적 대시보드 - 런타임 프레임워크 완전 구현 예제

## 개요

이 대시보드는 런타임 프레임워크의 모든 핵심 패턴을 실제로 구현한 예제입니다:
- 2D/3D 이벤트 바인딩
- GlobalDataPublisher 구독 패턴
- 페이지 라이프사이클 관리
- 자동 리소스 정리
- 데이터셋별 독립적인 auto-refresh
- **ECharts 통합** (Line/Bar 차트)

---

## 프로젝트 구조

```
example_dashboard_01/
├── components/
│   ├── Header_register.js                    # 공통 컴포넌트
│   ├── Header_destroy.js
│   ├── Sidebar_register.js                   # 공통 컴포넌트
│   ├── Sidebar_destroy.js
│   ├── SalesChart_register.js                # 2D + subscribe
│   ├── SalesChart_destroy.js
│   ├── ProductList_register.js               # 2D + subscribe + event binding
│   ├── ProductList_destroy.js
│   ├── SalesStats_register.js                # 2D + subscribe
│   ├── SalesStats_destroy.js
│   ├── Product3DViewer_register.js           # 3D + subscribe + 3d event binding
│   └── Product3DViewer_destroy.js
├── views/
│   ├── Header.html                           # Header HTML + templates
│   ├── Sidebar.html                          # Sidebar HTML + templates
│   ├── SalesChart.html                       # Chart HTML + templates
│   ├── ProductList.html                      # Table HTML + templates
│   ├── SalesStats.html                       # Stats cards HTML
│   └── Product3DViewer.html                  # 3D viewer HTML + templates
├── styles/
│   ├── Header.css                            # Header component styles
│   ├── Sidebar.css                           # Sidebar component styles
│   ├── SalesChart.css                        # Chart widget styles
│   ├── ProductList.css                       # Product table styles
│   ├── SalesStats.css                        # Statistics cards styles
│   └── Product3DViewer.css                   # 3D viewer styles
└── pages/
    ├── page_before_load.js                   # 이벤트 핸들러, Raycasting 초기화
    ├── page_loaded.js                        # 데이터 매핑, auto-refresh 시작
    └── page_before_unload.js                 # 전체 리소스 정리

```

---

## 컴포넌트 설명

### 공통 컴포넌트

#### 1. Header
**패턴**: 2D Event Binding + GlobalDataPublisher Subscription

**기능**:
- 기간 필터 변경 (24h / 7d / 30d)
- 사용자 정보 동적 렌더링 (이름, 역할, 아바타)
- 알림 동적 렌더링 (HTML template 사용)

**구독**:
- Topic: `userInfo` - 사용자 정보 렌더링
- Topic: `notifications` - 알림 목록 렌더링

**이벤트**:
- `@periodFilterChanged` - 모든 데이터 토픽의 기간 파라미터 업데이트
- `@userProfileClicked` - 사용자 프로필 모달 표시
- `@notificationClicked` - 알림 드롭다운 토글

**HTML Template 사용**:
- `#notification-item-template` - 알림 아이템 템플릿
- `#user-avatar-template` - 사용자 아바타 템플릿

**스크립트**:
- `Header_register.js` - 구독 + 이벤트 바인딩 + 동적 렌더링
- `Header_destroy.js` - 구독 해제 + 이벤트 리스너 제거

---

#### 2. Sidebar
**패턴**: 2D Event Binding + GlobalDataPublisher Subscription

**기능**:
- 네비게이션 메뉴 동적 렌더링 (HTML template 사용)
- 활성 메뉴 하이라이트
- 메뉴 배지 표시 (알림 카운트 등)

**구독**:
- Topic: `navigationMenu` - 네비게이션 메뉴 데이터

**이벤트**:
- 동적으로 생성된 이벤트 (데이터에 따라 변경)
- 예: `@navDashboardClicked`, `@navProductsClicked` 등

**HTML Template 사용**:
- `#nav-item-template` - 네비게이션 아이템 템플릿
- `#nav-separator-template` - 구분선 템플릿

**스크립트**:
- `Sidebar_register.js` - 구독 + 이벤트 바인딩 + 동적 메뉴 렌더링
- `Sidebar_destroy.js` - 구독 해제 + 이벤트 리스너 제거

---

### 페이지 컴포넌트

#### 3. SalesChart
**패턴**: 2D Component + GlobalDataPublisher Subscription + ECharts

**기능**:
- 판매 데이터 Line 차트 렌더링 (ECharts)
- 차트 제목 및 타임스탬프 업데이트
- Refresh 버튼 이벤트

**구독**:
- Topic: `salesData`
- Handlers:
  - `renderChart` - ECharts로 Line 차트 렌더링
  - `updateTimestamp` - 차트 업데이트 시간 표시

**이벤트**:
- `@refreshChartClicked` - 차트 수동 갱신

**ECharts 통합**:
```javascript
// 초기화
const targetElement = this.element.querySelector('#echarts');
this.chartInstance = echarts.init(targetElement);

// 옵션 설정
const option = {
  xAxis: { type: 'category', data: dates },
  yAxis: { type: 'value' },
  series: [{ data: values, type: 'line', smooth: true }]
};
this.chartInstance.setOption(option);

// 정리
this.chartInstance.dispose();
```

**Auto-Refresh**: 5초마다 자동 갱신

**스크립트**:
- `SalesChart_register.js` - 구독 등록, ECharts 초기화, 이벤트 바인딩
- `SalesChart_destroy.js` - 구독 해제, ECharts dispose, 참조 정리

---

#### 4. ProductList
**패턴**: 2D Component + GlobalDataPublisher Subscription + Event Binding

**기능**:
- 제품 목록 테이블 렌더링
- 제품 선택 (행 클릭)
- 제품 삭제 (삭제 버튼 클릭)

**구독**:
- Topic: `productList`
- Handlers:
  - `renderProductTable` - 제품 테이블 렌더링

**이벤트**:
- `@productSelected` - 제품 행 클릭 시 상세 정보 fetch
- `@productDeleteClicked` - 삭제 버튼 클릭 시 삭제 확인

**데이터 저장**:
- `this.products[]` - 이벤트 핸들러에서 접근하기 위해 저장
- HTML `data-index` 속성으로 배열 인덱스 추적

**Auto-Refresh**: 정적 데이터 (1회만 fetch)

**스크립트**:
- `ProductList_register.js` - 구독 + 이벤트 바인딩
- `ProductList_destroy.js` - 구독 해제 + 이벤트 제거

---

#### 5. SalesStats
**패턴**: 2D Component + GlobalDataPublisher Subscription + ECharts

**기능**:
- 카테고리별 판매 통계 Bar 차트 렌더링 (ECharts)
- 차트 타임스탬프 업데이트
- Refresh 버튼 이벤트

**구독**:
- Topic: `salesStats`
- Handlers:
  - `renderChart` - ECharts로 Bar 차트 렌더링
  - `updateTimestamp` - 차트 업데이트 시간 표시

**이벤트**:
- `@refreshStatsClicked` - 차트 수동 갱신

**ECharts 통합**:
```javascript
// 초기화
const targetElement = this.element.querySelector('#echarts');
this.chartInstance = echarts.init(targetElement);

// 옵션 설정 (Bar 차트)
const option = {
  xAxis: { type: 'category', data: categories },
  yAxis: { type: 'value' },
  series: [{ data: values, type: 'bar', barWidth: '60%' }]
};
this.chartInstance.setOption(option);

// 정리
this.chartInstance.dispose();
```

**Auto-Refresh**: 15초마다 자동 갱신

**스크립트**:
- `SalesStats_register.js` - 구독 등록, ECharts 초기화, 이벤트 바인딩
- `SalesStats_destroy.js` - 구독 해제, ECharts dispose, 참조 정리

---

#### 6. Product3DViewer
**패턴**: 3D Component + GlobalDataPublisher Subscription + 3D Event Binding

**기능**:
- 3D 제품 모델 렌더링
- 3D 객체 클릭 감지 (Raycasting)
- 선택된 제품 하이라이트

**구독**:
- Topic: `productList`
- Handlers:
  - `render3DModels` - 제품 데이터로 3D 모델 생성
  - `updateModelHighlight` - 선택된 모델 하이라이트

**3D 이벤트**:
- `@product3DClicked` - 3D 객체 클릭 시 상세 정보 fetch

**Data Source Info**:
```javascript
this.datasetInfo = {
    datasetName: 'productDetails',
    param: {
        type: '3dModel',
        viewerId: this.id
    }
};
```

**스크립트**:
- `Product3DViewer_register.js` - 구독 + 3D 이벤트 바인딩
- `Product3DViewer_destroy.js` - 구독 해제 (3D 리소스는 페이지에서 정리)

---

## 페이지 라이프사이클

### 1. page_before_load.js
**타이밍**: 컴포넌트 생성 **전**

**작업**:
1. **이벤트 핸들러 등록** (`onEventBusHandlers`)
   - Header 이벤트 (`@periodFilterChanged`, `@userProfileClicked`, etc.)
   - Sidebar 이벤트 (네비게이션)
   - ProductList 이벤트 (`@productSelected`, `@productDeleteClicked`)
   - Product3DViewer 이벤트 (`@product3DClicked`)

2. **Three.js Raycasting 초기화** (`initThreeRaycasting`)
   - Canvas에 raycasting 이벤트 리스너 등록
   - 'click', 'mousemove', 'dblclick' 등

---

### 2. page_loaded.js
**타이밍**: 모든 컴포넌트 completed **후**

**작업**:
1. **Global Data Mappings 정의**
   ```javascript
   this.globalDataMappings = [
       { topic: 'salesData', datasetInfo: {...}, refreshInterval: 5000 },
       { topic: 'salesStats', datasetInfo: {...}, refreshInterval: 15000 },
       { topic: 'productList', datasetInfo: {...} }  // No interval
   ];
   ```

2. **매핑 등록 및 초기 데이터 fetch** (chaining pattern)
   ```javascript
   fx.go(
       this.globalDataMappings,
       each(GlobalDataPublisher.registerMapping),
       each(({ topic }) => this.currentParams[topic] = {}),
       each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
   );
   ```

3. **Auto-Refresh 시작**
   - 각 토픽별로 독립적인 interval 설정
   - `this.currentParams[topic]`으로 동적 파라미터 지원

---

### 3. page_before_unload.js
**타이밍**: 페이지 언로드 **전**

**작업**:
1. **Intervals 정리** - 모든 setInterval 중지
2. **Event Bus 정리** - 이벤트 핸들러 해제
3. **Data Publisher 정리** - 모든 토픽 unregister
4. **Three.js 정리**
   - Raycasting 이벤트 리스너 제거
   - 3D 리소스 dispose (geometry, material, texture)
   - Scene background 정리

---

## 데이터 흐름

```
[Page - before_load]
  → 이벤트 핸들러 등록 (onEventBusHandlers)
  → Raycasting 초기화 (initThreeRaycasting)

[Components - register]
  → SalesChart: subscribe('salesData', ...)
  → SalesStats: subscribe('salesStats', ...)
  → ProductList: subscribe('productList', ...) + bindEvents(...)
  → Product3DViewer: subscribe('productList', ...) + bind3DEvents(...)

[Page - loaded]
  → GlobalDataPublisher.registerMapping() (3 topics)
  → GlobalDataPublisher.fetchAndPublish() (초기 데이터)
  → startAllIntervals() (auto-refresh 시작)
  ↓
  구독자들에게 데이터 자동 전파
  ↓
  SalesChart.renderChart(data)
  SalesStats.updateStatsCards(data)
  ProductList.renderProductTable(data)
  Product3DViewer.render3DModels(data)

[User Interaction]
  → Header: 기간 필터 변경
  → @periodFilterChanged
  → this.currentParams 업데이트 (모든 토픽)
  → fetchAndPublish() (즉시 갱신)
  → Interval이 자동으로 새 param 사용

  → ProductList: 제품 행 클릭
  → @productSelected
  → fetchData(this, 'productDetails', { id })
  → 상세 정보 표시

  → Product3DViewer: 3D 객체 클릭
  → @product3DClicked
  → targetInstance.datasetInfo 추출
  → fetchData(this, datasetName, param)
  → 상세 정보 표시
```

---

## 핵심 패턴 구현

### 1. Primitive Building Blocks
**프레임워크는 primitive만 제공, 조합은 사용자가 직접**

```javascript
// ✅ Primitive 조합 (Page event handler)
'@product3DClicked': async ({ event, targetInstance }) => {
    // 1. targetInstance에서 정보 추출
    const { datasetInfo } = targetInstance;

    if (datasetInfo) {
        // 2. WKit primitive 사용
        const { datasetName, param } = datasetInfo;
        const data = await WKit.fetchData(this, datasetName, param);

        // 3. 사용자가 직접 로직 조합
        console.log('Fetched data:', data);
    }
}
```

### 2. HTML Dataset 활용
**동적 렌더링 시 dataset에 식별자/단순 값 저장**

```javascript
// Component - 렌더링
tableBody.innerHTML = this.products.map((product, index) => `
    <tr class="product-row"
        data-index="${index}"
        data-product-id="${product.id}">
        ...
    </tr>
`).join('');

// Page - 이벤트 핸들러
'@productSelected': ({ event }) => {
    const { index, productId } = event.target.closest('.product-row').dataset;
    const product = targetInstance.products[index];  // 전체 데이터 접근
}
```

### 3. 컴포넌트 메소드 위임
**페이지는 Orchestration만, 복잡한 로직은 컴포넌트가 소유**

```javascript
// Page - 조율만 담당
'@productSelected': async ({ userId }) => {
    const product = await fetchData(this, 'productDetails', { id });
    productDetailPanel.showProductDetail(product);  // 위임!
}

// Component - 도메인 로직 소유
this.showProductDetail = function(product) {
    const enriched = this.enrichProductData(product);
    const filtered = this.applyPermissionFilter(enriched);
    this.updateUI(filtered);
}.bind(this);
```

### 4. 데이터셋별 Auto-Refresh
**각 데이터의 특성에 맞는 독립적인 갱신 주기**

```javascript
// 실시간 데이터 - 짧은 주기
{ topic: 'salesData', refreshInterval: 5000 }

// 통계 데이터 - 중간 주기
{ topic: 'salesStats', refreshInterval: 15000 }

// 정적 데이터 - 갱신 없음
{ topic: 'productList' }  // No refreshInterval
```

### 5. 동적 파라미터 업데이트
**Interval 중단 없이 param 병합**

```javascript
// 기간 필터 변경 시
'@periodFilterChanged': ({ event }) => {
    const period = event.target.value;

    // 모든 토픽의 param 업데이트
    this.globalDataMappings.forEach(({ topic }) => {
        this.currentParams[topic] = {
            ...this.currentParams[topic],  // 기존 param 유지
            period                          // 새 param 병합
        };

        // 즉시 갱신
        GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
    });

    // Interval은 자동으로 새 param 사용
};
```

---

## Container 구조 및 사용법

이 프로젝트는 **런타임 웹 제작 애플리케이션**에서 사용하도록 설계되었습니다.

### Container 구조

모든 컴포넌트는 **자동 생성되는 Container Div (고유 ID 포함)** 내부에 배치됩니다:

```html
<!-- 애플리케이션이 자동으로 생성하는 Container -->
<!-- 반드시 고유한 ID를 부여해야 함! -->
<div id="header-123" class="component-container" style="...inline styles from panel...">

  <!-- views/*.html의 내용이 여기에 삽입됨 -->
  <div class="dashboard-header">
    <div class="header-left">...</div>
    <div class="header-center">...</div>
    <div class="header-right">...</div>
  </div>

</div>
```

**중요**: Container에는 반드시 **고유한 ID**를 부여해야 합니다. CSS 선택자가 `#component-id`로 시작하므로, 실제 사용 시 해당 ID로 교체해야 합니다.

### 구조 설명

```
┌─────────────────────────────────────────────┐
│ Container Div (자동 생성)                    │
│ - 클래스: component-container                │
│ - 스타일: 패널에서 설정한 inline style        │
│ - 역할: 레이아웃, 위치, 크기 제어             │
│                                              │
│  ┌──────────────────────────────────────┐  │
│  │ Component Wrapper (views/*.html)      │  │
│  │ - 클래스: dashboard-header 등         │  │
│  │ - 스타일: styles/*.css                │  │
│  │ - 역할: 컴포넌트 내부 스타일           │  │
│  └──────────────────────────────────────┘  │
│                                              │
└─────────────────────────────────────────────┘
```

### Container 스타일 예시

Container는 패널에서 다음과 같은 inline style이 적용됩니다:

```html
<div class="component-container" style="
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
  z-index: 100;
">
  <!-- views/Header.html 내용 -->
  <div class="dashboard-header">...</div>
</div>
```

### Container별 권장 스타일

#### Header Container
```css
/* 패널에서 설정할 inline style */
position: absolute;
top: 0;
left: 0;
width: 100%;
height: 80px;
z-index: 100;
```

#### Sidebar Container
```css
/* 패널에서 설정할 inline style */
position: fixed;
top: 80px;
left: 0;
width: 240px;
height: calc(100vh - 80px);
z-index: 50;
```

#### Content Area (Chart, Stats, etc.)
```css
/* 패널에서 설정할 inline style */
position: absolute;
top: 100px;
left: 260px;
width: calc(100% - 280px);
padding: 20px;
```

### 스타일 우선순위

1. **Container Inline Style** (최우선) - 레이아웃, 위치, 크기
2. **Component CSS** (styles/*.css) - 내부 디자인, 색상, 간격
3. **HTML Default** - 기본 브라우저 스타일

### 주의사항

❌ **피해야 할 것**:
```css
/* views의 HTML 최상위 요소에 position 설정하지 않기 */
.dashboard-header {
  position: absolute;  /* ❌ Container가 제어함 */
  top: 0;              /* ❌ Container가 제어함 */
  left: 0;             /* ❌ Container가 제어함 */
}
```

✅ **권장**:
```css
/* 내부 레이아웃과 디자인만 정의 */
.dashboard-header {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}
```

### 통합 예시

**패널 설정** (Container inline style):
```html
<div class="component-container" style="
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 80px;
">
```

**views/Header.html**:
```html
<div class="dashboard-header">
  <div class="header-left">...</div>
  <div class="header-center">...</div>
  <div class="header-right">...</div>
</div>
```

**styles/Header.css**:
```css
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: #ffffff;
}
```

**최종 렌더링**:
```html
<div class="component-container" style="position: absolute; top: 0; width: 100%; height: 80px;">
  <div class="dashboard-header" style="display: flex; padding: 1rem 2rem; background: #fff;">
    ...
  </div>
</div>
```

---

## 사용 방법

### 1. 프로젝트 복사
```bash
cp -r example_dashboard_01 my_dashboard
cd my_dashboard
```

### 2. 컴포넌트 수정
- `components/` 폴더의 각 컴포넌트 register/destroy 스크립트 수정
- 구독 topic, 이벤트 스키마, 핸들러 로직 커스터마이징

### 3. 페이지 스크립트 수정
- `pages/page_before_load.js` - 이벤트 핸들러 추가/수정
- `pages/page_loaded.js` - 데이터 토픽, endpoint, refresh interval 수정
- `pages/page_before_unload.js` - 필요시 추가 정리 로직

### 4. 데이터셋 설정
- 실제 API endpoint로 변경
- datasetName과 param 수정

---

## 베스트 프랙티스

### ✅ DO
```javascript
// 메서드 바인딩
this.myMethod = myMethod.bind(this);

// 명시적 정리
function onInstanceUnLoad() {
    removeCustomEvents(this, this.customEvents);
    this.customEvents = null;
}

// HTML template 활용
const template = this.element.querySelector('#item-template');
const clone = template.content.cloneNode(true);
clone.querySelector('.item-name').textContent = item.name;
container.appendChild(clone);

// HTML dataset 활용
data-index="${index}"
data-product-id="${product.id}"

// Primitive 조합
const data = await WKit.fetchData(this, datasetName, param);
```

### ❌ DON'T
```javascript
// 화살표 함수 (일관성을 위해 일반 함수 권장)
this.myMethod = (data) => { ... };

// 정리 로직 누락 (메모리 누수)
// ...

// 복잡한 객체를 JSON으로 저장
data-user='{"name":"John",...}'  // ❌

// 하드코딩된 ID
param: { id: 'hardcoded-id' }  // ❌
```

---

## 확장 가이드

### 새 컴포넌트 추가
1. `components/MyComponent_register.js` 생성
2. 패턴 선택:
   - 2D only → Event Binding
   - 2D + Data → Event Binding + Subscription
   - 3D + Data → 3D Event Binding + Subscription
3. `components/MyComponent_destroy.js` 생성
4. 이벤트/구독 정리 로직 작성

### 새 데이터 토픽 추가
1. `page_loaded.js`의 `globalDataMappings`에 추가
2. 컴포넌트에서 `subscriptions` 스키마에 추가
3. 핸들러 함수 작성

### 새 이벤트 추가
1. 컴포넌트의 `customEvents` 스키마에 추가
2. `page_before_load.js`의 `eventBusHandlers`에 핸들러 추가

---

## CSS 파일 구조

각 컴포넌트의 스타일은 `styles/` 폴더에 독립적인 CSS 파일로 분리되어 있습니다.

### CSS 파일 목록

| 파일 | 크기 | 설명 |
|------|------|------|
| `Header.css` | 3.5KB | Header 컴포넌트 스타일 (헤더, 알림, 사용자 프로필) |
| `Sidebar.css` | 2.4KB | Sidebar 컴포넌트 스타일 (네비게이션 메뉴) |
| `SalesChart.css` | 1.6KB | SalesChart 위젯 스타일 (ECharts 컨테이너, 헤더) |
| `ProductList.css` | 4.2KB | ProductList 테이블 스타일 (테이블, 행, 액션 버튼) |
| `SalesStats.css` | 1.6KB | SalesStats 위젯 스타일 (ECharts 컨테이너, 헤더) |
| `Product3DViewer.css` | 4.4KB | 3D 뷰어 스타일 (캔버스, 썸네일, 컨트롤) |

### HTML과 CSS 연결

각 HTML 파일은 대응하는 CSS 파일을 참조합니다:

```html
<!-- views/Header.html -->
<header class="dashboard-header">
    <!-- HTML content -->
</header>

<!-- Styles: See styles/Header.css -->
```

### CSS 파일 로드 방법

**중요**: CSS 파일 사용 전 `#component-id`를 실제 Container ID로 교체해야 합니다!

#### 1. CSS 파일 커스터마이징 (필수 단계)

```bash
# Header 컴포넌트 예시 (Container ID: header-123)
sed 's/#component-id/#header-123/g' styles/Header.css > Header-custom.css

# Sidebar 컴포넌트 예시 (Container ID: sidebar-456)
sed 's/#component-id/#sidebar-456/g' styles/Sidebar.css > Sidebar-custom.css
```

또는 텍스트 에디터에서 직접 교체:
```css
/* styles/Header.css - 수정 전 */
#component-id .dashboard-header { ... }

/* Header-custom.css - 수정 후 */
#header-123 .dashboard-header { ... }
```

#### 2. 커스터마이징된 CSS 로드

```html
<!-- 각 컴포넌트의 커스텀 CSS 로드 -->
<link rel="stylesheet" href="styles/Header-custom.css">
<link rel="stylesheet" href="styles/Sidebar-custom.css">
```

#### 3. 동적 로드 (JavaScript)
```javascript
// 컴포넌트 ID에 맞게 CSS 동적 생성 및 로드
function loadComponentCSS(componentName, containerId) {
    fetch(`styles/${componentName}.css`)
        .then(response => response.text())
        .then(css => {
            // #component-id를 실제 ID로 교체
            const customCSS = css.replace(/#component-id/g, `#${containerId}`);

            // style 태그 생성 및 삽입
            const style = document.createElement('style');
            style.textContent = customCSS;
            document.head.appendChild(style);
        });
}

// 사용 예시
loadComponentCSS('Header', 'header-123');
loadComponentCSS('Sidebar', 'sidebar-456');
```

### CSS 네이밍 규칙

모든 CSS 클래스는 BEM 스타일을 따릅니다:

```css
/* Block: 컴포넌트의 최상위 */
.dashboard-header { }

/* Element: 블록의 하위 요소 */
.header-left { }
.header-center { }
.header-right { }

/* Modifier: 상태 변화 */
.notification-badge { }
.user-profile:hover { }
```

---

## HTML Template 패턴

이 프로젝트는 동적 HTML 렌더링에 `<template>` 태그를 활용합니다.

### 패턴 개요

**HTML (`views/` 폴더)**:
```html
<!-- 컨테이너 -->
<div class="items-container" id="items-list"></div>

<!-- Template 정의 -->
<template id="item-template">
    <div class="item" data-item-id="">
        <span class="item-name"></span>
        <span class="item-price"></span>
    </div>
</template>
```

**JavaScript (Component register)**:
```javascript
function renderItems(data) {
    const container = this.element.querySelector('#items-list');
    const template = this.element.querySelector('#item-template');

    // Clear existing
    container.innerHTML = '';

    // Render each item
    data.forEach((item, index) => {
        // Clone template
        const clone = template.content.cloneNode(true);

        // Set data
        const itemEl = clone.querySelector('.item');
        itemEl.dataset.itemId = item.id;

        clone.querySelector('.item-name').textContent = item.name;
        clone.querySelector('.item-price').textContent = `$${item.price}`;

        // Append to container
        container.appendChild(clone);
    });
}
```

### 실제 구현 예시

#### 1. Header - 알림 렌더링
**Template** (`views/Header.html`):
```html
<template id="notification-item-template">
    <div class="notification-item" data-notification-id="">
        <div class="notification-title"></div>
        <div class="notification-message"></div>
    </div>
</template>
```

**Render** (`components/Header_register.js`):
```javascript
function renderNotifications(data) {
    const notifications = data?.items || [];
    const dropdownEl = this.element.querySelector('.notification-dropdown');
    const template = this.element.querySelector('#notification-item-template');

    dropdownEl.innerHTML = '';

    notifications.forEach((notification) => {
        const clone = template.content.cloneNode(true);

        clone.querySelector('.notification-item').dataset.notificationId = notification.id;
        clone.querySelector('.notification-title').textContent = notification.title;
        clone.querySelector('.notification-message').textContent = notification.message;

        dropdownEl.appendChild(clone);
    });
}
```

#### 2. Sidebar - 동적 메뉴 렌더링
**Template** (`views/Sidebar.html`):
```html
<template id="nav-item-template">
    <li class="nav-item" data-page="">
        <div class="nav-link">
            <span class="nav-icon"></span>
            <span class="nav-label"></span>
            <span class="nav-badge"></span>
        </div>
    </li>
</template>
```

**Render** (`components/Sidebar_register.js`):
```javascript
function renderNavigationMenu(data) {
    const menuItems = data?.items || [];
    const navListEl = this.element.querySelector('#nav-menu-list');
    const template = this.element.querySelector('#nav-item-template');

    navListEl.innerHTML = '';

    menuItems.forEach((item) => {
        const clone = template.content.cloneNode(true);

        clone.querySelector('.nav-item').dataset.page = item.page;
        clone.querySelector('.nav-icon').textContent = item.icon;
        clone.querySelector('.nav-label').textContent = item.label;

        if (item.badge > 0) {
            clone.querySelector('.nav-badge').textContent = item.badge;
            clone.querySelector('.nav-badge').style.display = 'block';
        }

        navListEl.appendChild(clone);
    });
}
```

#### 3. ProductList - 테이블 행 렌더링
**Template** (`views/ProductList.html`):
```html
<template id="product-row-template">
    <tr class="product-row" data-index="" data-product-id="">
        <td class="product-id"></td>
        <td class="product-name-text"></td>
        <td class="product-price"></td>
    </tr>
</template>
```

**Render** (`components/ProductList_register.js`):
```javascript
function renderProductTable(data) {
    const products = data || [];
    const tableBody = this.element.querySelector('.product-table-body');
    const template = this.element.querySelector('#product-row-template');

    tableBody.innerHTML = '';

    products.forEach((product, index) => {
        const clone = template.content.cloneNode(true);

        clone.querySelector('.product-row').dataset.index = index;
        clone.querySelector('.product-row').dataset.productId = product.id;
        clone.querySelector('.product-id').textContent = product.id;
        clone.querySelector('.product-name-text').textContent = product.name;
        clone.querySelector('.product-price').textContent = `$${product.price}`;

        tableBody.appendChild(clone);
    });
}
```

### Template 패턴 장점

✅ **성능**: 브라우저가 최적화된 방식으로 DOM 조작
✅ **가독성**: HTML 구조가 명확하게 분리됨
✅ **재사용성**: 같은 템플릿을 여러 곳에서 사용 가능
✅ **유지보수**: HTML과 JavaScript 로직 분리
✅ **타입 안전**: 템플릿 구조가 명확해 오타 방지

### Template vs String Concatenation

❌ **String Concatenation (이전 방식)**:
```javascript
// 가독성 낮음, XSS 위험, 오타 가능성
tableBody.innerHTML = products.map(p => `
    <tr data-id="${p.id}">
        <td>${p.name}</td>
        <td>$${p.price}</td>
    </tr>
`).join('');
```

✅ **Template (권장 방식)**:
```javascript
// 가독성 높음, XSS 안전, 구조 명확
products.forEach(p => {
    const clone = template.content.cloneNode(true);
    clone.querySelector('.product-row').dataset.id = p.id;
    clone.querySelector('.product-name').textContent = p.name;
    clone.querySelector('.product-price').textContent = `$${p.price}`;
    tableBody.appendChild(clone);
});
```

---

## 참고 자료

### 프로젝트 문서
- `CONTAINER_STYLES.md` - **Container 스타일 가이드** (패널 설정 필수!)
- `README.md` - 프로젝트 전체 가이드 (현재 문서)

### 상위 문서
- `CLAUDE.md` - 런타임 프레임워크 설계 문서
- `IOT_Dashboard/` - 원본 패턴 예제
- `Runtime_Scaffold_code_sample/` - 스캐폴드 코드 샘플

---

**버전**: 1.5.0
**작성일**: 2025-11-21
**업데이트**:
- v1.5.0: **ECharts 통합** (SalesChart: Line chart, SalesStats: Bar chart)
  - `echarts.init()` / `setOption()` / `dispose()` 패턴
  - `<div id="echarts">` 구조로 HTML 간소화
  - CSS 간소화 (ECharts 컨테이너 전용 스타일)
- v1.4.0: Component ID 스코프 추가 (모든 CSS에 #component-id 접두사)
- v1.3.0: Container 구조 추가 (런타임 애플리케이션 대응, CONTAINER_STYLES.md)
- v1.2.0: CSS 파일 분리 (styles 폴더, 컴포넌트별 독립 스타일)
- v1.1.0: HTML Template 패턴 추가 (views 폴더, 동적 렌더링)
- v1.0.0: 초기 버전 (컴포넌트, 페이지 스크립트)
**작성자**: Claude Code
