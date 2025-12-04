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
// 등록
registerMapping({ topic, datasetInfo: { datasetName, param } })

// 실행
fetchAndPublish(topic, page, paramUpdates)

// 해제
unregisterMapping(topic)
```

### WebSocket

```javascript
// 등록
registerSocket({ topic, url, param, options })

// 실행
openSocket(topic, paramUpdates)

// 해제
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

## socketMappings 구조

```javascript
this.socketMappings = [
    {
        topic: 'realtime_orders',
        url: 'ws://localhost:3002',
        param: { channel: 'orders' },      // URL 쿼리로 변환
        options: {                          // 선택 (기본값 있음)
            reconnect: true,
            reconnectInterval: 3000,
            maxReconnectAttempts: 5,
            transform: (data) => JSON.parse(data)
        }
    }
];
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

## 향후 구현 예정

- `sendMessage(topic, message)`: 서버로 메시지 전송

---

## 설계 검토 (2025-12-04)

### 잘된 점

1. **패턴 일관성**: HTTP와 WebSocket의 라이프사이클이 대칭 (register → open/fetch → close)
2. **컴포넌트 투명성**: 컴포넌트는 데이터 소스(HTTP/WebSocket)를 알 필요 없음
3. **책임 분리**: `mappingTable`(HTTP), `socketTable`(WebSocket), `subscriberTable`(공유)

### 참고사항

1. **closeSocket 동작**: 등록 자체를 삭제함 (`socketTable.delete`). 재연결하려면 다시 `registerSocket` 필요.
2. **reconnect와 closeSocket**: `closeSocket` 호출 시 `onclose = null`로 재연결 방지됨.
3. **param 병합**: `openSocket` 시점에 `currentParam` 저장 → 재연결 시 동일 param 사용.

### 결론

구조적 문제 없음. 실제 테스트 후 엣지 케이스 발견 시 수정.

---

## 버전

**버전**: 1.1.0
**업데이트**: 2025-12-04
