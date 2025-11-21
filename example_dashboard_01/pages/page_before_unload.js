/* Page Lifecycle: before_unload
 * Purpose: Cleanup all page resources (intervals, event bus, data publisher, Three.js)
 */

const { go, each } = fx;
const { offEventBusHandlers, disposeAllThreeResources } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    stopAllIntervals.call(this);
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearThree.call(this);
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

// ======================
// THREE.JS CLEANUP
// ======================

function clearThree() {
    const canvas = this.element.querySelector('canvas');
    if (!canvas) return;

    // Raycasting event cleanup
    if (this.raycastingEvents) {
        go(
            this.raycastingEvents,
            each(({ type, handler }) => canvas.removeEventListener(type, handler))
        );
        this.raycastingEvents = null;
    }

    // Dispose all 3D resources (components + scene background)
    disposeAllThreeResources(this);

    console.log('[Page] Three.js resources cleaned up');
}
