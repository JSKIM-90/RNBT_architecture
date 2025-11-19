# WKit API 문서

브라우저 런타임에서 웹 페이지를 제작하는 애플리케이션의 **WKit 유틸리티 라이브러리** 전체 분석 문서입니다.

## 📚 문서 목록

### 핵심 기능
1. [bindEvents.md](./bindEvents.md) - 2D 이벤트 바인딩 (이벤트 위임)
2. [bind3DEvents.md](./bind3DEvents.md) - 3D 이벤트 바인딩
3. [initThreeRaycasting.md](./initThreeRaycasting.md) - Three.js Raycasting 초기화
4. ~~[pipeForDataMapping.md](./pipeForDataMapping.md)~~ - **제거됨 (v1.1)** - Primitive Building Blocks 원칙 적용

### 리소스 관리
5. [removeCustomEvents.md](./removeCustomEvents.md) - 2D 이벤트 리스너 제거
6. [dispose3DTree.md](./dispose3DTree.md) - 3D 리소스 정리
7. [clearSceneBackground.md](./clearSceneBackground.md) - Scene background 정리

### 헬퍼 함수
8. [makeIterator.md](./makeIterator.md) - 페이지 레이어 통합 Iterator
9. [helper_functions.md](./helper_functions.md) - getInstanceByName, getInstanceById, fetchData
10. [event_functions.md](./event_functions.md) - emitEvent, triggerEventToTargetInstance, onEventBusHandlers, offEventBusHandlers
11. [schema_functions.md](./schema_functions.md) - 스키마 예제 함수들

---

## 🔍 주요 발견 사항

### 심각한 버그
1. **delegate의 이벤트 매칭 문제** (`bindEvents.md`)
   - 자식 요소 클릭 시 이벤트 미감지
   - `closest` 사용 필요
   - 우선순위: **High**

### 메모리 누수 위험
3. **removeCustomEvents의 불완전한 정리** (`removeCustomEvents.md`)
   - userHandlerList에서 핸들러 참조 미제거
   - 우선순위: **High**

4. **dispose3DTree의 Texture 중복 dispose** (`dispose3DTree.md`)
   - 같은 texture를 여러 번 dispose 가능
   - 우선순위: **High**

### 설계 개선 필요
5. **fx.map 오용** (여러 파일)
   - 부수효과만 발생하는데 `fx.map` 사용
   - `fx.each` 사용 권장
   - 우선순위: **Medium**

---

## 📊 API 분류

### 데이터 관련
- `fetchData` - 데이터 fetch primitive ⭐⭐⭐⭐⭐
- ~~`pipeForDataMapping`~~ - **제거됨 (v1.1)** - primitive 조합으로 대체
- ~~`getDataMappingSchema`~~ - **제거됨 (v1.1)** - 불확실한 필요성
- `getGlobalMappingSchema` - 글로벌 매핑 스키마 예제 ⭐⭐⭐

### 2D 이벤트
- `bindEvents` - 이벤트 바인딩 ⭐⭐⭐⭐⭐
- `removeCustomEvents` - 이벤트 제거 ⭐⭐⭐⭐⭐
- `getCustomEventsSchema` - 이벤트 스키마 예제 ⭐⭐⭐

### 3D 관련
- `initThreeRaycasting` - Raycasting 초기화 ⭐⭐⭐⭐⭐
- `bind3DEvents` - 3D 이벤트 바인딩 ⭐⭐⭐⭐⭐
- `dispose3DTree` - 3D 리소스 정리 ⭐⭐⭐⭐⭐
- `clearSceneBackground` - Scene 배경 정리 ⭐⭐⭐⭐
- `getCustomEventsSchemaFor3D` - 3D 이벤트 스키마 예제 ⭐⭐⭐

### EventBus 통합
- `emitEvent` - 이벤트 발행 primitive ⭐⭐⭐⭐⭐
- ~~`triggerEventToTargetInstance`~~ - **제거됨 (v1.1)** - primitive 조합으로 대체
- `onEventBusHandlers` - 핸들러 일괄 등록 ⭐⭐⭐⭐⭐
- `offEventBusHandlers` - 핸들러 일괄 제거 ⭐⭐⭐⭐⭐

### 헬퍼
- `makeIterator` - 레이어 통합 Iterator ⭐⭐⭐⭐⭐
- `getInstanceByName` - 이름으로 인스턴스 찾기 ⭐⭐⭐⭐⭐
- `getInstanceById` - ID로 인스턴스 찾기 ⭐⭐⭐⭐
- `getSubscriptionSchema` - 구독 스키마 예제 ⭐⭐⭐

---

## 🎯 개선 우선순위 요약

### 🔴 High (즉시 수정 필요)
1. `delegate`에 `closest` 적용
2. `removeCustomEvents`에서 userHandlerList 정리
3. `dispose3DTree`에서 Texture 중복 dispose 방지
4. `initThreeRaycasting`에서 getBoundingClientRect 사용
5. `fetchData`에 page.dataService 존재 확인

