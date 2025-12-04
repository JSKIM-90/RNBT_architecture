const { subscribe } = GlobalDataPublisher;

initComponent.call(this);

function initComponent() {
    this.stats = { total: 0, pending: 0, completed: 0 };
    this.orderMap = new Map();

    // 구독 설정 (HTTP와 동일한 패턴!)
    this.subscriptions = {
        realtime_orders: ['handleMessage']
    };

    this.handleMessage = handleMessage.bind(this);
    this.renderStats = renderStats.bind(this);

    // 구독 등록
    fx.go(
        Object.entries(this.subscriptions),
        fx.each(([topic, fnList]) =>
            fx.each(fn => subscribe(topic, this, this[fn]), fnList)
        )
    );

    this.renderStats();
}

function handleMessage(message) {
    switch (message.type) {
        case 'new_order':
            this.stats.total++;
            this.stats[message.data.status]++;
            this.orderMap.set(message.data.id, message.data.status);
            break;
        case 'status_changed':
            const prevStatus = this.orderMap.get(message.data.id);
            if (prevStatus && prevStatus !== message.data.status) {
                this.stats[prevStatus]--;
                this.stats[message.data.status]++;
                this.orderMap.set(message.data.id, message.data.status);
            }
            break;
    }
    this.renderStats();
}

function renderStats() {
    this.element.innerHTML = `
        <div class="stats">
            <div class="stat-item">
                <span class="stat-value">${this.stats.total}</span>
                <span class="stat-label">전체</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.stats.pending}</span>
                <span class="stat-label">대기</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${this.stats.completed}</span>
                <span class="stat-label">완료</span>
            </div>
        </div>
    `;
}
