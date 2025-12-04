const { onEventBusHandlers } = WKit;
const { registerSocket } = GlobalDataPublisher;

// ========== WebSocket 등록 ==========
this.socketMappings = [
    {
        topic: 'realtime_orders',
        url: 'ws://localhost:3002',
        param: { channel: 'orders' }
    }
];

fx.each(registerSocket, this.socketMappings);

// ========== 이벤트 핸들러 ==========
this.eventBusHandlers = {
    '@orderClicked': ({ event, targetInstance }) => {
        const orderId = event.target.closest('[data-order-id]')?.dataset.orderId;
        if (orderId) {
            console.log('[Page] Order clicked:', orderId);
        }
    }
};

onEventBusHandlers(this.eventBusHandlers);
