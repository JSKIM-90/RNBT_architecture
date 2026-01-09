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
const { bindEvents } = Wkit;

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

    const template = this.appendElement.querySelector('#nav-item-template');
    const container = this.appendElement.querySelector('.nav-list');

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

    // 파이프라인: items → DOM 생성 → 삽입
    fx.go(
        items,
        fx.map(item => createNavItem(template, iconMap, item)),
        fx.each(el => container.appendChild(el))
    );

    console.log('[Sidebar] Menu rendered:', items.length, 'items');
}

/**
 * 네비게이션 아이템 DOM 요소 생성
 */
function createNavItem(template, iconMap, item) {
    const clone = template.content.cloneNode(true);
    const navItem = clone.querySelector('.nav-item');

    navItem.dataset.menuId = item.id;
    if (item.active) navItem.classList.add('active');

    clone.querySelector('.nav-icon').textContent = iconMap[item.icon] || '📁';
    clone.querySelector('.nav-label').textContent = item.label;

    return clone;
}
