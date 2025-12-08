/*
 * Page - before_load
 * Basic single page structure (no Master layer)
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
    // SensorPanel: Refresh clicked
    '@sensorRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('sensors', this, this.currentParams['sensors'] || {});
    },

    // AlertList: Alert clicked
    '@alertClicked': ({ event }) => {
        const alertItem = event.target.closest('.alert-item');
        const { alertId, severity } = alertItem?.dataset || {};
        console.log('[Page] Alert clicked:', alertId, severity);
    },

    // AlertList: Dismiss clicked
    '@alertDismissClicked': ({ event }) => {
        const alertItem = event.target.closest('.alert-item');
        const { alertId } = alertItem?.dataset || {};
        console.log('[Page] Alert dismiss:', alertId);
        // In real app: call API to dismiss alert
    },

    // TrendChart: Period changed
    '@trendPeriodChanged': ({ event }) => {
        const period = event.target.value;
        console.log('[Page] Trend period changed:', period);
        // In real app: fetch data with new period param
    },

    // TrendChart: Refresh clicked
    '@trendRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('trend', this, this.currentParams['trend'] || {});
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - event handlers ready');
