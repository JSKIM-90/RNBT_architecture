# fx.go 기반 에러 핸들링 가이드

## 목적

이 문서는 `fx.go` / `reduce` 기반 파이프라인에서 **에러가 어떻게 전파되고, 어디에서 처리해야 하는지**를 명확히 정의한다.

---

## 1. 기본 원칙

### 1.1 유틸은 에러를 처리하지 않는다

* `fx.go`, `reduce`, `reduceF` 등 유틸 레벨에서는 에러를 **복구하지 않는다**.
* 에러를 **삼키지 않고 그대로 전파**한다.
* 유틸의 책임은 다음 두 가지뿐이다.

  * 정상 값은 다음 단계로 전달
  * 에러는 호출자에게 전파

> 재시도, fallback, 사용자 알림, 로그 레벨 등은 도메인 컨텍스트를 아는 **호출자의 책임**이다.

---

### 1.2 호출자는 반드시 에러를 처리한다

* `fx.go(...)`는 실패 시 **rejected Promise를 반환**할 수 있다.
* 모든 호출부는 반드시 다음 중 하나로 에러를 처리해야 한다.

  * `async / await + try-catch`
  * `.catch(...)`

```js
// async / await
try {
  await fx.go(...);
} catch (e) {
  // 도메인별 처리
}
```

```js
// Promise 체인
fx.go(...)
  .catch(e => {
    // 도메인별 처리
  });
```

---

## 2. fx.go 파이프라인의 내부 동작 (이해를 위한 설명)

### 2.1 fx.go는 reduce 기반 파이프라인

```js
const go = (...args) => reduce((a, f) => f(a), args);
```

* 각 함수의 반환값이 다음 함수의 입력이 된다.
* Promise가 반환되면 비동기 파이프라인으로 연결된다.

---

### 2.2 비동기 처리의 핵심: reduceF

```js
const reduceF = (acc, a, f) =>
  a instanceof Promise
    ? a.then(
        a => f(acc, a),
        e => e == nop ? acc : Promise.reject(e)
      )
    : f(acc, a);
```

#### 의미 정리

* **nop**

  * 필터(`L.filter`) 전용 내부 시그널
  * “조건 불충족 → 스킵”을 표현
  * 에러가 아님
  * 순회를 계속하기 위해 `acc`를 그대로 반환
* **진짜 에러**

  * `Promise.reject(e)`로 그대로 전파
  * 복구하지 않음

> `reduceF`는 에러를 처리하지 않는다. `nop`만 예외적으로 스킵을 위해 복구한다.

---

### 2.3 순회가 중단되는 이유 (fail-fast 동작)

* `reduce`는 `acc`가 Promise일 경우 다음과 같이 동작한다.

  ```js
  return acc.then(recur);
  ```
* 그러나 `acc`가 **rejected Promise**이면

  * `then(recur)`의 `recur`는 실행되지 않는다.
  * rejected 상태가 그대로 반환된다.
* 결과적으로

  * 다음 함수 적용 ❌
  * 순회 중단
  * 최종적으로 `fx.go`는 rejected Promise를 반환

> `reduce`는 내부에서 catch를 하지 않기 때문에 기본 동작은 **fail-fast**이다.

---

## 3. nop의 정확한 역할

* `nop`은 **오직 필터를 구현하기 위한 내부 메커니즘**이다.
* 목적은 비동기 조건식에서 “false → 스킵”을 표현하는 것이다.
* 특징

  * 진짜 에러 ❌
  * 외부에서 처리 대상 ❌
  * `reduceF`에서만 특별 취급

```js
e => e == nop ? acc : Promise.reject(e)
```

---

## 4. catch 위치와 파이프라인 의미

### 4.1 중요한 구분

* 파이프라인의 **정상 흐름의 의미**는 함수 구성으로 결정된다.
* `catch`의 위치는 **에러 발생 시의 동작 방식**을 결정한다.

> 파이프라인의 정상 흐름은 함수 구성으로,
> **파이프라인의 에러 처리 전략은 `catch`를 어디에 두느냐로 결정된다.**

---

### 4.2 파이프라인 중간 catch (주의)

```js
fx.go(
  items,
  fx.each(item =>
    fx.go(fetchData(item), process)
      .catch(err => {
        console.error(err);
        // 반환값 없음 → resolved(undefined)
      })
  )
);
```

* 진짜 에러가 **fulfilled 값으로 변환됨**
* 파이프라인은 “성공”으로 인식하고 계속 진행
* 의도하지 않으면 버그의 원인이 됨

---

### 4.3 기본 패턴: 파이프라인 끝에서 catch

```js
fx.go(
  items,
  fx.each(item =>
    fx.go(fetchData(item), process)
  )
).catch(e => {
  console.error('[Component]', e);
  // 상태 복구 / 에러 UI / 중단 처리
});
```

* 에러는 끝까지 전파된다.
* 한 지점에서 일관되게 처리한다.
* 기본값으로 권장되는 패턴이다.

---

### 4.4 예외: 부분 실패를 허용하는 경우

* 일부 실패를 허용해야 하는 도메인에서는 **의도적으로** 중간 catch를 사용할 수 있다.
* 단, 반드시 **명시적인 대체값**을 반환해야 한다.

```js
.catch(e => ({
  ok: false,
  error: e
}));
```

> 에러를 삼키는 것이 아니라 **의미 있는 값으로 변환**하는 것이다.

---

## 5. interval / 이벤트 핸들러

* 이 컨텍스트에서는 **최상단 catch가 필수**다.
* 목적은 unhandled rejection 방지다.

```js
const run = () =>
  GlobalDataPublisher.fetchAndPublish(topic, page, params)
    .catch(e => {
      console.error(`[fetchAndPublish:${topic}]`, e);
      // 재시도 / 백오프 / 사용자 알림 등
    });

setInterval(run, refreshMs);
run();
```

---

## 6. 체크리스트

* [ ] 모든 `fx.go` 호출부에 `try-catch` 또는 `.catch()`가 있는가?
* [ ] 파이프라인 중간 `catch`가 의도적인 복구인가?
* [ ] `catch`에서 반환값이 명확한가?
* [ ] `nop`을 진짜 에러 처리와 혼동하지 않았는가?
* [ ] interval / 이벤트 핸들러에 catch가 있는가?

---

## 핵심 요약

* `fx.go`는 에러를 처리하지 않고 전파한다.
* `reduceF`는 `nop`만 복구하고 진짜 에러는 fail-fast로 중단시킨다.
* 파이프라인의 정상 흐름은 함수 구성으로 결정된다.
* **에러 처리 전략은 `catch` 위치로 결정된다.**
