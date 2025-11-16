# WKit.dispose3DTree

## 위치
`WKit.js:60-98`

## 시그니처
```javascript
WKit.dispose3DTree(rootContainer: THREE.Object3D): void
```

## 역할
Three.js 객체 트리의 모든 리소스(Geometry, Material, Texture, EventListener 등)를 완전히 해제하여 메모리 누수를 방지합니다.

**주요 기능**:
1. 객체 트리 전체를 traverse하며 각 객체 처리
2. Geometry dispose
3. Material과 그 안의 Texture dispose
4. 커스텀 eventListener 제거
5. userData 정리
6. 부모 Scene에서 제거

이 API는 **3D 컴포넌트 destroy 시 필수적인 메모리 정리** 역할을 합니다.

## 현재 설계에서의 필요성
**매우 필요함** ⭐⭐⭐⭐⭐

**이유**:
- Three.js 객체는 JavaScript GC만으로 메모리 해제 안 됨 (WebGL 리소스)
- Geometry, Material, Texture는 GPU 메모리 사용
- 명시적으로 dispose() 호출 필수
- SPA 환경에서 페이지 전환 시 메모리 누수 방지

## 사용 예시
```javascript
// Page - before_unload
const { makeIterator, dispose3DTree } = WKit;

function clearThreeInstances() {
  fx.go(
    makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => dispose3DTree(appendElement))
  );
}

onPageUnLoad.call(this);

function onPageUnLoad() {
  clearThreeInstances.call(this);
}
```

## 데이터 흐름
```
rootContainer (THREE.Group, THREE.Mesh 등)
  ↓
traverse((obj) => {...}) - 모든 자식 객체 순회
  ↓
각 객체에 대해:
  ├─ 1. obj.geometry?.dispose()
  ├─ 2. obj.material 처리
  │    ├─ Array이면 각각 disposeMaterial()
  │    └─ 단일이면 disposeMaterial()
  │         ├─ material.map?.dispose()
  │         ├─ material.normalMap?.dispose()
  │         ├─ ... (13개 texture 슬롯)
  │         └─ material.dispose()
  ├─ 3. obj.eventListener 제거
  └─ 4. obj.userData = {}
  ↓
rootContainer.parent.remove(rootContainer) - Scene에서 제거
```

## 구현 분석

### 현재 코드
```javascript
// WKit.js:60-98
WKit.dispose3DTree = function (rootContainer) {
  rootContainer.traverse((obj) => {
    // 1. geometry
    if (obj.geometry) {
      obj.geometry.dispose?.();
    }

    // 2. material(s)
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => {
          disposeMaterial(mat);
        });
      } else {
        disposeMaterial(obj.material);
      }
    }

    // 3. textures (in material, handled inside disposeMaterial)

    // 4. eventListener (custom-defined on your side)
    if (obj.eventListener) {
      Object.keys(obj.eventListener).forEach((eventType) => {
        obj.eventListener[eventType] = undefined;
      });
      obj.eventListener = undefined;
    }

    // 5. 기타 사용자 정의 데이터
    if (obj.userData) {
      obj.userData = {};
    }
  });

  // 부모로부터 detach
  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};

// WKit.js:323-350
function disposeMaterial(material) {
  // dispose texture in known slots
  const slots = [
    'map',
    'lightMap',
    'aoMap',
    'emissiveMap',
    'bumpMap',
    'normalMap',
    'displacementMap',
    'roughnessMap',
    'metalnessMap',
    'alphaMap',
    'envMap',
    'specularMap',
    'gradientMap',
  ];

  slots.forEach((key) => {
    const tex = material[key];
    if (tex && tex.dispose) {
      tex.dispose();
      material[key] = null;
    }
  });

  material.dispose?.();
}
```

### 잘된 점 ✅
1. **완전한 정리**: Geometry, Material, Texture, EventListener 모두 처리
2. **트리 순회**: traverse()로 모든 자식 객체까지 처리
3. **배열 Material 처리**: Multi-material 객체 지원
4. **Optional chaining**: dispose?.()로 안전한 호출
5. **13개 Texture 슬롯**: Three.js의 주요 texture 타입 모두 커버
6. **부모에서 제거**: Scene에서도 제거하여 완전한 분리

