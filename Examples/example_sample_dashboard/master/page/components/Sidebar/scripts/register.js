/**
 * Master - Sidebar Component - register.js
 *
 * 책임:
 * - 네비게이션 메뉴 표시
 * - 메뉴 클릭 이벤트 발행
 *
 * Subscribes to: menuList
 * Events: @navItemClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;

// ======================
// BINDINGS
// ======================

this.renderMenu = renderMenu.bind(this);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    menuList: ['renderMenu']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.nav-item': '@navItemClicked'
    }
};

bindEvents(this, this.customEvents);

console.log('[Sidebar] Registered');

// ======================
// RENDER FUNCTIONS
// ======================

function renderMenu({ response }) {
    const { items } = response;
    if (!items || !Array.isArray(items)) return;

    const template = this.element.querySelector('#nav-item-template');
    const container = this.element.querySelector('.nav-list');

    if (!template || !container) {
        console.warn('[Sidebar] Template or container not found');
        return;
    }

    container.innerHTML = '';

    const iconMap = {
        home: '🏠',
        chart: '📊',
        document: '📄',
        gear: '⚙️'
    };

    fx.go(
        items,
        fx.each(item => {
            const clone = template.content.cloneNode(true);
            const navItem = clone.querySelector('.nav-item');
            const icon = clone.querySelector('.nav-icon');
            const label = clone.querySelector('.nav-label');

            navItem.dataset.menuId = item.id;
            if (item.active) {
                navItem.classList.add('active');
            }

            icon.textContent = iconMap[item.icon] || '📁';
            label.textContent = item.label;

            container.appendChild(clone);
        })
    );

    console.log('[Sidebar] Menu rendered:', items.length, 'items');
}
