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
// HANDLERS
// ======================

function renderStats(response) {
    const { data } = response;
    console.log(`[StatsPanel] renderStats:`, data);

    // Example: Update stats display
    // this.element.querySelector('.visitors').textContent = data.visitors;
    // this.element.querySelector('.page-views').textContent = data.pageViews;
    // this.element.querySelector('.sessions').textContent = data.sessions;
    // this.element.querySelector('.bounce-rate').textContent = data.bounceRate + '%';
}
