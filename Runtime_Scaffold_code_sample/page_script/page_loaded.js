/* Pattern: Page - loaded (EventBus Handlers & Raycasting) */

const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    '@buttonClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Button clicked:', event, targetInstance);
    },

    '@linkClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Link clicked:', event, targetInstance);
    },

    '@3dObjectClicked': async ({ event, targetInstance }) => {
        // Primitive composition for data fetching
        const { dataMapping } = targetInstance;

        if (dataMapping?.length) {
            const { datasetName, param } = dataMapping[0].datasetInfo;
            const data = await fetchData(this, datasetName, param);
            console.log('[Page] 3D Object clicked - Data:', data);
        }
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// Setup Three.js raycasting (for 3D events)
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
