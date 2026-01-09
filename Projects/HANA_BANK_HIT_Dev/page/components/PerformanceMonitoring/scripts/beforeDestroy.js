/*
 * Page - PerformanceMonitoring Component - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each } = fx;

// 1. Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// 2. Remove event bindings
removeCustomEvents(this, this.customEvents);

// 3. Cleanup references
this.subscriptions = null;
this.customEvents = null;
this.renderData = null;

console.log('[PerformanceMonitoring] destroy - cleanup completed');
