/*
 * Page - VisitorChart Component - destroy
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

// Disconnect ResizeObserver
if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

// Dispose ECharts instance
if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

console.log('[VisitorChart] destroy - cleanup completed');
