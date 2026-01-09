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
const { bindEvents } = Wkit;

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

    const template = this.appendElement.querySelector('#stat-card-template');
    const container = this.appendElement.querySelector('.stats-grid');

    if (!template || !container) {
        console.warn('[StatsCards] Template or container not found');
        return;
    }

    container.innerHTML = '';

    // 파이프라인: config → 데이터 매칭 → 유효한 것만 필터 → DOM 생성 → 삽입
    fx.go(
        config,
        fx.map(cfg => ({ cfg, stat: data[cfg.key] })),
        fx.filter(({ stat }) => stat),
        fx.map(({ cfg, stat }) => createStatCard(template, cfg, stat)),
        fx.each(card => container.appendChild(card))
    );

    console.log('[StatsCards] Stats rendered');
}

/**
 * 통계 카드 DOM 요소 생성
 */
function createStatCard(template, { key, label, icon, format }, stat) {
    const clone = template.content.cloneNode(true);

    clone.querySelector('.stat-card').dataset.statKey = key;
    clone.querySelector('.stat-icon').textContent = icon;
    clone.querySelector('.stat-label').textContent = label;
    clone.querySelector('.stat-value').textContent = format(stat.value, stat.unit);

    const changeEl = clone.querySelector('.stat-change');
    const isPositive = stat.change >= 0;
    changeEl.textContent = `${isPositive ? '+' : ''}${stat.change}%`;
    changeEl.classList.add(isPositive ? 'positive' : 'negative');

    return clone;
}
