/*
 * Master - Header Component - destroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Remove event listeners
removeCustomEvents(this, this.customEvents);

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

console.log('[Header] destroy - cleanup completed');
