/*
 * Master - common_component - destroy
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

console.log('[Master/common_component] destroy - cleanup completed');
