/*
 * Page - InstitutionDelayTop5Tabulator Component - beforeDestroy
 */

const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Destroy Tabulator instance
if (this.tableInstance) {
    this.tableInstance.destroy();
    this.tableInstance = null;
}

console.log('[InstitutionDelayTop5Tabulator] destroy - cleanup completed');
