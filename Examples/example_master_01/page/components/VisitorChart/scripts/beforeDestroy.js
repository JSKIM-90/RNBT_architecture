/*
 * Page - VisitorChart Component - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTION CLEANUP
// ======================

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// ======================
// EVENT CLEANUP
// ======================

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// ======================
// RESIZE OBSERVER CLEANUP
// ======================

if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

// ======================
// ECHARTS CLEANUP
// ======================

if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

// ======================
// HANDLER CLEANUP
// ======================

this.renderChart = null;

console.log('[VisitorChart] destroy - cleanup completed');
