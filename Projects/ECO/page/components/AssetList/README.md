# AssetList

자산 목록을 표시하고 검색/필터링하는 컴포넌트

## 기능

- **자산 목록 표시**: Tabulator 테이블로 전체 자산 표시
- **검색**: 자산 이름/ID로 텍스트 검색
- **필터**: 타입별(UPS/PDU/CRAC/Sensor), 상태별(Normal/Warning/Critical)
- **팝업 연동**: 행 클릭 시 해당 타입의 팝업 컴포넌트 호출

## 데이터 구조

```javascript
{
    assets: [
        { id: 'ups-001', name: 'UPS-A1', type: 'ups', zone: 'Zone-A', status: 'normal' },
        { id: 'pdu-001', name: 'PDU-A1', type: 'pdu', zone: 'Zone-A', status: 'warning' },
        // ...
    ]
}
```

## datasetInfo

| datasetName | param | 설명 |
|-------------|-------|------|
| `assets` | `{}` | 전체 자산 목록 조회 |

## Public Methods

| 메서드 | 설명 |
|--------|------|
| `search(term)` | 검색어로 필터링 |
| `filterByType(type)` | 타입으로 필터링 (all/ups/pdu/crac/sensor) |
| `filterByStatus(status)` | 상태로 필터링 (all/normal/warning/critical) |
| `refresh()` | 데이터 새로고침 |
| `registerPopupComponent(type, component)` | 팝업 컴포넌트 등록 |

## 팝업 연동

페이지 loaded.js에서 팝업 컴포넌트를 등록:

```javascript
// page/page_scripts/loaded.js
const assetList = this.page.components.find(c => c.name === 'AssetList');
const upsComponent = this.page.components.find(c => c.name === 'UPS');

if (assetList && upsComponent) {
    assetList.registerPopupComponent('ups', upsComponent);
}
```

## 파일 구조

```
AssetList/
├── scripts/
│   ├── register.js       # 메인 로직
│   └── beforeDestroy.js  # 정리
├── styles/
│   └── component.css     # 다크 테마 스타일
├── views/
│   └── component.html    # UI 구조
└── README.md
```
