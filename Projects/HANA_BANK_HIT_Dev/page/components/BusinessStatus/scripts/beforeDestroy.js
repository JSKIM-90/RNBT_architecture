/*
 * Page - BusinessStatus Component - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = Wkit;
const { each } = fx;

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Remove event bindings
removeCustomEvents(this, this.customEvents);

console.log('[BusinessStatus] destroy - cleanup completed');
