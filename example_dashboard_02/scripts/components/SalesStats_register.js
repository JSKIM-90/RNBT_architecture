const { subscribe } = GlobalDataPublisher;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscribe to sales data
    this.subscriptions = {
        salesData: ['updateStats']
    };

    this.updateStats = updateStats.bind(this);

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );
}

function updateStats(data) {
    console.log(`[SalesStats] Updating stats`, data);

    if (!data || !data.products) return;

    const products = data.products;

    // Calculate stats
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
    const totalOrders = products.length;
    const avgPrice = totalRevenue / totalOrders;

    // Update UI
    const statCards = this.element.querySelectorAll('.stat-card');

    if (statCards[0]) {
        statCards[0].querySelector('.stat-value').textContent = `$${totalRevenue.toFixed(2)}`;
        statCards[0].querySelector('.stat-change').textContent = `+12.5% from last month`;
    }

    if (statCards[1]) {
        statCards[1].querySelector('.stat-value').textContent = totalOrders;
        statCards[1].querySelector('.stat-change').textContent = `+8.2% from last month`;
    }

    if (statCards[2]) {
        statCards[2].querySelector('.stat-value').textContent = Math.floor(totalOrders * 0.3);
        statCards[2].querySelector('.stat-change').textContent = `-2.4% from last month`;
    }

    if (statCards[3]) {
        const conversionRate = ((totalOrders / (totalOrders * 1.5)) * 100).toFixed(1);
        statCards[3].querySelector('.stat-value').textContent = `${conversionRate}%`;
        statCards[3].querySelector('.stat-change').textContent = `+5.1% from last month`;
    }
}
