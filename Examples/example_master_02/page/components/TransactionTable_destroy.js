/*
 * Page - TransactionTable Component - destroy
 * Card Company Dashboard
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// Unsubscribe from topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);

// Remove event listeners
removeCustomEvents(this, this.customEvents);

// Destroy Tabulator instance
if (this.tableInstance) {
    this.tableInstance.destroy();
    this.tableInstance = null;
}

console.log('[TransactionTable] destroy - cleanup completed');