### 개선점 ⚠️

#### 1. rootContainer null 체크 없음
**현재 코드**:
```javascript
WKit.dispose3DTree = function (rootContainer) {
  rootContainer.traverse((obj) => {  // rootContainer가 null이면 에러
    // ...
  });
}
```

**문제점**:
- `rootContainer`가 null/undefined면 즉시 에러
- 방어적 코딩 부족

**개선안**:
```javascript
WKit.dispose3DTree = function (rootContainer) {
  if (!rootContainer) {
    console.warn('[WKit.dispose3DTree] rootContainer is null or undefined');
    return;
  }

  if (!rootContainer.traverse || typeof rootContainer.traverse !== 'function') {
    console.warn('[WKit.dispose3DTree] rootContainer is not a THREE.Object3D');
    return;
  }

  // 기존 로직
  rootContainer.traverse((obj) => {
    // ...
  });

  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};
```

#### 2. Texture 중복 dispose 가능성
**현재 코드**:
```javascript
slots.forEach((key) => {
  const tex = material[key];
  if (tex && tex.dispose) {
    tex.dispose();
    material[key] = null;
  }
});
```

**문제점**:
- 여러 슬롯이 같은 texture를 공유할 수 있음
- 예: `map`과 `emissiveMap`이 같은 texture
- 이미 dispose된 texture를 다시 dispose 시도 가능

**개선안**:
```javascript
function disposeMaterial(material) {
  const slots = [
    'map', 'lightMap', 'aoMap', 'emissiveMap', 'bumpMap',
    'normalMap', 'displacementMap', 'roughnessMap', 'metalnessMap',
    'alphaMap', 'envMap', 'specularMap', 'gradientMap',
  ];

  const disposedTextures = new Set();

  slots.forEach((key) => {
    const tex = material[key];
    if (tex && tex.dispose) {
      // 이미 dispose한 texture는 스킵
      if (!disposedTextures.has(tex)) {
        tex.dispose();
        disposedTextures.add(tex);
      }
      material[key] = null;
    }
  });

  material.dispose?.();
}
```

#### 3. Animation 관련 정리 누락
**문제점**:
- Three.js AnimationClip, AnimationMixer 등은 dispose 안 함
- 애니메이션이 있는 모델은 추가 정리 필요

**개선안**:
```javascript
WKit.dispose3DTree = function (rootContainer) {
  if (!rootContainer) return;

  rootContainer.traverse((obj) => {
    // 1. geometry
    if (obj.geometry) {
      obj.geometry.dispose?.();
    }

    // 2. material(s)
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((mat) => disposeMaterial(mat));
      } else {
        disposeMaterial(obj.material);
      }
    }

    // 3. animations
    if (obj.animations && obj.animations.length > 0) {
      obj.animations = [];
    }

    // 4. eventListener
    if (obj.eventListener) {
      Object.keys(obj.eventListener).forEach((eventType) => {
        obj.eventListener[eventType] = undefined;
      });
      obj.eventListener = undefined;
    }

    // 5. userData
    if (obj.userData) {
      obj.userData = {};
    }

    // 6. skeleton (SkinnedMesh)
    if (obj.skeleton) {
      obj.skeleton.dispose?.();
    }
  });

  // 부모로부터 detach
  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};
```

#### 4. 순환 참조 처리 누락
**문제점**:
- `obj.userData`에 다른 객체에 대한 참조가 있을 수 있음
- 빈 객체로만 설정하면 GC가 수거 못할 수도

**개선안**:
```javascript
// userData 깊은 정리
if (obj.userData) {
  // 순환 참조 방지를 위해 null로 설정
  for (const key in obj.userData) {
    obj.userData[key] = null;
  }
  obj.userData = null;  // {} 대신 null
}
```

#### 5. disposeMaterial의 texture 슬롯 불완전
**문제점**:
- Three.js r140+ 에서는 더 많은 texture 슬롯 존재 가능
- `transmission`, `thickness`, `sheen`, `iridescence` 등 PBR 관련

