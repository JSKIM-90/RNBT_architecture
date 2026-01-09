# ECO (Energy & Cooling Operations) Dashboard

데이터센터 전력/냉방 장비 모니터링 대시보드

## 컴포넌트 구조

```
page/
├── components/
│   ├── UPS/              # 무정전 전원장치 (자기완결)
│   ├── PDU/              # 분전반 (자기완결)
│   ├── CRAC/             # 항온항습기 (자기완결)
│   ├── TempHumiditySensor/  # 온습도 센서 (자기완결)
│   ├── Overview/         # 대시보드 개요 (GlobalDataPublisher 구독)
│   └── AssetTree/        # 자산 트리 (GlobalDataPublisher 구독)
└── page_scripts/
    ├── before_load.js    # 이벤트 핸들러 등록
    ├── loaded.js         # 초기화
    └── before_unload.js  # 정리
```

## 컴포넌트 패턴

### 자기완결 컴포넌트 (UPS, PDU, CRAC, TempHumiditySensor)
- 3D 오브젝트 클릭 시 `showDetail()` 호출
- 컴포넌트 내부에서 `fetchData`로 데이터 조회
- 팝업 생성/관리도 컴포넌트 내부 처리

### GlobalDataPublisher 구독 컴포넌트 (Overview, AssetTree)
- `subscribe(topic, instance, callback)` 패턴
- 페이지에서 데이터 발행, 컴포넌트에서 수신

## 이벤트 바인딩 설계

### 핵심 원칙
```
customEvents → 페이지 핸들러 → Public API
```

컴포넌트는 이벤트 발송만, 페이지가 제어권 보유.

### AssetTree 작업 시 배운 점

**문제 1: 이벤트 중복 바인딩**
```javascript
// 잘못된 예 - 같은 요소에 두 번 바인딩
this.customEvents = { click: { '.btn': '@clicked' } };
bindEvents(this, this.customEvents);
this.appendElement.querySelector('.btn').addEventListener('click', handler); // 중복!
```

**문제 2: 동적 요소 직접 바인딩**
```javascript
// 잘못된 예 - 매번 재바인딩 필요
function updateView() {
    container.innerHTML = buildHTML();
    bindTreeEvents(container); // 동적 요소마다 addEventListener
}
```

**해결: Wkit의 이벤트 위임 활용**
```javascript
// delegate 함수가 instance.element에 리스너 등록
// event.target.closest(selector)로 동적 요소도 처리
this.customEvents = {
    click: {
        '.node-toggle': '@nodeToggled',  // 동적 생성 요소도 OK
        '.asset-node': '@assetClicked'
    }
};
bindEvents(this, this.customEvents);
```

### 페이지 핸들러 구조
```javascript
// before_load.js
this.eventBusHandlers = {
    '@nodeToggled': ({ event, targetInstance }) => {
        const nodeId = event.target.closest('.node-header')?.dataset.nodeId;
        targetInstance.toggleNode(nodeId);  // Public API 호출
    },
    '@assetClicked': ({ event, targetInstance }) => {
        const node = event.target.closest('.asset-node');
        targetInstance.selectAsset(node.dataset.assetId, node.dataset.assetType);
    }
};
```

### 컴포넌트 Public API
```javascript
// register.js
this.toggleNode = function(nodeId) { /* ... */ };
this.selectAsset = function(assetId, assetType) { /* ... */ };
this.search = function(term) { /* ... */ };
this.filter = function(status) { /* ... */ };
this.expandAll = function() { /* ... */ };
this.collapseAll = function() { /* ... */ };
```

## Template 기반 렌더링

### 문자열 HTML 생성 → template 태그
```html
<!-- component.html -->
<template id="tpl-asset-node">
    <li class="tree-node asset-node" data-asset-id="" data-asset-type="">
        <div class="node-header asset-header">
            <span class="status-dot"></span>
            <span class="node-label"></span>
            <span class="asset-id"></span>
        </div>
    </li>
</template>
```

```javascript
// register.js
const node = this._templates.asset.content.cloneNode(true).firstElementChild;
node.dataset.assetId = asset.id;
node.querySelector('.node-label').textContent = asset.name;
```

## 실행

```bash
cd mock_server
npm install
npm start  # port 3000
```
