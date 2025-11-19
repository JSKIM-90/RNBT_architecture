/* Pattern: Page - before_load (Dashboard with Dynamic Filters) */

const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    // Period filter changed (applies to all topics)
    '@periodFilterChanged': ({ period }) => {
        console.log('[Dashboard] Period filter changed:', period);

        // 1. Stop interval
        clearInterval(this.refreshInterval);

        // 2. Update params & fetch immediately
        fx.go(
            this.globalDataMappings,
            each(({ topic }) => {
                this.currentParams[topic] = { ...this.currentParams[topic], period };
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic]);
            })
        );

        // 3. Restart interval
        this.refreshInterval = setInterval(() => {
            fx.go(
                this.globalDataMappings,
                each(({ topic }) => {
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                })
            );
        }, 5000);
    },

    // User-specific filter (limit changed)
    '@userLimitChanged': ({ limit }) => {
        console.log('[Dashboard] User limit changed:', limit);

        // 1. Stop interval
        clearInterval(this.refreshInterval);

        // 2. Update only users param & fetch immediately
        this.currentParams.users = { ...this.currentParams.users, limit };
        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);

        // 3. Restart interval
        this.refreshInterval = setInterval(() => {
            fx.go(
                this.globalDataMappings,
                each(({ topic }) => {
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                })
            );
        }, 5000);
    },

    // Sales-specific filter (metric changed)
    '@salesMetricChanged': ({ metric }) => {
        console.log('[Dashboard] Sales metric changed:', metric);

        // 1. Stop interval
        clearInterval(this.refreshInterval);

        // 2. Update only sales param & fetch immediately
        this.currentParams.sales = { ...this.currentParams.sales, metric };
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);

        // 3. Restart interval
        this.refreshInterval = setInterval(() => {
            fx.go(
                this.globalDataMappings,
                each(({ topic }) => {
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                })
            );
        }, 5000);
    },

    // Refresh all data manually
    '@refreshAllData': () => {
        console.log('[Dashboard] Manual refresh triggered');

        // 1. Stop interval
        clearInterval(this.refreshInterval);

        // 2. Fetch all topics immediately
        fx.go(
            this.globalDataMappings,
            each(({ topic }) => {
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
            })
        );

        // 3. Restart interval
        this.refreshInterval = setInterval(() => {
            fx.go(
                this.globalDataMappings,
                each(({ topic }) => {
                    GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
                })
            );
        }, 5000);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// Setup Three.js raycasting if needed
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