**개선안**:
```javascript
function disposeMaterial(material) {
  const slots = [
    // 기본
    'map', 'lightMap', 'aoMap', 'emissiveMap', 'bumpMap',
    'normalMap', 'displacementMap', 'roughnessMap', 'metalnessMap',
    'alphaMap', 'envMap', 'specularMap', 'gradientMap',
    // PBR 추가 (Three.js r140+)
    'transmissionMap', 'thicknessMap', 'sheenColorMap', 'sheenRoughnessMap',
    'clearcoatMap', 'clearcoatNormalMap', 'clearcoatRoughnessMap',
    'iridescenceMap', 'iridescenceThicknessMap',
  ];

  const disposedTextures = new Set();

  slots.forEach((key) => {
    const tex = material[key];
    if (tex && tex.dispose) {
      if (!disposedTextures.has(tex)) {
        tex.dispose();
        disposedTextures.add(tex);
      }
      material[key] = null;
    }
  });

  material.dispose?.();
}
```

#### 6. 성능 - traverse 대신 children 직접 순회
**현재 코드**:
```javascript
rootContainer.traverse((obj) => {
  // 매 객체마다 함수 호출
});
```

**문제점**:
- `traverse`는 재귀 함수 호출
- 객체가 많으면 콜스택 부담

**개선안** (성능이 중요한 경우):
```javascript
WKit.dispose3DTree = function (rootContainer) {
  if (!rootContainer) return;

  const stack = [rootContainer];

  while (stack.length > 0) {
    const obj = stack.pop();

    // dispose 로직
    if (obj.geometry) obj.geometry.dispose?.();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(disposeMaterial);
      } else {
        disposeMaterial(obj.material);
      }
    }
    if (obj.eventListener) {
      Object.keys(obj.eventListener).forEach((type) => {
        obj.eventListener[type] = undefined;
      });
      obj.eventListener = undefined;
    }
    if (obj.userData) {
      obj.userData = null;
    }

    // 자식들을 스택에 추가
    if (obj.children) {
      stack.push(...obj.children);
    }
  }

  if (rootContainer.parent) {
    rootContainer.parent.remove(rootContainer);
  }
};
```

#### 7. dispose 실패 시 에러 처리 없음
**문제점**:
- dispose() 중 에러 발생 시 나머지 리소스가 정리 안 됨
- 일부 리소스만 해제되어 불완전한 상태

**개선안**:
```javascript
WKit.dispose3DTree = function (rootContainer) {
  if (!rootContainer) return;

  try {
    rootContainer.traverse((obj) => {
      try {
        // 1. geometry
        if (obj.geometry) {
          obj.geometry.dispose?.();
        }
      } catch (err) {
        console.error('[dispose3DTree] geometry dispose failed:', err);
      }

      try {
        // 2. material(s)
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => {
              try {
                disposeMaterial(mat);
              } catch (e) {
                console.error('[dispose3DTree] material dispose failed:', e);
              }
            });
          } else {
            disposeMaterial(obj.material);
          }
        }
      } catch (err) {
        console.error('[dispose3DTree] material dispose failed:', err);
      }

      // 나머지도 try-catch로 감싸기
      // ...
    });
  } catch (err) {
    console.error('[dispose3DTree] traverse failed:', err);
  }

  try {
    if (rootContainer.parent) {
      rootContainer.parent.remove(rootContainer);
    }
  } catch (err) {
    console.error('[dispose3DTree] parent.remove failed:', err);
  }
};
```

## 개선 우선순위
1. **High**: rootContainer null 체크
2. **High**: Texture 중복 dispose 방지
3. **Medium**: Animation 관련 정리 추가
4. **Low**: PBR texture 슬롯 추가
5. **Low**: 에러 처리 강화

## 관련 함수
- `disposeMaterial()` - Internal (`WKit.js:323-350`)
- `WKit.clearSceneBackground()` - Public API (`WKit.js:100-108`)
- `WKit.bind3DEvents()` - Public API (`WKit.js:51-57`)

