/*
 * Master - Sidebar Component - register
 * Subscribes to: notifications
 * Events: @notificationClicked, @notificationFilterChanged
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    notifications: ['renderNotifications', 'updateBadge']
};

this.renderNotifications = renderNotifications.bind(this);
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
        '.notification-item': '@notificationClicked'
    },
    change: {
        '.notification-filter': '@notificationFilterChanged'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderNotifications({ response }) {
    const { items } = response;
    console.log(`[Sidebar] renderNotifications: ${items?.length || 0} items`);

    const template = this.element.querySelector('#notification-item-template');
    const container = this.element.querySelector('.notification-list');

    if (!template || !container || !items) return;

    container.innerHTML = '';

    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const div = clone.querySelector('.notification-item');
        const icon = clone.querySelector('.notification-icon');
        const message = clone.querySelector('.notification-message');
        const time = clone.querySelector('.notification-time');

        div.dataset.notificationId = item.id;
        div.dataset.type = item.type;
        if (!item.read) div.classList.add('unread');

        // Icon based on type
        const icons = { info: 'i', warning: '!', success: '✓' };
        icon.textContent = icons[item.type] || 'i';

        message.textContent = item.message;
        time.textContent = formatTime(item.time);

        container.appendChild(clone);
    });
}

function updateBadge(response) {
    const { unreadCount } = response;
    console.log(`[Sidebar] updateBadge: ${unreadCount ?? 0} unread`);

    const badge = this.element.querySelector('.notification-badge');
    if (badge) {
        badge.textContent = unreadCount ?? 0;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
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
