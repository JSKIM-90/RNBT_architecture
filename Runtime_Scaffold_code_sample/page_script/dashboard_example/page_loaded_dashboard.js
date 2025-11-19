/* Pattern: Page - loaded (Dashboard with Auto-Refresh) */

const { each } = fx;

// Define global data mappings with refresh intervals
this.globalDataMappings = [
    {
        topic: 'users',
        refreshInterval: 30000,  // 30 seconds (slower changing data)
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', limit: 20 }
        }
    },
    {
        topic: 'sales',
        refreshInterval: 3000,   // 3 seconds (real-time critical data)
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', metric: 'revenue' }
        }
    }
];

// Register mappings
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping)
);

// Current param state (for dynamic filtering)
// Initialize empty params for each topic
this.currentParams = {};
fx.go(
    this.globalDataMappings,
    each(({ topic }) => {
        this.currentParams[topic] = {};
    })
);

// Initial fetch
fx.go(
    this.globalDataMappings,
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// Helper: Start all intervals (each topic has its own interval)
this.startAllIntervals = () => {
    this.refreshIntervals = {};
    fx.go(
        this.globalDataMappings,
        each(({ topic, refreshInterval = 5000 }) => {
            this.refreshIntervals[topic] = setInterval(() => {
                GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
            }, refreshInterval);
        })
    );
};

// Helper: Stop all intervals
this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals),
        each(interval => clearInterval(interval))
    );
};

// Start auto-refresh for all topics
this.startAllIntervals();
