/*
 * Page - VisitorChart Component - destroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Remove event listeners
removeCustomEvents(this, this.customEvents);

// Remove resize handler
if (this.resizeHandler) {
    window.removeEventListener('resize', this.resizeHandler);
    this.resizeHandler = null;
}

// Dispose ECharts instance
if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

console.log('[VisitorChart] destroy - cleanup completed');
