# WKit.clearSceneBackground

## 위치
`WKit.js:100-108`

## 시그니처
```javascript
WKit.clearSceneBackground(scene: THREE.Scene): void
```

## 역할
Scene의 background (Texture 또는 CubeTexture)를 dispose하고 null로 설정합니다.

**주요 기능**:
1. `scene.background`가 Texture/CubeTexture인지 확인
2. dispose() 메소드 있으면 호출 (GPU 메모리 해제)
3. scene.background를 null로 설정

이 API는 **페이지 unload 시 Scene의 배경 이미지 메모리 정리**를 담당합니다.

## 현재 설계에서의 필요성
**필요함** ⭐⭐⭐⭐

**이유**:
- Scene background로 Texture나 CubeTexture(Skybox) 사용 시 메모리 점유
- 페이지 전환 시 명시적으로 dispose 필요
- dispose3DTree와 함께 사용하여 완전한 메모리 정리

## 사용 예시
```javascript
// Page - before_unload
function clearThreeInstances() {
  const { scene } = wemb.threeElements;

  // 모든 3D 객체 정리
  fx.go(
    WKit.makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
  );

  // Scene background 정리
  WKit.clearSceneBackground(scene);
}
```

## 데이터 흐름
```
scene.background
  ↓
Texture 또는 CubeTexture인가?
  ├─ Yes → bg.dispose() 호출 (GPU 메모리 해제)
  └─ No (Color 등) → dispose 불필요
  ↓
scene.background = null
```

## 구현 분석

### 현재 코드
```javascript
WKit.clearSceneBackground = function (scene) {
  const bg = scene.background;

  if (bg && bg.dispose) {
    bg.dispose(); // Texture나 CubeTexture일 경우만 dispose 존재
  }

  scene.background = null;
};
```

### 잘된 점 ✅
1. **Optional dispose**: `bg.dispose`로 dispose 메소드 존재 여부 확인
2. **간결함**: 불필요한 복잡성 없이 핵심 기능만 수행
3. **Color 호환**: background가 THREE.Color인 경우 안전하게 처리

### 개선점 ⚠️

#### 1. scene null 체크 없음
**현재 코드**:
```javascript
WKit.clearSceneBackground = function (scene) {
  const bg = scene.background;  // scene이 null이면 에러
  // ...
}
```

**문제점**:
- `scene`이 null/undefined면 즉시 에러
- 방어적 코딩 부족

**개선안**:
```javascript
WKit.clearSceneBackground = function (scene) {
  if (!scene) {
    console.warn('[WKit.clearSceneBackground] scene is null or undefined');
    return;
  }

  const bg = scene.background;

  if (bg && bg.dispose) {
    bg.dispose();
  }

  scene.background = null;
};
```

#### 2. scene.environment 정리 누락
**문제점**:
- Three.js에서 `scene.environment`도 Texture일 수 있음 (IBL - Image Based Lighting)
- background만 정리하고 environment는 남아있으면 불완전

**개선안** (함수명 변경 고려):
```javascript
WKit.clearSceneTextures = function (scene) {
  if (!scene) {
    console.warn('[WKit.clearSceneTextures] scene is null or undefined');
    return;
  }

  // Background 정리
  if (scene.background && scene.background.dispose) {
    scene.background.dispose();
  }
  scene.background = null;

  // Environment 정리 (IBL)
  if (scene.environment && scene.environment.dispose) {
    scene.environment.dispose();
  }
  scene.environment = null;
};
```

#### 3. 에러 처리 없음
**문제점**:
- dispose() 중 에러 발생 가능
- 에러 시 scene.background가 null이 안 될 수도

**개선안**:
```javascript
WKit.clearSceneBackground = function (scene) {
  if (!scene) {
    console.warn('[WKit.clearSceneBackground] scene is null or undefined');
    return;
  }

  const bg = scene.background;

  if (bg && bg.dispose) {
    try {
      bg.dispose();
    } catch (err) {
      console.error('[WKit.clearSceneBackground] dispose failed:', err);
    }
  }

  scene.background = null;
};
```

#### 4. 공유 Texture 문제
**문제점**:
- background Texture가 다른 곳에서도 사용 중일 수 있음
- 무조건 dispose하면 다른 곳에서 깨질 수 있음

**개선안** (주의사항 문서화):
```javascript
// 사용 시 주의사항
// scene.background로 사용하는 texture는
// 다른 material 등에서 공유하지 않도록 주의

// 안전한 사용 예:
const bgTexture = new THREE.TextureLoader().load('bg.jpg');
scene.background = bgTexture;  // 오직 background로만 사용

// 위험한 사용 예:
const sharedTexture = new THREE.TextureLoader().load('tex.jpg');
scene.background = sharedTexture;
material.map = sharedTexture;  // 같은 texture 공유
// → clearSceneBackground 호출 시 material.map도 깨짐!
```

#### 5. 함수명과 역할 불일치 가능성
**현재**:
- 함수명: `clearSceneBackground`
- 역할: background dispose + null 설정

**문제점**:
- "clear"가 단순히 null로 설정하는 것처럼 들림
- dispose까지 한다는 게 명확하지 않음

