# AssetTree

계층형 자산 트리 뷰어. 검색 기능 포함.

## 데이터 구조

```javascript
{
    title: "Asset Tree",           // 트리 제목
    items: [                       // 트리 노드 배열
        {
            id: "1",               // 노드 고유 ID
            name: "Building A",    // 노드 이름
            type: "zone",          // 노드 타입 (아이콘 결정)
            children: [...]        // 자식 노드 배열
        }
    ]
}
```

### 타입별 아이콘

| type | 아이콘 | 용도 |
|------|--------|------|
| `folder` | 📁 | 폴더/그룹 |
| `zone` | 🏢 | 구역/건물 |
| `equipment` | ⚙️ | 설비 |
| `sensor` | 📡 | 센서 |
| `device` | 💻 | 장치 |
| `meter` | 📊 | 계량기 |
| `alarm` | 🔔 | 알람 |
| `default` | 📄 | 기본값 |

## 구독 (Subscriptions)

| Topic | 함수 | 설명 |
|-------|------|------|
| `TBD_topicName` | `renderData` | 트리 데이터 수신 시 전체 렌더링 |

## 발행 이벤트 (Events)

| 이벤트 | 발생 시점 | payload |
|--------|----------|---------|
| `@TBD_nodeClicked` | 노드 클릭 | `{ event, targetInstance }` |
| `@TBD_nodeToggled` | 펼침/접힘 토글 | `{ event, targetInstance }` |
| `@TBD_expandAllClicked` | 전체 펼치기 클릭 | `{ event, targetInstance }` |
| `@TBD_collapseAllClicked` | 전체 접기 클릭 | `{ event, targetInstance }` |
| `@TBD_searchChanged` | 검색어 입력 | `{ event, targetInstance }` |

## 내부 동작

### 펼침/접힘
- 화살표(▶) 클릭 시 자식 노드 표시/숨김
- `_expandedNodes` Set으로 펼쳐진 노드 ID 관리
- 전체 펼치기/접기 버튼 지원

### 노드 선택
- 노드 클릭 시 `.selected` 클래스 적용
- `_selectedNodeId`로 선택된 노드 추적

### 검색
- 실시간 필터링 (input 이벤트)
- 매칭 노드 하이라이트 (`.highlight` 클래스)
- 매칭 노드의 부모는 자동 펼침
- 비매칭 부모는 흐리게 표시 (`.dimmed` 클래스)

## TBD 항목

실제 사용 시 변경 필요:

```javascript
// config
titleKey: 'TBD_title' → 'title'
itemsKey: 'TBD_items' → 'items'
fields.id: 'TBD_id' → 'id'
fields.name: 'TBD_name' → 'name'
fields.type: 'TBD_type' → 'type'
fields.children: 'TBD_children' → 'children'

// subscriptions
TBD_topicName → 'assetData'

// events
@TBD_nodeClicked → '@nodeClicked'
```

## 파일 구조

```
AssetTree/
├── views/component.html    # HTML 구조
├── styles/component.css    # 스타일
├── scripts/
│   ├── register.js         # 초기화, 렌더링, 이벤트
│   └── beforeDestroy.js    # 정리
├── preview.html            # 독립 테스트
└── README.md               # 이 문서
```
