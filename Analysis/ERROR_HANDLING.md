# 에러 핸들링 가이드

## 1. fetchAndPublish 에러 핸들링

### 계약
- `GlobalDataPublisher.fetchAndPublish(topic, page, params?)`는 실패 시 Promise를 reject한다.
- `async` 함수 내부에서 `throw`된 에러는 자동으로 Promise rejection이 되므로, 호출자가 `await/try-catch`나 `.catch()`로 잡을 수 있다.
- 호출자는 반드시 `await/try-catch` 또는 `.catch()`로 처리한다.

### 기본 패턴
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

### interval/이벤트 핸들러
```js
const run = () => GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {})
  .catch(err => {
    console.error(`[fetchAndPublish:${topic}]`, err);
    // 필요 시 사용자 알림/백오프/재시도
  });

this.refreshIntervals[topic] = setInterval(run, refreshMs);
run(); // 초기 호출도 안전하게
```

---

## 2. fx.go 에러 처리 메커니즘

### 설계 의도

fx.go는 내부적으로 두 가지 에러를 구분한다:

| 유형 | Symbol | 처리 | 순회 |
|------|--------|------|------|
| 데이터 없음 | `nop` | `acc` 반환 | **계속** |
| 진짜 에러 | - | `Promise.reject(e)` | **중단** |

### 코드 분석

```javascript
// fx.js - reduceF
const reduceF = (acc, a, f) =>
  a instanceof Promise
    ? a.then(
        (a) => f(acc, a),
        (e) => (e == nop ? acc : Promise.reject(e))  // ← 핵심
      )
    : f(acc, a);

// fx.js - reduce
const reduce = curry((f, acc, iter) => {
  iter = iter[Symbol.iterator]();
  return go1(acc, function recur(acc) {
    let cur;
    while (!(cur = iter.next()).done) {
      acc = reduceF(acc, cur.value, f);
      if (acc instanceof Promise) return acc.then(recur);  // ← recur 호출
    }
    return acc;
  });
});
```

**동작 원리:**
- `nop` 에러: `acc` 반환 → `.then(recur)` 호출 → 순회 계속
- **진짜 에러**: `Promise.reject(e)` 반환 → `.then(recur)` 호출 안 됨 → 순회 중단

### 왜 이렇게 설계했는가?

진짜 에러(네트워크 에러, 서버 에러 등)가 발생하면 **정상 동작을 시키면 안 된다**.
개별 catch로 에러를 삼키면 문제가 있는데도 마치 정상인 것처럼 계속 진행되는 위험이 있다.

---

## 3. fx.go에서 catch 위치

### ❌ 잘못된 패턴: 개별 catch

```javascript
fx.go(
  this.datasetInfo,
  fx.each(({ datasetName, param, render }) =>
    fx.go(
      fetchData(this.page, datasetName, param),
      result => result?.response?.data,
      data => data && render.forEach(fn => this[fn](data))
    ).catch(err => console.error(err))  // ← 개별 catch (❌)
  )
);
```

**문제점:**
- 에러를 삼켜서 순회 계속됨
- fx.go의 "진짜 에러 시 순회 중단" 설계 의도 무시
- 하나가 실패해도 정상처럼 보임

### ✅ 올바른 패턴: 전체 catch

```javascript
fx.go(
  this.datasetInfo,
  fx.each(({ datasetName, param, render }) =>
    fx.go(
      fetchData(this.page, datasetName, param),
      result => result?.response?.data,
      data => data && render.forEach(fn => this[fn](data))
    )
  )
).catch(e => {
  console.error('[ComponentName]', e);
  // 에러 상태 처리 (예: 팝업 닫기, 에러 UI 표시)
});
```

**장점:**
- 진짜 에러 발생 시 순회 즉시 중단
- fx.go 설계 의도 준수
- 에러 발생 시 적절한 상태 처리 가능

---

## 4. 컴포넌트에서의 에러 처리 예시

### showDetail 패턴

```javascript
function showDetail() {
    this.showPopup();
    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, param, render }) =>
            fx.go(
                fetchData(this.page, datasetName, param),
                result => result?.response?.data,
                data => data && render.forEach(fn => this[fn](data))
            )
        )
    ).catch(e => {
        console.error('[TemperatureSensor]', e);
        this.hidePopup();  // 에러 시 팝업 닫기
    });
}
```

---

## 5. 유틸에서 삼키지 않는 이유

- 도메인마다 실패 대응(재시도, fallback, 사용자 알림, 로그 레벨)이 다르다.
- 유틸은 reject만 하고, 호출자가 컨텍스트에 맞게 처리하는 것이 확장성과 가시성 측면에서 안전하다.

---

## 6. 체크리스트

- [ ] 모든 호출부가 `await/try-catch` 또는 `.catch()`를 붙였는가?
- [ ] interval/이벤트 핸들러 호출에 `.catch()`가 있는가?
- [ ] fx.go 사용 시 **전체 catch**를 사용했는가? (개별 catch ❌)
- [ ] 에러 발생 시 적절한 상태 처리(팝업 닫기, 에러 UI 등)를 했는가?
- [ ] 필요한 곳에 사용자 알림/재시도 정책을 넣었는가?
- [ ] 로깅 레벨과 메시지가 운영 모니터링에 적합한가?

---

**버전**: 1.1.0
**작성일**: 2025-12-16

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.1.0 | 2025-12-16 | fx.go 에러 처리 메커니즘 추가, 개별/전체 catch 설명 |
| 1.0.0 | - | 초기 작성 (fetchAndPublish 에러 핸들링) |
