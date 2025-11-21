/* Pattern: 2D Component - Cleanup (with Subscription) */

const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// Unsubscribe from all topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Clear references
this.subscriptions = null;
this.renderUserTable = null;
this.renderProductList = null;
