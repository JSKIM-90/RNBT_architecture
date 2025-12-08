/*
 * Page - InstitutionDelayTop5Tabulator Component - destroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Destroy Tabulator instance
if (this.tableInstance) {
    try {
        this.tableInstance.destroy();
    } catch (e) {
        console.error('[InstitutionDelayTop5Tabulator] destroy error:', e);
    }
    this.tableInstance = null;
}

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Remove event listeners
removeCustomEvents(this, this.customEvents);

console.log('[InstitutionDelayTop5Tabulator] destroy - cleanup completed');