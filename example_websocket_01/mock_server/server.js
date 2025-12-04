const WebSocket = require('ws');

const PORT = 3002;
const wss = new WebSocket.Server({ port: PORT });

let orderIdCounter = 1000;

const products = ['무선 키보드', '게이밍 마우스', '27인치 모니터', 'USB-C 허브', 'SSD 1TB'];

function generateOrder() {
  return {
    id: `ORD-${++orderIdCounter}`,
    product: products[Math.floor(Math.random() * products.length)],
    quantity: Math.floor(Math.random() * 5) + 1,
    price: Math.floor(Math.random() * 100000) + 10000,
    status: 'pending',
    timestamp: new Date().toISOString(),
  };
}

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('[Server] Client connected');
  clients.add(ws);

  ws.send(JSON.stringify({
    type: 'connected',
    data: { message: 'WebSocket connected', timestamp: new Date().toISOString() }
  }));

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log('[Server] Received:', parsed);

      if (parsed.type === 'update_status') {
        broadcast({
          type: 'status_changed',
          data: { id: parsed.orderId, status: parsed.status, timestamp: new Date().toISOString() }
        });
      }
    } catch (error) {
      console.error('[Server] Message parse error:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Server] Client disconnected');
    clients.delete(ws);
  });
});

function broadcast(message) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

setInterval(() => {
  if (clients.size > 0) {
    const order = generateOrder();
    console.log('[Server] New order:', order.id);
    broadcast({ type: 'new_order', data: order });
  }
}, 3000);

console.log(`[Server] WebSocket server running on ws://localhost:${PORT}`);
