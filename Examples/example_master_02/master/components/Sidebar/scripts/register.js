/*
 * Master - Sidebar Component - register
 * Card Company Dashboard
 * Subscribes to: alerts
 * Events: @alertClicked, @alertFilterChanged
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    alerts: ['renderAlerts', 'updateBadge']
};

this.renderAlerts = renderAlerts.bind(this);
this.updateBadge = updateBadge.bind(this);

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
        '.alert-item': '@alertClicked'
    },
    change: {
        '.alert-filter': '@alertFilterChanged'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderAlerts({ response }) {
    const { items } = response;
    console.log(`[Sidebar] renderAlerts: ${items?.length || 0} items`);

    const template = this.element.querySelector('#alert-item-template');
    const container = this.element.querySelector('.alert-list');

    if (!template || !container || !items) return;

    container.innerHTML = '';

    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const div = clone.querySelector('.alert-item');
        const icon = clone.querySelector('.alert-icon');
        const message = clone.querySelector('.alert-message');
        const amount = clone.querySelector('.alert-amount');
        const time = clone.querySelector('.alert-time');

        div.dataset.alertId = item.id;
        div.dataset.type = item.type;
        if (!item.read) div.classList.add('unread');

        // Icon based on type
        const icons = { transaction: '$', security: '!', reward: '*' };
        icon.textContent = icons[item.type] || '$';

        message.textContent = item.message;

        if (item.amount) {
            amount.textContent = formatAmount(item.amount);
            amount.classList.add(item.amount < 0 ? 'negative' : 'positive');
        }

        time.textContent = formatTime(item.time);

        container.appendChild(clone);
    });
}

function updateBadge(response) {
    const { unreadCount } = response;
    console.log(`[Sidebar] updateBadge: ${unreadCount ?? 0} unread`);

    const badge = this.element.querySelector('.alert-badge');
    if (badge) {
        badge.textContent = unreadCount ?? 0;
    }
}

// ======================
// HELPERS
// ======================

function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return date.toLocaleDateString();
}

function formatAmount(amount) {
    const sign = amount < 0 ? '-' : '+';
    return `${sign}$${Math.abs(amount).toLocaleString()}`;
}
