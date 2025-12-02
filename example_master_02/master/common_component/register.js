/*
 * Master - common_component - register
 * Card Company Dashboard
 * Role: Acts as page before_load (since Master's page script doesn't work)
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup initial configurations
 */

const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // Header: User menu clicked
    '@userMenuClicked': ({ event, targetInstance }) => {
        console.log('[Master] User menu clicked');
        // Example: Toggle dropdown menu
    },

    // Header: Nav item clicked
    '@navItemClicked': ({ event, targetInstance }) => {
        const navItem = event.target.closest('.nav-item');
        const { menuId } = navItem?.dataset || {};
        console.log('[Master] Nav item clicked:', menuId);

        // Example: Navigate, update active state, etc.
    },

    // Sidebar: Alert clicked
    '@alertClicked': async ({ event, targetInstance }) => {
        const item = event.target.closest('.alert-item');
        const { alertId, type } = item?.dataset || {};
        console.log('[Master] Alert clicked:', alertId, type);

        // Example: Mark as read, show detail, etc.
    },

    // Sidebar: Filter changed
    '@alertFilterChanged': ({ event }) => {
        const filterType = event.target.value;

        this.currentParams['alerts'] = {
            ...this.currentParams['alerts'],
            type: filterType
        };

        GlobalDataPublisher.fetchAndPublish('alerts', this.page, this.currentParams['alerts']);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Master/common_component] register completed - event handlers ready');
