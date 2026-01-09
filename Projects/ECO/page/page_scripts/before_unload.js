/*
 * Page - before_unload
 * ECO (Energy & Cooling Operations) Dashboard
 *
 * Responsibilities:
 * - Clear event bus handlers
 * - Clear data publisher mappings
 * - Clear 3D raycasting
 * - Dispose all 3D resources
 */

const { offEventBusHandlers, disposeAllThreeResources, withSelector } = Wkit;
const { go, each, map } = fx;

onPageUnLoad.call(this);

function onPageUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearRaycasting.call(this);
    clearThreeResources.call(this);
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

    if (this.stopAllIntervals) {
        this.stopAllIntervals();
    }
    this.refreshIntervals = null;
}

// ======================
// 3D RAYCASTING CLEANUP
// ======================

function clearRaycasting() {
    withSelector(this.appendElement, 'canvas', canvas => {
        // mousedown 핸들러 정리 (드래그 감지용)
        if (this.onCanvasMouseDown) {
            canvas.removeEventListener('mousedown', this.onCanvasMouseDown);
            this.onCanvasMouseDown = null;
        }

        // raycasting 핸들러 정리
        if (this.raycastingEvents) {
            go(
                this.raycastingEvents,
                each(({ type, handler }) => canvas.removeEventListener(type, handler))
            );
            this.raycastingEvents = null;
        }
    });
}

// ======================
// 3D RESOURCES CLEANUP
// ======================

function clearThreeResources() {
    // 모든 3D 컴포넌트 일괄 정리:
    // - subscriptions 해제
    // - customEvents, datasetInfo 참조 제거
    // - geometry, material, texture dispose
    // - Scene background 정리
    disposeAllThreeResources(this);
}

console.log('[Page] before_unload - ECO Dashboard cleanup completed');