### 🟡 Medium (개선 권장)
1. fx.map을 fx.each로 변경 (부수효과 명시)
2. 중복 이벤트 등록 방지
3. scene.environment 정리 추가
4. wemb 의존성 제거 (파라미터로 전달)

### 🟢 Low (선택적 개선)
1. 타입 검증 추가
2. 에러 처리 강화
3. JSDoc 추가
4. 디버깅 로그 개선
5. 대소문자 무시 옵션 (getInstanceByName)
6. 타임아웃 구현 (fetchData)

---

## 💡 설계 패턴

### 1. 함수형 프로그래밍
- `fx.go`, `fx.map`, `fx.each` 활용
- Lazy Evaluation (`fx.L.*`)
- 파이프라인 기반 데이터 처리

### 2. 이벤트 기반 아키텍처
- WEventBus를 통한 느슨한 결합
- Pub-Sub 패턴
- 커스텀 이벤트 발행/구독

### 3. 이벤트 위임
- 동적 DOM 요소 처리
- delegate 패턴
- Raycasting (3D)

### 4. 리소스 관리
- 명시적 dispose 호출
- 메모리 누수 방지
- 라이프사이클 관리

---

## 📈 코드 품질 평가

### 잘된 점 ✅
1. **함수형 스타일**: 일관된 함수형 프로그래밍 패턴
2. **모듈화**: 각 기능이 명확히 분리됨
3. **Optional chaining**: 안전한 속성 접근
4. **Generator 활용**: 메모리 효율적인 Iterator
5. **Promise 기반**: 비동기 처리 일관성

### 개선 필요 ⚠️
1. **파라미터 검증 부족**: null/undefined 체크 미흡
2. **에러 처리 부족**: try-catch 거의 없음
3. **타입 안전성 부족**: TypeScript 또는 JSDoc 없음
4. **문서화 부족**: 인라인 주석 거의 없음
5. **테스트 코드 없음**: 단위 테스트 필요

---

## 🚀 사용 가이드

### 일반적인 사용 흐름

#### Page 라이프사이클
```javascript
// before_load
this.globalDataMappings = getGlobalDataMappings();
fx.go(
  this.globalDataMappings,
  fx.each(GlobalDataPublisher.registerMapping),
  fx.each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// loaded
this.eventBusHandlers = getEventBusHandlers();
WKit.onEventBusHandlers(this.eventBusHandlers);
this.raycastingEventHandler = WKit.initThreeRaycasting(this.element, 'click', wemb.threeElements);

// before_unload
WKit.offEventBusHandlers(this.eventBusHandlers);
this.element.removeEventListener('click', this.raycastingEventHandler);
fx.go(
  WKit.makeIterator(this, 'threeLayer'),
  fx.map(({ appendElement }) => WKit.dispose3DTree(appendElement))
);
WKit.clearSceneBackground(scene);
```

#### 2D Component 라이프사이클
```javascript
// register
this.customEvents = getCustomEvents();
WKit.bindEvents(this, this.customEvents);

this.subscriptions = getSubscriptions();
fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, fnList]) =>
    fx.each(fn => GlobalDataPublisher.subscribe(topic, this, this[fn]), fnList)
  )
);

// destroy
WKit.removeCustomEvents(this, this.customEvents);
fx.go(
  Object.entries(this.subscriptions),
  fx.each(([topic, _]) => GlobalDataPublisher.unsubscribe(topic, this))
);
```

#### 3D Component 라이프사이클
```javascript
// register
this.customEvents = getCustomEvents();
WKit.bind3DEvents(this, this.customEvents);

// destroy는 dispose3DTree에서 자동 처리
```

---

## 🔗 관련 파일
- `fx.js` - 함수형 프로그래밍 라이브러리
- `WEventBus.js` - 이벤트 버스
- `GlobalDataPublisher.js` - 글로벌 데이터 발행 시스템
- `WKit.js` - 통합 유틸리티 킷

---

## 📝 변경 이력

### v1.1.0 (2025-11-19)
- Primitive Building Blocks 원칙 적용
- 제거된 API: `pipeForDataMapping`, `triggerEventToTargetInstance`, `getDataMappingSchema`
- 제거된 Internal: `resolveMappingInfo`, `getDataFromMapping`
- 프레임워크는 primitive만 제공, 조합은 사용자가 직접

### v1.0.0 (2025-11-16)
- 초기 분석 완료
- 모든 Public API 문서화
- 11개 주요 버그 및 개선사항 발견

---

## 🤝 기여 가이드

### 버그 수정 순서
1. High 우선순위 버그부터 수정
2. 기존 동작 변경 시 하위 호환성 유지
3. 테스트 코드 작성 (권장)
4. 문서 업데이트

### 새 기능 추가 시
1. 기존 패턴 유지 (함수형 프로그래밍)
2. 파라미터 검증 추가
3. 에러 처리 추가
4. JSDoc 작성
5. 문서 업데이트

---

## 📞 문의

WKit 관련 질문이나 버그 리포트는 프로젝트 관리자에게 문의하세요.

**작성일**: 2025-11-16
**최종 업데이트**: 2025-11-19
**작성자**: Claude Code Analysis
**버전**: 1.1.0
