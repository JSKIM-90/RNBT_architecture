/*
 * Page - before_load
 * Card Company Dashboard
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
    // TransactionTable: Filter changed
    '@transactionFilterChanged': ({ event }) => {
        const category = event.target.value;

        this.currentParams['transactions'] = {
            ...this.currentParams['transactions'],
            category
        };

        GlobalDataPublisher.fetchAndPublish('transactions', this, this.currentParams['transactions']);
    },

    // TransactionTable: Refresh clicked
    '@tableRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('transactions', this, this.currentParams['transactions'] || {});
    },

    // SpendingChart: Refresh clicked
    '@spendingChartRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('spending', this, this.currentParams['spending'] || {});
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - event handlers ready');
