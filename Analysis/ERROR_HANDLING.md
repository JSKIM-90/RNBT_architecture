# fetchAndPublish 에러 핸들링 가이드

## 계약
- `GlobalDataPublisher.fetchAndPublish(topic, page, params?)`는 실패 시 Promise를 reject한다.
- `async` 함수 내부에서 `throw`된 에러는 자동으로 Promise rejection이 되므로, 호출자가 `await/try-catch`나 `.catch()`로 잡을 수 있다.
- 호출자는 반드시 `await/try-catch` 또는 `.catch()`로 처리한다.

## 기본 패턴
```js
// async 함수 내부
try {
  await GlobalDataPublisher.fetchAndPublish(topic, page, params);
} catch (err) {
  // 도메인별 처리 (알림/재시도/무시/로깅)
}

// Promise 체인
GlobalDataPublisher.fetchAndPublish(topic, page, params)
  .catch(err => {
    // 도메인별 처리
  });
```

## interval/이벤트 핸들러
```js
const run = () => GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {})
  .catch(err => {
    console.error(`[fetchAndPublish:${topic}]`, err);
    // 필요 시 사용자 알림/백오프/재시도
  });

this.refreshIntervals[topic] = setInterval(run, refreshMs);
run(); // 초기 호출도 안전하게
```

## 초기 fetch (fx.go 등)
```js
fx.go(
  mappings,
  each(({ topic }) =>
    GlobalDataPublisher.fetchAndPublish(topic, this)
      .catch(err => console.error(`[init ${topic}]`, err))
  )
);
```

## 헬퍼로 통일 (선택)
```js
const safeFetchAndPublish = (topic, page, params, onError = console.error) =>
  GlobalDataPublisher.fetchAndPublish(topic, page, params)
    .catch(err => onError(err, { topic, params }));
```

## 유틸에서 삼키지 않는 이유
- 도메인마다 실패 대응(재시도, fallback, 사용자 알림, 로그 레벨)이 다르다.
- 유틸은 reject만 하고, 호출자가 컨텍스트에 맞게 처리하는 것이 확장성과 가시성 측면에서 안전하다.

## 체크리스트
- [ ] 모든 호출부가 `await/try-catch` 또는 `.catch()`를 붙였는가?
- [ ] interval/이벤트 핸들러 호출에 `.catch()`가 있는가?
- [ ] 초기 로딩(fx.go 등)에서도 unhandled rejection이 없도록 처리했는가?
- [ ] 필요한 곳에 사용자 알림/재시도 정책을 넣었는가?
- [ ] 로깅 레벨과 메시지가 운영 모니터링에 적합한가?