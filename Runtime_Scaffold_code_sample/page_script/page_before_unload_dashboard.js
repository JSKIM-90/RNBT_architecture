/* Pattern: Page - before_unload (Dashboard Cleanup) */

const { map, each } = fx;
const { makeIterator, dispose3DTree, clearSceneBackground, offEventBusHandlers } = WKit;

// 1. Clear EventBus handlers
offEventBusHandlers(this.eventBusHandlers);
this.eventBusHandlers = null;

// 2. Clear auto-refresh interval
clearInterval(this.refreshInterval);
this.refreshInterval = null;

// 3. Clear current params state
this.currentParams = null;

// 4. Unregister GlobalDataPublisher mappings
fx.go(
    this.globalDataMappings,
    map(({ topic }) => topic),
    each(GlobalDataPublisher.unregisterMapping)
);
this.globalDataMappings = null;

// 5. Dispose 3D resources (if any)
const { scene } = wemb.threeElements;

fx.go(
    makeIterator(this, 'threeLayer'),
    map(({ appendElement }) => dispose3DTree(appendElement))
);

clearSceneBackground(scene);

// 6. Remove raycasting event listener
this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
this.raycastingEventHandler = null;
this.raycastingEventType = null;
