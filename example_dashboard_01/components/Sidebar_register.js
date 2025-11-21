/* Component: Sidebar (Common Component)
 * Pattern: 2D Event Binding + GlobalDataPublisher Subscription
 * Purpose: Dashboard navigation sidebar with dynamic menu
 */

const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscription schema (for dynamic navigation menu)
    this.subscriptions = {
        navigationMenu: ['renderNavigationMenu']
    };

    // Event schema (delegate pattern for dynamic menu items)
    this.customEvents = {
        click: {
            '.nav-item[data-page]': 'handleNavClick'
        }
    };

    // Bind event handlers
    this.handleNavClick = handleNavClick.bind(this);
    this.renderNavigationMenu = renderNavigationMenu.bind(this);

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

// Handler: Render navigation menu dynamically using template
function renderNavigationMenu(data) {
    console.log(`[Sidebar] Rendering navigation menu:`, data);

    const menuItems = data?.items || [];
    const navListEl = this.element.querySelector('#nav-menu-list');
    const navItemTemplate = this.element.querySelector('#nav-item-template');
    const navSeparatorTemplate = this.element.querySelector('#nav-separator-template');

    if (!navListEl || !navItemTemplate) return;

    // Clear existing menu
    navListEl.innerHTML = '';

    // Render each menu item using template
    menuItems.forEach((item, index) => {
        // Render separator if provided
        if (item.type === 'separator') {
            if (navSeparatorTemplate) {
                const clone = navSeparatorTemplate.content.cloneNode(true);
                const labelEl = clone.querySelector('.separator-label');
                labelEl.textContent = item.label || '';
                navListEl.appendChild(clone);
            }
            return;
        }

        // Render navigation item
        const clone = navItemTemplate.content.cloneNode(true);

        // Set item data
        const navItemEl = clone.querySelector('.nav-item');
        navItemEl.dataset.page = item.page;

        if (item.active) {
            navItemEl.classList.add('active');
        }

        // Set icon (emoji or SVG)
        const iconEl = clone.querySelector('.nav-icon');
        iconEl.textContent = item.icon || '📄';

        // Set label
        const labelEl = clone.querySelector('.nav-label');
        labelEl.textContent = item.label;

        // Set badge if provided
        if (item.badge !== undefined && item.badge > 0) {
            const badgeEl = clone.querySelector('.nav-badge');
            badgeEl.textContent = item.badge;
            badgeEl.style.display = 'block';
        }

        // Emit event name for each item
        navItemEl.dataset.eventName = item.eventName || `@nav${item.page.charAt(0).toUpperCase() + item.page.slice(1)}Clicked`;

        navListEl.appendChild(clone);
    });
}

// Handler: Navigation item clicked
function handleNavClick(event) {
    const navItem = event.target.closest('.nav-item');
    if (!navItem) return;

    const page = navItem.dataset.page;
    const eventName = navItem.dataset.eventName;

    console.log(`[Sidebar] Navigation clicked:`, page);

    // Remove active class from all nav items
    const navItems = this.element.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    // Add active class to clicked item
    navItem.classList.add('active');

    // Emit custom event
    if (eventName) {
        WKit.emitEvent(eventName, { page, navItem: this });
    }
}
