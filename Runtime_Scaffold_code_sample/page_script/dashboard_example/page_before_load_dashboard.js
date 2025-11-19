/* Pattern: Page - before_load (Dashboard with Dynamic Filters) */

const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

// Setup event bus handlers
this.eventBusHandlers = {
    // Period filter changed (applies to all topics)
    '@periodFilterChanged': ({ period }) => {
        console.log('[Dashboard] Period filter changed:', period);

        // Update current params for all topics
        this.currentParams.users = { ...this.currentParams.users, period };
        this.currentParams.sales = { ...this.currentParams.sales, period };

        // Fetch immediately with updated params
        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);

        // Interval will continue using updated currentParams
    },

    // User-specific filter (limit changed)
    '@userLimitChanged': ({ limit }) => {
        console.log('[Dashboard] User limit changed:', limit);

        // Update only users param
        this.currentParams.users = { ...this.currentParams.users, limit };

        // Fetch immediately
        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
    },

    // Sales-specific filter (metric changed)
    '@salesMetricChanged': ({ metric }) => {
        console.log('[Dashboard] Sales metric changed:', metric);

        // Update only sales param
        this.currentParams.sales = { ...this.currentParams.sales, metric };

        // Fetch immediately
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
    },

    // Refresh all data manually
    '@refreshAllData': () => {
        console.log('[Dashboard] Manual refresh triggered');

        GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
        GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

// Setup Three.js raycasting if needed
this.raycastingEventType = 'click';
this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
