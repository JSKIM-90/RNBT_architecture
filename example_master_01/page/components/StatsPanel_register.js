/*
 * Page - StatsPanel Component - register
 * Subscribes to: stats
 * Events: @periodFilterChanged, @statsRefreshClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    stats: ['renderStats']
};

this.renderStats = renderStats.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    change: {
        '.period-filter': '@periodFilterChanged'
    },
    click: {
        '.refresh-btn': '@statsRefreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderStats(response) {
    try {
        const { data } = response;
        console.log(`[StatsPanel] renderStats:`, data);

        const template = this.element.querySelector('#stat-card-template');
        const container = this.element.querySelector('.stats-grid');

        if (!template || !container || !data) return;

        container.innerHTML = '';

        // Stats configuration
        const statsConfig = [
            { key: 'visitors', label: 'Visitors', icon: '👥', format: v => v.toLocaleString() },
            { key: 'pageViews', label: 'Page Views', icon: '📄', format: v => v.toLocaleString() },
            { key: 'sessions', label: 'Sessions', icon: '🔗', format: v => v.toLocaleString() },
            { key: 'bounceRate', label: 'Bounce Rate', icon: '↩️', format: v => `${v}%` }
        ];

        statsConfig.forEach(config => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.stat-card');
            const icon = clone.querySelector('.stat-icon');
            const label = clone.querySelector('.stat-label');
            const value = clone.querySelector('.stat-value');

            card.dataset.statKey = config.key;
            icon.textContent = config.icon;
            label.textContent = config.label;
            value.textContent = config.format(data[config.key]);

            container.appendChild(clone);
        });
    } catch (error) {
        console.error('[StatsPanel] renderStats error:', error);
    }
}
