/* Component: Header (Common Component)
 * Pattern: 2D Event Binding + GlobalDataPublisher Subscription
 * Purpose: Dashboard header with period filter, user info, and notifications
 */

const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscription schema (for dynamic user info and notifications)
    this.subscriptions = {
        userInfo: ['renderUserInfo'],
        notifications: ['renderNotifications']
    };

    // Event schema
    this.customEvents = {
        change: {
            '#period-filter': '@periodFilterChanged'
        },
        click: {
            '.user-profile': '@userProfileClicked',
            '.notification-icon': '@notificationClicked',
            '.notification-dismiss': 'handleNotificationDismiss'
        }
    };

    // Bind event handlers
    this.handlePeriodFilter = handlePeriodFilter.bind(this);
    this.handleUserProfile = handleUserProfile.bind(this);
    this.handleNotification = handleNotification.bind(this);
    this.handleNotificationDismiss = handleNotificationDismiss.bind(this);
    this.renderUserInfo = renderUserInfo.bind(this);
    this.renderNotifications = renderNotifications.bind(this);

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );

    // Bind events to DOM
    bindEvents(this, this.customEvents);
}

// Handler: Render user info dynamically
function renderUserInfo(data) {
    console.log(`[Header] Rendering user info:`, data);

    const { name, role, avatar } = data || {};

    // Update user name
    const userNameEl = this.element.querySelector('.user-name');
    if (userNameEl) {
        userNameEl.textContent = name || 'Guest';
    }

    // Update user role
    const userRoleEl = this.element.querySelector('.user-role');
    if (userRoleEl) {
        userRoleEl.textContent = role || '-';
    }

    // Update avatar if provided
    if (avatar) {
        const template = this.element.querySelector('#user-avatar-template');
        const avatarContainer = this.element.querySelector('.user-avatar');

        if (template && avatarContainer) {
            const clone = template.content.cloneNode(true);
            const img = clone.querySelector('.user-avatar-img');
            img.src = avatar;
            img.alt = name || 'User';

            // Clear placeholder and insert avatar
            avatarContainer.innerHTML = '';
            avatarContainer.appendChild(clone);
        }
    }
}

// Handler: Render notifications dynamically using template
function renderNotifications(data) {
    console.log(`[Header] Rendering notifications:`, data);

    const notifications = data?.items || [];
    const count = notifications.length;

    // Update notification badge
    const badgeEl = this.element.querySelector('.notification-badge');
    if (badgeEl) {
        badgeEl.textContent = count;
        badgeEl.style.display = count > 0 ? 'block' : 'none';
    }

    // Render notification dropdown using template
    const dropdownEl = this.element.querySelector('.notification-dropdown');
    const template = this.element.querySelector('#notification-item-template');

    if (!dropdownEl || !template) return;

    // Clear existing notifications
    dropdownEl.innerHTML = '';

    if (count === 0) {
        dropdownEl.innerHTML = '<div style="padding: 1rem; text-align: center; color: #6b7280;">No new notifications</div>';
        return;
    }

    // Render each notification using template
    notifications.forEach((notification) => {
        const clone = template.content.cloneNode(true);

        // Set notification data
        const itemEl = clone.querySelector('.notification-item');
        itemEl.dataset.notificationId = notification.id;

        const titleEl = clone.querySelector('.notification-title');
        titleEl.textContent = notification.title;

        const messageEl = clone.querySelector('.notification-message');
        messageEl.textContent = notification.message;

        const timeEl = clone.querySelector('.notification-time');
        timeEl.textContent = notification.time;

        dropdownEl.appendChild(clone);
    });
}

// Handler: Period filter changed
function handlePeriodFilter(event) {
    console.log(`[Header] Period filter changed:`, event.target.value);
}

// Handler: User profile clicked
function handleUserProfile(event) {
    console.log(`[Header] User profile clicked:`, this.name);
}

// Handler: Notification icon clicked (toggle dropdown)
function handleNotification(event) {
    console.log(`[Header] Notification clicked:`, this.name);

    const dropdownEl = this.element.querySelector('.notification-dropdown');
    if (dropdownEl) {
        const isVisible = dropdownEl.style.display !== 'none';
        dropdownEl.style.display = isVisible ? 'none' : 'block';
    }
}

// Handler: Notification dismiss clicked
function handleNotificationDismiss(event) {
    event.stopPropagation();
    const notificationItem = event.target.closest('.notification-item');
    const notificationId = notificationItem?.dataset.notificationId;

    console.log(`[Header] Dismissing notification:`, notificationId);

    if (notificationItem) {
        notificationItem.remove();

        // Update badge count
        const remainingCount = this.element.querySelectorAll('.notification-item').length;
        const badgeEl = this.element.querySelector('.notification-badge');
        if (badgeEl) {
            badgeEl.textContent = remainingCount;
            badgeEl.style.display = remainingCount > 0 ? 'block' : 'none';
        }
    }
}
