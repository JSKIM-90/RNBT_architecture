/*
 * Master - Header Component - register
 * Subscribes to: userInfo
 * Events: @userMenuClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    userInfo: ['renderUserInfo']
};

this.renderUserInfo = renderUserInfo.bind(this);

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
        '.user-menu': '@userMenuClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// HANDLERS
// ======================

function renderUserInfo(response) {
    const { data } = response;
    console.log(`[Header] renderUserInfo:`, data);

    // Example: Update user name, avatar in header
    // this.element.querySelector('.user-name').textContent = data.name;
}
