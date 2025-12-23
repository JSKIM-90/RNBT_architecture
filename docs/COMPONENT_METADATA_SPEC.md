# 컴포넌트 메타데이터 명세서

> tb_package.json과 property_panel_info의 상세 분석

## 개요

RENOBIT에서 새 컴포넌트를 추가하려면 두 가지 메타데이터 정의가 필요합니다:

1. **tb_package.json**: 컴포넌트 등록 정보 (서버/에디터 연동)
2. **property_panel_info**: 속성 패널 UI 정의 (에디터 내 속성 편집)

---

## 1. tb_package.json

### 1.1 전체 구조

```json
{
  "UPDATE": {
    "componentInstallService.insertData": [
      {
        "TB_PACKAGES": [ /* 컴포넌트 배열 */ ]
      }
    ]
  },
  "DELETE": {
    "adminService.deletePack": [
      { "pack_name": "PackName" }
    ]
  }
}
```

### 1.2 TB_PACKAGES 필드 명세

| 필드 | 필수 | 타입 | 역할 | 사용처 |
|------|:----:|------|------|--------|
| **FILE_ID** | ✅ | string | 컴포넌트 고유 식별자 | `componentPanelInfoMap`의 키 |
| **LABEL** | ✅ | string | 에디터 UI 표시명 | 컴포넌트 패널 목록 |
| **NAME** | ✅ | string | 컴포넌트 클래스명 | `eval(name)`으로 클래스 로드 |
| **INSTANCE_NAME** | ✅ | string | 인스턴스 기본 접두사 | 인스턴스명 생성 시 사용 |
| **TYPE** | ✅ | string | `"component"` / `"extension"` | 로딩 분기 처리 |
| **PACK_NAME** | ✅ | string | 소속 팩 이름 | 그룹핑, 삭제 시 사용 |
| **LAYER** | ✅ | string | `"2D"` / `"3D"` | 레이어 분류 |
| **CATEGORY** | ✅ | string | 컴포넌트 카테고리 | 패널 트리 구조 |
| **FILE_PATH** | ✅ | string | JS 파일 경로 | 동적 스크립트 로딩 |
| **STYLE_PATH** | ❌ | string | CSS 파일 경로 | 스타일시트 로딩 |
| **PROPS** | ✅ | object | 컴포넌트 기본 속성 | 드래그&드롭 시 전달 |
| **MAJOR** | ✅ | string | 메이저 버전 | 버전 관리 |
| **MINOR** | ✅ | string | 마이너 버전 | 버전 관리 |

### 1.3 PROPS 내부 구조

```javascript
{
  "id": "MyComponent",        // FILE_ID와 동일
  "label": "My Component",    // LABEL과 동일
  "name": "MyComponent",      // NAME과 동일
  "show": true,               // 컴포넌트 패널 표시 여부
  "initProperties": {         // (선택) 초기 속성 오버라이드
    "props": {
      "setter": {
        "width": 300,
        "height": 200
      }
    }
  }
}
```

### 1.4 2D 컴포넌트 예시

```json
{
  "FILE_ID": "FreeCode",
  "LABEL": "FreeCode",
  "NAME": "FreeCode",
  "INSTANCE_NAME": "FreeCode",
  "TYPE": "component",
  "PACK_NAME": "Template",
  "LAYER": "2D",
  "CATEGORY": "FreeCode",
  "FILE_PATH": "custom/packs/Template/components/FreeCode/FreeCode.js",
  "PROPS": {
    "id": "FreeCode",
    "label": "FreeCode",
    "name": "FreeCode",
    "show": true
  },
  "MAJOR": "3.2",
  "MINOR": "0"
}
```

### 1.5 3D 컴포넌트 예시

```json
{
  "FILE_ID": "Model Loader",
  "LABEL": "ModelLoader",
  "NAME": "ModelLoaderComponent",
  "INSTANCE_NAME": "3d_Model",
  "TYPE": "component",
  "PACK_NAME": "Three",
  "LAYER": "3D",
  "CATEGORY": "Modeling",
  "FILE_PATH": "custom/packs/Three/components/basic/ModelLoaderComponent/ModelLoaderComponent.js",
  "PROPS": {
    "id": "Model Loader",
    "label": "Model Loader",
    "name": "ModelLoaderComponent",
    "show": true,
    "initProperties": {
      "props": {
        "setter": {
          "size": { "x": 10, "y": 10, "z": 10 }
        }
      }
    }
  },
  "MAJOR": "174",
  "MINOR": "0"
}
```

