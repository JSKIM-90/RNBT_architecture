/*
 * Page - TransactionTable Component - beforeDestroy
 * Card Company Dashboard
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
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
// EVENT CLEANUP
// ======================

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// ======================
// TABULATOR CLEANUP
// ======================

if (this.tableInstance) {
    this.tableInstance.destroy();
    this.tableInstance = null;
}

// ======================
// HANDLER CLEANUP
// ======================

this.renderTransactions = null;
this.getPageParams = null;
this.updatePaginationUI = null;
this.goToPage = null;
this.pageState = null;

console.log('[TransactionTable] destroy - cleanup completed');
