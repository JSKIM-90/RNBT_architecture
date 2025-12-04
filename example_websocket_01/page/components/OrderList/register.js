const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    this.orders = [];

    // 구독 설정 (HTTP와 동일한 패턴!)
    this.subscriptions = {
        realtime_orders: ['handleMessage']
    };

    this.customEvents = {
        click: {
            '.btn-complete': '@completeOrder'
        }
    };

    this.handleMessage = handleMessage.bind(this);
    this.renderOrders = renderOrders.bind(this);

    // 구독 등록
    fx.go(
        Object.entries(this.subscriptions),
        fx.each(([topic, fnList]) =>
            fx.each(fn => subscribe(topic, this, this[fn]), fnList)
        )
    );

    bindEvents(this, this.customEvents);
}

function handleMessage(message) {
    switch (message.type) {
        case 'connected':
            console.log('[OrderList] Connected');
            break;
        case 'new_order':
            this.orders.unshift(message.data);
            if (this.orders.length > 20) this.orders.pop();
            break;
        case 'status_changed':
            const order = this.orders.find(o => o.id === message.data.id);
            if (order) order.status = message.data.status;
            break;
    }
    this.renderOrders();
}

function renderOrders() {
    if (this.orders.length === 0) {
        this.element.innerHTML = '<div class="empty">주문 대기 중...</div>';
        return;
    }

    this.element.innerHTML = this.orders.map(order => `
        <div class="order-item" data-order-id="${order.id}">
            <span class="order-id">${order.id}</span>
            <span class="order-product">${order.product}</span>
            <span class="order-status">${order.status}</span>
            <span class="order-price">${order.price.toLocaleString()}원</span>
        </div>
    `).join('');
}
