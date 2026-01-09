/*
 * Page - InstitutionDelayTop5 Component - beforeDestroy
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

console.log('[InstitutionDelayTop5] destroy - cleanup completed');