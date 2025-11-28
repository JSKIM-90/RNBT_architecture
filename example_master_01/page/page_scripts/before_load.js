/*
 * Page - before_load
 * Normal page area (NOT Master)
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup configurations
 */

const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // StatsPanel: Period filter changed
    '@periodFilterChanged': ({ event }) => {
        const period = event.target.value;  // '24h', '7d', '30d'

        this.currentParams['stats'] = {
            ...this.currentParams['stats'],
            period
        };

        GlobalDataPublisher.fetchAndPublish('stats', this, this.currentParams['stats']);
    },

    // StatsPanel: Refresh clicked
    '@statsRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('stats', this, this.currentParams['stats'] || {});
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - event handlers ready');
