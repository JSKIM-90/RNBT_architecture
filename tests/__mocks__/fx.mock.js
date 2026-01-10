/**
 * fx.js Mock
 *
 * 실제 fx.js (함수형 유틸리티)를 테스트용으로 Mock합니다.
 * 주요 함수: go, each, map, filter, find, L (lazy)
 */

const fx = {
  /**
   * 파이프라인 실행
   * @param {*} initial - 초기값
   * @param  {...Function} fns - 실행할 함수들
   */
  go(initial, ...fns) {
    return fns.reduce((acc, fn) => {
      if (fn && typeof fn === 'function') {
        return fn(acc);
      }
      return acc;
    }, initial);
  },

  /**
   * 각 요소에 함수 적용 (side effect)
   */
  each(fn, iter) {
    if (iter === undefined) {
      return (iter) => fx.each(fn, iter);
    }
    for (const item of iter) {
      fn(item);
    }
    return iter;
  },

  /**
   * 각 요소를 변환
   */
  map(fn, iter) {
    if (iter === undefined) {
      return (iter) => fx.map(fn, iter);
    }
    const result = [];
    for (const item of iter) {
      result.push(fn(item));
    }
    return result;
  },

  /**
   * 조건에 맞는 요소만 필터링
   */
  filter(fn, iter) {
    if (iter === undefined) {
      return (iter) => fx.filter(fn, iter);
    }
    const result = [];
    for (const item of iter) {
      if (fn(item)) {
        result.push(item);
      }
    }
    return result;
  },

  /**
   * 조건에 맞는 첫 요소 반환
   */
  find(fn, iter) {
    if (iter === undefined) {
      return (iter) => fx.find(fn, iter);
    }
    for (const item of iter) {
      if (fn(item)) {
        return item;
      }
    }
    return undefined;
  },

  /**
   * 첫 n개 요소만 취함
   */
  take(n, iter) {
    if (iter === undefined) {
      return (iter) => fx.take(n, iter);
    }
    const result = [];
    for (const item of iter) {
      result.push(item);
      if (result.length >= n) break;
    }
    return result;
  },

  /**
   * reduce
   */
  reduce(fn, acc, iter) {
    if (iter === undefined) {
      return (iter) => fx.reduce(fn, acc, iter);
    }
    for (const item of iter) {
      acc = fn(acc, item);
    }
    return acc;
  },

  /**
   * Lazy 함수들 (제너레이터 기반)
   */
  L: {
    map: function* (fn, iter) {
      if (iter === undefined) {
        return (iter) => fx.L.map(fn, iter);
      }
      for (const item of iter) {
        yield fn(item);
      }
    },

    filter: function* (fn, iter) {
      if (iter === undefined) {
        return (iter) => fx.L.filter(fn, iter);
      }
      for (const item of iter) {
        if (fn(item)) {
          yield item;
        }
      }
    },
  },
};

module.exports = { fx };
