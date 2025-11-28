/*
 * Master - common_component - register
 * Role: Acts as page before_load (since Master's page script doesn't work)
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup initial configurations
 * - NO 3D raycasting (Master has no 3D layer)
 */

const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // Header: User menu clicked
    '@userMenuClicked': ({ event, targetInstance }) => {
        console.log('[Master] User menu clicked:', event.target.dataset);
    },

    // Sidebar: Notification clicked
    '@notificationClicked': async ({ event, targetInstance }) => {
        const { notificationId } = event.target.dataset;
        console.log('[Master] Notification clicked:', notificationId);

        // Example: Mark as read, navigate, etc.
    },

    // Sidebar: Filter changed
    '@notificationFilterChanged': ({ event }) => {
        const limit = event.target.value;

        this.currentParams['notifications'] = {
            ...this.currentParams['notifications'],
            limit
        };

        GlobalDataPublisher.fetchAndPublish('notifications', this, this.currentParams['notifications']);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Master/common_component] register completed - event handlers ready');
