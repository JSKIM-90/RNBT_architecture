/*
 * Page - SpendingChart Component - destroy
 * Card Company Dashboard
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Remove event listeners
removeCustomEvents(this, this.customEvents);

// Stop ResizeObserver
if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

// Dispose ECharts instance
if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

console.log('[SpendingChart] destroy - cleanup completed');