---

## 2. property_panel_info

### 2.1 정의 방법

`attach_default_component_infos` 호출 시 **기본 메타데이터가 자동으로 설정**됩니다.

**2D 기본 property_panel_info (자동 포함):**
- `primary` - 일반 속성 (이름)
- `pos-size-2d` - 위치/크기

**2D 기본 event_info (자동 포함):**
- `register` - 컴포넌트 등록 완료
- `completed` - completed 이벤트
- `beforeDestroy` - 제거 직전 이벤트
- `destroy` - destroy 이벤트
- `preview` - 에디터 미리보기 이벤트

> **Note**: 2D 컴포넌트는 `attach_default_component_infos()`만 호출하면 위 기본값들이 자동 적용됩니다.
> `property_panel_info`나 `event_info`를 직접 할당할 필요가 없습니다.

**추가 속성이 필요한 경우: add_property_panel_group_info 사용**

```javascript
WV3DPropertyManager.add_property_panel_group_info(ModelLoaderComponent, {
  label: 'Resource',
  template: 'resource',
  children: [
    {
      owner: 'setter',
      name: 'selectItem',
      type: 'resource',
      label: 'Resource',
      show: true,
      writable: true,
      description: '3D Object',
      options: { type: 'gltf' }
    }
  ]
});
```

### 2.2 그룹(Group) 구조

| 필드 | 필수 | 타입 | 역할 |
|------|:----:|------|------|
| **name** | ❌ | string | 그룹 식별자 (내부 참조용) |
| **label** | ❌ | string | 에디터 표시 그룹명 |
| **template** | ✅ | string | 사용할 UI 템플릿 |
| **children** | ❌ | array | 그룹 내 속성 목록 |

### 2.3 사용 가능한 template 목록

#### 2D 기본 (자동 적용)
| template | 용도 | 비고 |
|----------|------|------|
| `primary` | 기본 정보 (이름) | 자동 포함 |
| `pos-size-2d` | 위치/크기 | 자동 포함 |

#### 2D 추가 (필요시 add_property_panel_group_info로 추가)
| template | 용도 |
|----------|------|
| `border` | 테두리 |
| `background` | 배경색 |
| `label` | 레이블 속성 |
| `font` | 폰트 설정 |
| `font-type` | 폰트 타입 |
| `cursor` | 커서 스타일 |
| `padding` | 패딩 |
| `spacing` | 간격 |
| `transform` | 변형 (회전, 스케일) |
| `shadow` | 박스 그림자 |
| `text-shadow` | 텍스트 그림자 |
| `tooltip` | 툴팁 |

#### 레이아웃
| template | 용도 |
|----------|------|
| `flex-container` | Flex 컨테이너 |
| `flex-item` | Flex 아이템 |
| `grid-container` | Grid 컨테이너 |
| `grid-item` | Grid 아이템 |
| `layout` | 레이아웃 |

#### 3D 전용
| template | 용도 |
|----------|------|
| `pos-size-3d` | 3D 위치/크기 |
| `label-3d` | 3D 레이블 |
| `default-3d` | 3D 기본 |
| `color-3d` | 3D 색상 |
| `vector` | 벡터 |

#### 특수
| template | 용도 |
|----------|------|
| `resource` | 리소스 선택 (3D 모델) |
| `w-script` | WScript 편집 |
| `template-manager` | 템플릿 관리 |
| `menuset` | 메뉴 설정 |

#### SVG
| template | 용도 |
|----------|------|
| `svg-mode` | SVG 모드 |
| `svg-line` | SVG 라인 |
| `svg-path` | SVG 패스 |
| `svg-circle` | SVG 원 |
| `svg-rect` | SVG 사각형 |

### 2.4 children 속성 구조

