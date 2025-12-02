/*
 * Master - Header Component - register
 * Card Company Dashboard
 * Subscribes to: cardInfo, menu
 * Events: @userMenuClicked, @navItemClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    cardInfo: ['renderCardInfo'],
    menu: ['renderMenu']
};

this.renderCardInfo = renderCardInfo.bind(this);
this.renderMenu = renderMenu.bind(this);

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
        '.user-menu': '@userMenuClicked',
        '.nav-link': '@navItemClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderCardInfo(response) {
    const { data } = response;
    console.log(`[Header] renderCardInfo:`, data);

    if (!data) return;

    const cardNumberEl = this.element.querySelector('.card-number');
    const cardHolderEl = this.element.querySelector('.card-holder');
    const avatarEl = this.element.querySelector('.user-avatar');
    const nameEl = this.element.querySelector('.user-name');

    if (cardNumberEl) cardNumberEl.textContent = data.cardNumber;
    if (cardHolderEl) cardHolderEl.textContent = data.cardHolder;
    if (avatarEl) avatarEl.src = data.avatar;
    if (nameEl) nameEl.textContent = data.userName;
}

function renderMenu(response) {
    const { items } = response;
    console.log(`[Header] renderMenu:`, items);

    if (!items) return;

    const template = this.element.querySelector('#nav-item-template');
    const container = this.element.querySelector('.nav-list');

    if (!template || !container) return;

    container.innerHTML = '';

    items.forEach(item => {
        const clone = template.content.cloneNode(true);
        const li = clone.querySelector('.nav-item');
        const link = clone.querySelector('.nav-link');
        const icon = clone.querySelector('.nav-icon');
        const label = clone.querySelector('.nav-label');

        li.dataset.menuId = item.id;
        if (item.active) li.classList.add('active');

        link.href = item.href;
        icon.textContent = item.icon;
        label.textContent = item.label;

        container.appendChild(clone);
    });
}
