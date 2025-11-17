const fx = {};

const curry =
  (f) =>
  (a, ..._) =>
    _.length ? f(a, ..._) : (..._) => f(a, ..._);

fx.curry = curry;

const isIterable = (a) => a && a[Symbol.iterator];

fx.isIterable = isIterable;

const go1 = (a, f) => (a instanceof Promise ? a.then(f) : f(a));

fx.go1 = go1;

const reduceF = (acc, a, f) =>
  a instanceof Promise
    ? a.then(
        (a) => f(acc, a),
        (e) => (e == nop ? acc : Promise.reject(e))
      )
    : f(acc, a);

fx.reduceF = reduceF;

const head = (iter) => go1(take(1, iter), ([h]) => h);

fx.head = head;

const reduce = curry((f, acc, iter) => {
  if (!iter) return reduce(f, head((iter = acc[Symbol.iterator]())), iter);

  iter = iter[Symbol.iterator]();
  return go1(acc, function recur(acc) {
    let cur;
    while (!(cur = iter.next()).done) {
      acc = reduceF(acc, cur.value, f);
      if (acc instanceof Promise) return acc.then(recur);
    }
    return acc;
  });
});

fx.reduce = reduce;

const go = (...args) => reduce((a, f) => f(a), args);

fx.go = go;

const pipe =
  (f, ...fs) =>
  (...as) =>
    go(f(...as), ...fs);

fx.pipe = pipe;

const take = curry((l, iter) => {
  let res = [];
  iter = iter[Symbol.iterator]();
  return (function recur() {
    let cur;
    while (!(cur = iter.next()).done) {
      const a = cur.value;
      if (a instanceof Promise) {
        return a
          .then((a) => ((res.push(a), res).length == l ? res : recur()))
          .catch((e) => (e == nop ? recur() : Promise.reject(e)));
      }
      res.push(a);
      if (res.length == l) return res;
    }
    return res;
  })();
});

fx.take = take;

const each = curry((f, iter) =>
  go1(
    reduce((_, a) => f(a), null, iter),
    (_) => iter
  )
);

fx.each = each;

const takeAll = take(Infinity);

fx.takeAll = takeAll;

const L = {};

fx.L = L;

L.range = function* (l) {
  let i = -1;
  while (++i < l) yield i;
};

L.map = curry(function* (f, iter) {
  for (const a of iter) {
    yield go1(a, f);
  }
});

const nop = Symbol('nop');

L.filter = curry(function* (f, iter) {
  for (const a of iter) {
    const b = go1(a, f);
    if (b instanceof Promise) yield b.then((b) => (b ? a : Promise.reject(nop)));
    else if (b) yield a;
  }
});

L.entries = function* (obj) {
  for (const k in obj) yield [k, obj[k]];
};

L.flatten = function* (iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* a;
    else yield a;
  }
};

L.deepFlat = function* f(iter) {
  for (const a of iter) {
    if (isIterable(a)) yield* f(a);
    else yield a;
  }
};

L.flatMap = curry(pipe(L.map, L.flatten));

const map = curry(pipe(L.map, takeAll));

fx.map = map;

const filter = curry(pipe(L.filter, takeAll));

fx.filter = filter;

const find = curry((f, iter) => go(iter, L.filter(f), take(1), ([a]) => a));

fx.find = find;

const flatten = pipe(L.flatten, takeAll);

fx.flatten = flatten;

const flatMap = curry(pipe(L.map, flatten));

fx.flatMap = flatMap;

const range = (l) => {
  let i = -1;
  let res = [];
  while (++i < l) {
    res.push(i);
  }
  return res;
};

fx.range = range;

const C = {};

fx.C = C;

function noop() {}

const catchNoop = ([...arr]) => (
  arr.forEach((a) => (a instanceof Promise ? a.catch(noop) : a)), arr
);

C.reduce = curry((f, acc, iter) =>
  iter ? reduce(f, acc, catchNoop(iter)) : reduce(f, catchNoop(acc))
);

C.take = curry((l, iter) => take(l, catchNoop(iter)));

C.takeAll = C.take(Infinity);

C.map = curry(pipe(L.map, C.takeAll));

C.filter = curry(pipe(L.filter, C.takeAll));
