/* Pattern: Page - loaded (Dashboard with Auto-Refresh) */

const { each } = fx;

// Define global data mappings
this.globalDataMappings = [
    {
        topic: 'users',
        datasetInfo: {
            datasetName: 'myapi',
            param: { period: 'monthly', limit: 20 }
        }
    },
    {
        topic: 'sales',
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

// Auto-refresh every 5 seconds
this.refreshInterval = setInterval(() => {
    fx.go(
        this.globalDataMappings,
        each(({ topic }) => {
            GlobalDataPublisher.fetchAndPublish(topic, this, this.currentParams[topic] || {});
        })
    );
}, 5000);
