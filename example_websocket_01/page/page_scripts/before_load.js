const { onEventBusHandlers } = WKit;
const { registerSocket } = GlobalDataPublisher;

// ========== WebSocket 등록 ==========
this.socketMappings = [
    {
        topic: 'realtime_orders',
        url: 'ws://localhost:3002',
        reconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        transform: (raw) => JSON.parse(raw)
    }
];

fx.each(registerSocket, this.socketMappings);

// ========== 이벤트 핸들러 ==========
this.eventBusHandlers = {
    '@updateOrderStatus': ({ orderId, status }) => {
        GlobalDataPublisher.sendMessage('realtime_orders', {
            type: 'update_status',
            orderId,
            status
        });
    }
};

onEventBusHandlers(this.eventBusHandlers);
