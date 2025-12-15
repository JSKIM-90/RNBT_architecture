/*
 * Page - AlertList Component - register
 * Subscribes to: alerts
 * Events: @alertClicked, @alertDismissClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    alerts: ['renderAlerts']
};

this.renderAlerts = renderAlerts.bind(this);

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
    click: {
        '.alert-item': '@alertClicked',
        '.alert-dismiss': '@alertDismissClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderAlerts(response) {
    const { alerts } = response;
    console.log(`[AlertList] renderAlerts: ${alerts?.length || 0} alerts`);

    const template = this.element.querySelector('#alert-item-template');
    const container = this.element.querySelector('.alert-list');
    const emptyState = this.element.querySelector('.alert-empty');
    const countBadge = this.element.querySelector('.alert-count');

    if (!template || !container) return;

    // Update count badge
    if (countBadge) {
        countBadge.textContent = alerts?.length || 0;
        countBadge.classList.toggle('empty', !alerts?.length);
    }

    // Show/hide empty state
    if (emptyState) {
        emptyState.style.display = alerts?.length ? 'none' : 'flex';
    }

    container.innerHTML = '';

    if (!alerts?.length) return;

    alerts.forEach(alert => {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.alert-item');

        item.dataset.alertId = alert.id;
        item.dataset.severity = alert.type;

        clone.querySelector('.alert-message').textContent = alert.message;
        clone.querySelector('.alert-zone').textContent = alert.zone;
        clone.querySelector('.alert-time').textContent = formatTime(alert.timestamp);

        container.appendChild(clone);
    });
}

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