| 필드 | 필수 | 타입 | 역할 |
|------|:----:|------|------|
| **owner** | ✅ | string | 속성 그룹 (`setter`, `style`, `label`, `primary`) |
| **name** | ✅ | string | 속성 이름 |
| **type** | ✅ | string | 입력 타입 |
| **label** | ✅ | string | 표시 라벨 |
| **show** | ✅ | boolean | 표시 여부 |
| **writable** | ✅ | boolean | 편집 가능 여부 |
| **description** | ❌ | string | 툴팁 설명 |
| **tag** | ❌ | string | 단위 표시 (`px`, `%`) |
| **minValue** | ❌ | number | 최소값 |
| **maxValue** | ❌ | number | 최대값 |
| **options** | ❌ | object | 타입별 추가 옵션 |
| **defaultValue** | ❌ | any | 기본값 |

### 2.5 type 종류

| type | 용도 | 예시 |
|------|------|------|
| `string` | 텍스트 입력 | 이름, 라벨 |
| `number` | 숫자 입력 | x, y, width, height |
| `boolean` | 체크박스 | visible, lock |
| `checkbox` | 체크박스 | (boolean과 동일) |
| `color` | 컬러 피커 | backgroundColor |
| `border` | 테두리 편집기 | border |
| `resource` | 리소스 선택기 | 3D 모델, 이미지 |

---

## 3. 컴포넌트 등록 흐름

```
┌─────────────────────────────────────────────────────────────┐
│ 1. tb_package.json 작성                                      │
│    - TB_PACKAGES에 컴포넌트 메타데이터 추가                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. 서버 API (editorService.getPackages)                      │
│    - DB에서 패키지 정보 조회 → 클라이언트로 전달             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ComponentLibraryManager.mixComponentPanelInfoList()       │
│    - LAYER에 따라 two_layer/three_layer 분류                 │
│    - CATEGORY로 그룹핑                                       │
│    - PROPS를 children으로 등록                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. ComponentLibraryLoader._loadComponentAt()                 │
│    - FILE_PATH로 JS 파일 동적 로드                           │
│    - eval(NAME)으로 클래스 가져오기                          │
│    - _componentListMap에 등록                                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. 에디터 컴포넌트 패널에 표시                               │
│    - ComponentListPanel.vue에서 렌더링                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. 드래그&드롭 → 인스턴스 생성                               │
│    - PROPS 데이터로 ComponentInstanceFactory 호출            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 새 컴포넌트 추가 체크리스트

### 4.1 2D 컴포넌트 (FreeCodeMixin 사용)

**Step 1: 컴포넌트 클래스 작성**

```javascript
// MyComponent/MyComponent.js
class MyComponent extends WVDOMComponent {
  constructor() {
    super();
    ComponentMixin.applyFreeCodeMixin(this);
  }

  _onImmediateUpdateDisplay() {
    super._onImmediateUpdateDisplay();
    // 컴포넌트 고유의 업데이트 로직
  }

  _onDestroy() {
    // 컴포넌트 고유의 정리 로직
    super._onDestroy();
  }
}

// 기본 속성 등록 (property_panel_info, event_info 자동 포함)
WVPropertyManager.attach_default_component_infos(MyComponent, {
  info: {
    componentName: 'MyComponent',
    componentType: 'htmlCssJsEditable',
    componentPackName: 'Template',
    componentCategory: 'Custom',
    version: '1.0.0',
  },
  setter: {
    width: 200,
    height: 200,
    widthUnit: 'px',
    heightUnit: 'px',
  },
  publishCode: {
    htmlCode: '<div class="my-component">Hello</div>',
    cssCode: '.my-component { color: blue; }',
  },
});

