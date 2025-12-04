# example_websocket_01 - 실시간 주문 대시보드

## 개요

WebSocket 기반 실시간 데이터 스트리밍 패턴 검증 예제입니다.

**핵심**: 컴포넌트는 HTTP와 완전히 동일한 구독 패턴을 사용합니다.

---

## 구조

```
example_websocket_01/
├── page/
│   ├── page_scripts/
│   │   ├── before_load.js      # registerSocket (정보 등록)
│   │   ├── loaded.js           # openSocket (연결 열기)
│   │   └── before_unload.js    # closeSocket (연결 닫기)
│   └── components/
│       ├── OrderList/          # 실시간 주문 목록
│       └── OrderStats/         # 주문 통계
├── mock_server/
│   └── server.js               # WebSocket 서버 (port: 3002)
└── README.md
```

---

## 패턴 비교

### HTTP

```javascript
// Page - before_load (또는 loaded)
registerMapping({ topic, datasetInfo })
fetchAndPublish(topic, page)

// Page - before_unload
unregisterMapping(topic)
```

### WebSocket

```javascript
// Page - before_load
registerSocket({ topic, url, ... })

// Page - loaded
openSocket(topic)

// Page - before_unload
closeSocket(topic)
```

### Component (동일!)

```javascript
this.subscriptions = { realtime_orders: ['handleMessage'] };

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => subscribe(topic, this, this[fn]), fnList)
    )
);
```

---

## 실행

```bash
cd mock_server
npm install
npm start
```

서버: `ws://localhost:3002`

---

## 버전

**버전**: 1.0.0
**업데이트**: 2025-12-04
