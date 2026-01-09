/*
 * Page - TimeTrendChart Component - beforeDestroy
 * 시간대별 거래추이
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
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

// Clear bound methods
this.renderChart = null;

console.log('[TimeTrendChart] destroy - cleanup completed');
