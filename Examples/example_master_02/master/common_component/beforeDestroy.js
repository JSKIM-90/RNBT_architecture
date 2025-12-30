/*
 * Master - common_component - beforeDestroy
 * Card Company Dashboard
 * Role: Acts as page before_unload (since Master's page script doesn't work)
 *
 * Responsibilities:
 * - Stop all intervals
 * - Clear event bus handlers
 * - Unregister data mappings
 */

const { go, each } = fx;
const { offEventBusHandlers } = WKit;

onMasterUnLoad.call(this);

function onMasterUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    stopAllIntervals.call(this);
}

// ======================
// EVENT BUS CLEANUP
// ======================

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
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
}

// ======================
// INTERVAL CLEANUP
// ======================

function stopAllIntervals() {
    if (this.stopAllIntervals) {
        this.stopAllIntervals();
    }
    this.refreshIntervals = null;
}

console.log('[Master/common_component] destroy - cleanup completed');
