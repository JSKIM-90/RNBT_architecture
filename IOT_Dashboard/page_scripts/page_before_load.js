const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

// Define event handlers that will respond to component events
// Add your custom event handlers here
this.eventBusHandlers = {
    // Sample: Sensor clicked event
    // This demonstrates the primitive composition pattern
    '@sensorClicked': async ({ event, targetInstance }) => {
        console.log('[Page] Sensor clicked:', targetInstance);

        // Primitive composition: Extract datasetInfo from component
        const { datasetInfo } = targetInstance;

        if (datasetInfo) {
            const { datasetName, param } = datasetInfo;

            // Use WKit primitive to fetch data
            const data = await fetchData(this, datasetName, param);
            console.log('[Page] Sensor data fetched:', data);

            // TODO: Process the fetched data
            // Example: Show detail panel, update chart, etc.
        }
    },

    // ============================================================
    // PARAM UPDATE PATTERNS (No stop/start needed!)
    // ============================================================

    // Pattern 1: Specific topic filter (zone selection)
    '@zoneFilterChanged': ({ event }) => {
        const zone = event.target.value;

        // Update only sensorData topic
        this.currentParams['sensorData'] = {
            ...this.currentParams['sensorData'],
            zone
        };

        // Immediate fetch - user sees new data right away
        GlobalDataPublisher.fetchAndPublish('sensorData', this, this.currentParams['sensorData']);

        // Interval continues automatically with updated param
    },

    // Pattern 2: Global filter affecting all topics (period/time range)
    '@periodFilterChanged': ({ event }) => {
        const period = event.target.value;  // '24h', '7d', '30d'

        fx.go(
            this.globalDataMappings,
            fx.each(({ topic }) => {
                // Update all topics with new period
                this.currentParams[topic] = {
                    ...this.currentParams[topic],
                    period
                };

                // Immediate fetch for all topics
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
            })
        );

        // All intervals continue with updated params
    },

    // Add more event handlers as needed
    // Example: Multiple params
    '@dateRangeChanged': ({ event }) => {
        const { startDate, endDate } = event.target.dataset;
        this.currentParams['trends'] = {
            ...this.currentParams['trends'],
            startDate,
            endDate
        };
        GlobalDataPublisher.fetchAndPublish('trends', this, this.currentParams['trends']);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// ======================
// THREE.JS RAYCASTING (Optional - for 3D components)
// ======================

// Uncomment if your dashboard uses 3D components
// this.raycastingEventType = 'click';
// this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
