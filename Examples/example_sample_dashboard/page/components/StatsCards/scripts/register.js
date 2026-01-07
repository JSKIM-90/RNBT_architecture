/**
 * Page - StatsCards Component - register.js
 *
 * 책임:
 * - 통계 요약 카드 표시
 * - 카드 클릭 이벤트 발행
 *
 * Subscribes to: stats
 * Events: @cardClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;

// ======================
// CONFIG (Summary Config 패턴)
// ======================

const config = [
    {
        key: 'revenue',
        label: 'Revenue',
        icon: '💰',
        format: (v, unit) => `${unit}${v.toLocaleString()}`
    },
    {
        key: 'orders',
        label: 'Orders',
        icon: '📦',
        format: (v) => v.toLocaleString()
    },
    {
        key: 'customers',
        label: 'Customers',
        icon: '👥',
        format: (v) => v.toLocaleString()
    },
    {
        key: 'conversion',
        label: 'Conversion',
        icon: '📈',
        format: (v, unit) => `${v}${unit}`
    }
];

// ======================
// BINDINGS
// ======================

this.renderStats = renderStats.bind(this, config);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    stats: ['renderStats']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.stat-card': '@cardClicked'
    }
};

bindEvents(this, this.customEvents);

console.log('[StatsCards] Registered');

// ======================
// RENDER FUNCTIONS
// ======================

function renderStats(config, { response }) {
    const { data } = response;
    if (!data) return;

    const template = this.element.querySelector('#stat-card-template');
    const container = this.element.querySelector('.stats-grid');

    if (!template || !container) {
        console.warn('[StatsCards] Template or container not found');
        return;
    }

    container.innerHTML = '';

    fx.go(
        config,
        fx.each(({ key, label, icon, format }) => {
            const stat = data[key];
            if (!stat) return;

            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.stat-card');
            const iconEl = clone.querySelector('.stat-icon');
            const labelEl = clone.querySelector('.stat-label');
            const valueEl = clone.querySelector('.stat-value');
            const changeEl = clone.querySelector('.stat-change');

            card.dataset.statKey = key;
            iconEl.textContent = icon;
            labelEl.textContent = label;
            valueEl.textContent = format(stat.value, stat.unit);

            const changeValue = stat.change;
            const isPositive = changeValue >= 0;
            changeEl.textContent = `${isPositive ? '+' : ''}${changeValue}%`;
            changeEl.classList.add(isPositive ? 'positive' : 'negative');

            container.appendChild(clone);
        })
    );

    console.log('[StatsCards] Stats rendered');
}
