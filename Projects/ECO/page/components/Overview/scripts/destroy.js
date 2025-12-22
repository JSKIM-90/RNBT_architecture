/*
 * Page - Overview Component - destroy
 * ECO 종합 현황 대시보드 컴포넌트
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
// RESIZE OBSERVER CLEANUP
// ======================

if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

// ======================
// ECHARTS CLEANUP
// ======================

if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

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

this.renderOverview = null;
this.renderEventTable = null;
this.summaryConfig = null;
this.kpiConfig = null;
this.assetTypeConfig = null;

console.log('[Overview] destroy - cleanup completed');
