const { go, each } = fx;
const { offEventBusHandlers } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    stopAllIntervals.call(this);
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearThreeRaycasting.call(this);
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

// ======================
// THREE.JS RAYCASTING CLEANUP
// ======================

function clearThreeRaycasting() {
    const canvas = this.element.querySelector('canvas');

    if (canvas && this.raycastingEvents) {
        go(
            this.raycastingEvents,
            each(({ type, handler }) => {
                canvas.removeEventListener(type, handler);
            })
        );
        this.raycastingEvents = null;
    }
}
