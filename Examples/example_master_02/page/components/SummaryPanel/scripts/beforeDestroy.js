/*
 * Page - SummaryPanel Component - beforeDestroy
 * Card Company Dashboard
 */

const { unsubscribe } = GlobalDataPublisher;
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
// HANDLER CLEANUP
// ======================

this.renderSummary = null;

console.log('[SummaryPanel] destroy - cleanup completed');
