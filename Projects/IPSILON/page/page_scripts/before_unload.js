/*
 * Page - before_unload
 * IPSILON Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Stop all intervals
 * - Clear event bus handlers
 * - Unregister data mappings
 */

const { go, each, map } = fx;
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
        map(({ topic }) => topic),
        each(GlobalDataPublisher.unregisterMapping)
    );

    this.globalDataMappings = null;
    this.currentParams = null;
}

console.log('[Page] before_unload - cleanup completed');
