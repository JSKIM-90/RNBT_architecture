/**
 * Master - Sidebar Component - register.js
 *
 * 책임:
 * - 네비게이션 메뉴 표시
 * - 메뉴 클릭 이벤트 발행 (페이지 이동)
 *
 * Subscribes to: menuList
 * Events: @navItemClicked
 *
 * 패턴 포인트:
 * - Template 기반 동적 렌더링
 * - 이벤트 위임 (delegation) 패턴
 * - 페이지 이동은 콘솔로 대체 (런타임 규칙 있음)
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

/**
 * 이벤트 위임 패턴
 *
 * - '.nav-item' 클릭 시 @navItemClicked 발행
 * - Master의 before_load.js에서 처리
 * - 실제 페이지 이동은 런타임에서 처리
 */
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

/**
 * 네비게이션 메뉴 렌더링
 *
 * @param {Object} param - API 응답 { response: { success, items } }
 *
 * 렌더링 패턴:
 * 1. Template 복제
 * 2. 데이터 바인딩
 * 3. 컨테이너에 추가
 */
function renderMenu({ response }) {
    const { items } = response;
    if (!items || !Array.isArray(items)) return;

    const template = this.element.querySelector('#nav-item-template');
    const container = this.element.querySelector('.nav-list');

    if (!template || !container) {
        console.warn('[Sidebar] Template or container not found');
        return;
    }

    // 기존 항목 제거
    container.innerHTML = '';

    // 메뉴 항목 렌더링
    fx.go(
        items,
        fx.each(item => {
            const clone = template.content.cloneNode(true);
            const navItem = clone.querySelector('.nav-item');
            const icon = clone.querySelector('.nav-icon');
            const label = clone.querySelector('.nav-label');

            // 데이터 바인딩
            navItem.dataset.menuId = item.id;
            if (item.active) {
                navItem.classList.add('active');
            }

            // 아이콘 (간단한 텍스트 아이콘 사용)
            const iconMap = {
                home: '🏠',
                chart: '📊',
                document: '📄',
                gear: '⚙️'
            };
            icon.textContent = iconMap[item.icon] || '📁';
            label.textContent = item.label;

            container.appendChild(clone);
        })
    );

    console.log('[Sidebar] Menu rendered:', items.length, 'items');
}
