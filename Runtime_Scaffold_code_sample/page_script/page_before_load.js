/* Pattern: Page - before_load (EventBus Handlers & Raycasting) */

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
        const { datasetInfo } = targetInstance;

        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;
            const data = await fetchData(this, datasetName, param);
            console.log('[Page] 3D Object clicked - Data:', data);
        }
    },

    // Example: Refresh data with updated params
    '@refreshUsers': async ({ limit }) => {
        GlobalDataPublisher.fetchAndPublish('users', this, { limit });
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// Setup Three.js raycasting (for 3D events)
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