**개선안** (함수명 변경 고려):
```javascript
// 옵션 1: 더 명확한 이름
WKit.disposeSceneBackground = function (scene) {
  // ...
};

// 옵션 2: scene 전체 정리 (environment 포함)
WKit.disposeSceneTextures = function (scene) {
  // background + environment 모두 처리
};

// 옵션 3: 현재 이름 유지하되 문서화 강화
```

## 개선 우선순위
1. **High**: scene null 체크
2. **Medium**: scene.environment 정리 추가
3. **Low**: 에러 처리
4. **Low**: 공유 Texture 주의사항 문서화

## 관련 함수
- `WKit.dispose3DTree()` - Public API (`WKit.js:60-98`)

## 테스트 시나리오
```javascript
// 1. Texture background
const texture = new THREE.TextureLoader().load('background.jpg');
scene.background = texture;

WKit.clearSceneBackground(scene);
// texture.dispose() 호출됨
// scene.background === null

// 2. Color background
scene.background = new THREE.Color(0x000000);

WKit.clearSceneBackground(scene);
// dispose() 호출 안 됨 (Color에는 dispose 없음)
// scene.background === null

// 3. CubeTexture (Skybox)
const cubeTexture = new THREE.CubeTextureLoader().load([
  'px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'
]);
scene.background = cubeTexture;

WKit.clearSceneBackground(scene);
// cubeTexture.dispose() 호출됨
// scene.background === null

// 4. null scene
WKit.clearSceneBackground(null);
// 현재: 에러 발생
// 개선 후: 경고 로그 후 안전하게 종료

// 5. 공유 Texture (주의 필요)
const sharedTex = new THREE.TextureLoader().load('shared.jpg');
scene.background = sharedTex;
material.map = sharedTex;  // 같은 texture 공유

WKit.clearSceneBackground(scene);
// sharedTex.dispose() 호출됨
// material.map도 깨짐! (주의 필요)
```

## 실제 사용 흐름
```javascript
// Page - loaded (배경 설정)
function initScene() {
  const { scene } = wemb.threeElements;

  // 방법 1: Color 배경
  scene.background = new THREE.Color(0x87CEEB);  // 하늘색

  // 방법 2: Texture 배경
  const loader = new THREE.TextureLoader();
  scene.background = loader.load('/assets/background.jpg');

  // 방법 3: CubeTexture (Skybox)
  const cubeLoader = new THREE.CubeTextureLoader();
  scene.background = cubeLoader.load([
    '/assets/skybox/px.jpg',
    '/assets/skybox/nx.jpg',
    '/assets/skybox/py.jpg',
    '/assets/skybox/ny.jpg',
    '/assets/skybox/pz.jpg',
    '/assets/skybox/nz.jpg',
  ]);
}

// Page - before_unload (정리)
function clearThreeInstances() {
  const { scene } = wemb.threeElements;

  // 모든 3D 객체 정리
  fx.go(
    WKit.makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
  );

  // Scene background 정리
  WKit.clearSceneBackground(scene);

  console.log('3D resources cleared');
}

function onPageUnLoad() {
  clearEventBus.call(this);
  clearDataPublisher.call(this);
  clearThreeInstances.call(this);

  this.element.removeEventListener(
    this.raycastingEventType,
    this.raycastingEventHandler
  );
  this.raycastingEventHandler = null;
}
```

## Three.js Scene Background 타입
```javascript
// 1. THREE.Color - dispose 불필요
scene.background = new THREE.Color(0xff0000);

// 2. THREE.Texture - dispose 필요
scene.background = new THREE.TextureLoader().load('bg.jpg');

// 3. THREE.CubeTexture - dispose 필요
scene.background = new THREE.CubeTextureLoader().load([...]);

// 4. null - 기본값
scene.background = null;
```

## 보완 제안: clearSceneTextures
```javascript
// background와 environment 모두 정리
WKit.clearSceneTextures = function (scene) {
  if (!scene) {
    console.warn('[WKit.clearSceneTextures] scene is null or undefined');
    return;
  }

  // Background 정리
  try {
    if (scene.background && scene.background.dispose) {
      scene.background.dispose();
    }
  } catch (err) {
    console.error('[WKit.clearSceneTextures] background dispose failed:', err);
  }
  scene.background = null;

  // Environment 정리 (IBL for PBR)
  try {
    if (scene.environment && scene.environment.dispose) {
      scene.environment.dispose();
    }
  } catch (err) {
    console.error('[WKit.clearSceneTextures] environment dispose failed:', err);
  }
  scene.environment = null;

  console.log('[WKit.clearSceneTextures] Scene textures cleared');
};
```

## 메모리 관련 주의사항
```javascript
// ❌ 나쁜 예: Texture 공유
const texture = new THREE.TextureLoader().load('image.jpg');
scene.background = texture;
material.map = texture;  // 같은 texture

WKit.clearSceneBackground(scene);  // texture dispose됨
// material.map이 깨짐!

// ✅ 좋은 예: 별도 Texture 사용
const bgTexture = new THREE.TextureLoader().load('bg.jpg');
const matTexture = new THREE.TextureLoader().load('mat.jpg');
scene.background = bgTexture;
material.map = matTexture;

WKit.clearSceneBackground(scene);  // bgTexture만 dispose
// material.map은 정상 작동
```