## 테스트 시나리오
```javascript
// 1. 정상 케이스 - 단순 Mesh
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

WKit.dispose3DTree(mesh);
// geometry.dispose() 호출됨
// material.dispose() 호출됨
// scene에서 제거됨

// 2. 복잡한 트리
const group = new THREE.Group();
for (let i = 0; i < 100; i++) {
  const childMesh = new THREE.Mesh(geometry, material);
  group.add(childMesh);
}
scene.add(group);

WKit.dispose3DTree(group);
// 100개 mesh 모두 dispose
// group도 scene에서 제거

// 3. Texture 있는 Material
const texture = new THREE.TextureLoader().load('texture.jpg');
const matWithTex = new THREE.MeshStandardMaterial({
  map: texture,
  normalMap: texture,  // 같은 texture 공유
  roughnessMap: texture
});
const meshWithTex = new THREE.Mesh(geometry, matWithTex);

WKit.dispose3DTree(meshWithTex);
// 현재: texture.dispose() 3번 호출 (중복)
// 개선 후: texture.dispose() 1번만 호출

// 4. Multi-Material
const materials = [
  new THREE.MeshBasicMaterial({ color: 0xff0000 }),
  new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
  new THREE.MeshBasicMaterial({ color: 0x0000ff })
];
const multiMesh = new THREE.Mesh(geometry, materials);

WKit.dispose3DTree(multiMesh);
// 3개 material 모두 dispose

// 5. eventListener 있는 객체
const clickableMesh = new THREE.Mesh(geometry, material);
clickableMesh.eventListener = {
  click: function() { console.log('clicked'); }
};

WKit.dispose3DTree(clickableMesh);
// eventListener 제거됨

// 6. null 전달
WKit.dispose3DTree(null);
// 현재: 에러 발생
// 개선 후: 경고 로그 후 안전하게 종료
```

## 실제 사용 흐름
```javascript
// Page - before_unload
function clearThreeInstances() {
  const { scene } = wemb.threeElements;

  // 모든 3D 컴포넌트 정리
  fx.go(
    WKit.makeIterator(this, 'threeLayer'),
    fx.map(({ appendElement }) => {
      console.log('Disposing:', appendElement.name);
      WKit.dispose3DTree(appendElement);
    })
  );

  // Scene background 정리
  WKit.clearSceneBackground(scene);
}

function onPageUnLoad() {
  clearEventBus.call(this);
  clearDataPublisher.call(this);
  clearThreeInstances.call(this);

  // Raycasting 핸들러 제거
  this.element.removeEventListener(
    this.raycastingEventType,
    this.raycastingEventHandler
  );
  this.raycastingEventHandler = null;
}
```

## Three.js 리소스 정리 개념
```
Three.js에서 메모리 누수가 발생하는 이유:

1. WebGL 리소스는 GPU 메모리에 저장
   - Geometry: Vertex buffer, Index buffer
   - Texture: Image data
   - Material: Shader program

2. JavaScript GC는 GPU 메모리를 모름
   - Three.js 객체가 GC되어도 GPU 리소스는 남음
   - 명시적으로 dispose() 호출 필수

3. dispose() 호출 시 내부 동작:
   - geometry.dispose()
     → gl.deleteBuffer() 호출
     → GPU vertex/index buffer 해제

   - texture.dispose()
     → gl.deleteTexture() 호출
     → GPU texture 메모리 해제

   - material.dispose()
     → gl.deleteProgram() 호출
     → GPU shader program 해제

4. 정리하지 않으면:
   - 페이지 전환할 때마다 메모리 증가
   - 결국 브라우저 크래시 또는 성능 저하
```

## 메모리 누수 디버깅
```javascript
// Three.js 메모리 사용량 확인
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
console.log('Programs:', renderer.info.programs.length);

// 정리 전
WKit.dispose3DTree(appendElement);

// 정리 후 확인
console.log('After dispose:');
console.log('Geometries:', renderer.info.memory.geometries);  // 감소해야 함
console.log('Textures:', renderer.info.memory.textures);      // 감소해야 함
console.log('Programs:', renderer.info.programs.length);      // 감소해야 함

// 브라우저 메모리 확인
// DevTools → Performance → Memory → Take snapshot
// 페이지 전환 반복 후 메모리 증가 확인
```

## 권장사항
1. **항상 dispose**: 3D 컴포넌트 destroy 시 필수 호출
2. **순서 지키기**: Texture → Material → Geometry 순으로 dispose
3. **Scene에서 제거**: dispose 후 반드시 scene.remove()
4. **공유 리소스 주의**: 여러 객체가 공유하는 리소스는 참조 카운팅 고려
5. **정기적 확인**: renderer.info로 메모리 누수 모니터링
