const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// ======================
// CLEANUP
// ======================

// Unsubscribe from all topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Clear references
this.subscriptions = null;
this.renderSystemStatus = null;
