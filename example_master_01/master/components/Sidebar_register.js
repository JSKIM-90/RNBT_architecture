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
// HANDLERS
// ======================

function renderNotifications(response) {
    const { items } = response;
    console.log(`[Sidebar] renderNotifications: ${items.length} items`);

    // Example: Render notification list
    // const html = items.map(item => `<div class="notification-item" data-notification-id="${item.id}">${item.message}</div>`).join('');
    // this.element.querySelector('.notification-list').innerHTML = html;
}

function updateBadge(response) {
    const { unreadCount } = response;
    console.log(`[Sidebar] updateBadge: ${unreadCount} unread`);

    // Example: Update badge count
    // this.element.querySelector('.badge').textContent = unreadCount;
}
