/* Page Lifecycle: before_unload
 * Purpose: Cleanup all page resources (intervals, event bus, data publisher)
 */

const { go, each } = fx;
const { offEventBusHandlers } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    stopAllIntervals.call(this);
    clearEventBus.call(this);
    clearDataPublisher.call(this);
}

// ======================
// INTERVAL CLEANUP
// ======================

function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();
    }
    this.refreshIntervals = null;
    console.log('[Page] Intervals cleaned up');
}

// ======================
// EVENT BUS CLEANUP
// ======================

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
    console.log('[Page] Event bus cleaned up');
}

// ======================
// DATA PUBLISHER CLEANUP
// ======================

function clearDataPublisher() {
    go(
        this.globalDataMappings,
        each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
    );

    this.globalDataMappings = null;
    this.currentParams = null;
    console.log('[Page] Data publisher cleaned up');
}
