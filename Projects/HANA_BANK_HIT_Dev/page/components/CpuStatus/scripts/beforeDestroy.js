/*
 * Page - CpuStatus Component - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Dispose all ECharts instances
this.charts.forEach(chart => chart?.dispose());
this.charts = [];

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Remove event bindings
removeCustomEvents(this, this.customEvents);

console.log('[CpuStatus] destroy - cleanup completed');