// property_panel_info: ['primary', 'pos-size-2d'] 자동 적용
// event_info: ['register', 'completed', 'beforeDestroy', 'destroy', 'preview'] 자동 적용
```

**FreeCodeMixin이 제공하는 기능:**
- `getExtensionProperties()`: 확장 속성 사용 여부
- `_onCreateElement()`: 요소 생성 시 onLoadPage 호출
- `onLoadPage()`: 빈 코드일 때 미리보기 이미지 표시 + 부모 클래스 호출
- `setPreviewImage()`: 미리보기 이미지 설정
- `resetPreviewImage()`: 미리보기 이미지 리셋

**Step 2: tb_package.json에 등록**

```json
{
  "FILE_ID": "MyComponent",
  "LABEL": "My Component",
  "NAME": "MyComponent",
  "INSTANCE_NAME": "my_component",
  "TYPE": "component",
  "PACK_NAME": "Template",
  "LAYER": "2D",
  "CATEGORY": "Custom",
  "FILE_PATH": "custom/packs/Template/components/MyComponent/MyComponent.js",
  "PROPS": {
    "id": "MyComponent",
    "label": "My Component",
    "name": "MyComponent",
    "show": true
  },
  "MAJOR": "1.0",
  "MINOR": "0"
}
```

### 4.2 3D 컴포넌트 (ModelLoaderComponent 기반)

**Step 1: 컴포넌트 클래스 작성**

```javascript
// My3DComponent/My3DComponent.js
class My3DComponent extends WV3DResourceComponent {
  constructor() {
    super();
    ComponentMixin.applyModelLoaderMixin(this);
  }

  _onImmediateUpdateDisplay() {
    super._onImmediateUpdateDisplay();
    // 업데이트 로직
  }

  _onDestroy() {
    // 정리 로직
    super._onDestroy();
  }
}

// 기본 속성 등록
WV3DPropertyManager.attach_default_component_infos(My3DComponent, {
  setter: {
    size: { x: 10, y: 10, z: 10 },
    selectItem: '',
  },
  label: {
    label_text: 'My3DComponent',
  },
  info: {
    componentName: 'My3DComponent',
    componentType: 'htmlCssJsEditable',
    version: '1.0.0',
  },
});

// 리소스 속성 추가
WV3DPropertyManager.add_property_panel_group_info(My3DComponent, {
  label: 'Resource',
  template: 'resource',
  children: [
    {
      owner: 'setter',
      name: 'selectItem',
      type: 'resource',
      label: 'Resource',
      show: true,
      writable: true,
      description: '3D Object',
      options: { type: 'gltf' },
    },
  ],
});
```

**Step 2: tb_package.json에 등록**

```json
{
  "FILE_ID": "My3DComponent",
  "LABEL": "My 3D Component",
  "NAME": "My3DComponent",
  "INSTANCE_NAME": "3d_my_component",
  "TYPE": "component",
  "PACK_NAME": "Three",
  "LAYER": "3D",
  "CATEGORY": "Custom",
  "FILE_PATH": "custom/packs/Three/components/basic/My3DComponent/My3DComponent.js",
  "PROPS": {
    "id": "My3DComponent",
    "label": "My 3D Component",
    "name": "My3DComponent",
    "show": true,
    "initProperties": {
      "props": {
        "setter": {
          "size": { "x": 10, "y": 10, "z": 10 }
        }
      }
    }
  },
  "MAJOR": "1.0",
  "MINOR": "0"
}
```

---

## 5. 관련 소스 파일 참조

| 파일 | 역할 |
|------|------|
| `packages/packs/src/*/tb_package.json` | 팩별 컴포넌트 등록 정보 |
| `packages/static/files/common/libs/solution/ComponentMixin.js` | 컴포넌트 Mixin (FreeCode, ModelLoader) |
| `packages/common/src/wemb/core/component/2D/WVDOMComponent.ts` | 2D 컴포넌트 기본 클래스 |
| `packages/common/src/wemb/wv/managers/ComponentLibraryManager.ts` | 컴포넌트 로딩/관리 |
| `packages/common/src/wemb/core/component/WVComponentPropertyManager.ts` | 2D 속성 관리자 |
| `packages/common/src/wemb/core/component/3D/manager/WV3DComponentPropertyManager.ts` | 3D 속성 관리자 |
| `packages/editor/src/editor/view/panel/componentListPanel/ComponentListPanel.vue` | 컴포넌트 패널 UI |
| `packages/common/src/common/api/componentApi.ts` | 서버 API 호출 |

---

*최종 업데이트: 2025-12-23 (2D 기본 메타데이터 자동화 반영)*
