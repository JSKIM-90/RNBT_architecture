/*
 * Page - SummaryPanel Component - destroy
 * Card Company Dashboard
 */

const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

console.log('[SummaryPanel] destroy - cleanup completed');
