/*
 * Page - SummaryPanel Component - register
 * Card Company Dashboard
 * Subscribes to: summary
 * Events: none
 */

const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    summary: ['renderSummary']
};

this.renderSummary = renderSummary.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// RENDER FUNCTIONS
// ======================

function renderSummary({ response }) {
    const { data } = response;
    console.log(`[SummaryPanel] renderSummary:`, data);

    const template = this.element.querySelector('#summary-card-template');
    const container = this.element.querySelector('.summary-grid');

    if (!template || !container || !data) return;

    container.innerHTML = '';

    // Summary configuration
    const summaryConfig = [
        { key: 'balance', label: 'Available Balance', icon: '$', format: v => `$${v.toLocaleString()}` },
        { key: 'spending', label: 'This Month', icon: '-', format: v => `$${v.toLocaleString()}` },
        { key: 'rewards', label: 'Reward Points', icon: '*', format: v => v.toLocaleString() },
        { key: 'limit', label: 'Credit Limit', icon: '%', format: v => `$${v.toLocaleString()}` }
    ];

    summaryConfig.forEach(config => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.summary-card');
        const icon = clone.querySelector('.summary-icon');
        const label = clone.querySelector('.summary-label');
        const value = clone.querySelector('.summary-value');
        const trend = clone.querySelector('.summary-trend');

        card.dataset.summaryKey = config.key;
        icon.textContent = config.icon;
        label.textContent = config.label;
        value.textContent = config.format(data[config.key]?.value || 0);

        // Trend indicator
        if (data[config.key]?.trend) {
            const trendValue = data[config.key].trend;
            trend.textContent = `${trendValue > 0 ? '+' : ''}${trendValue}%`;
            trend.classList.add(trendValue > 0 ? 'up' : 'down');
        }

        container.appendChild(clone);
    });
}
