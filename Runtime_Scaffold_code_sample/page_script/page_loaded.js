/* Pattern: Page - loaded (GlobalDataPublisher Setup) */

const { each } = fx;

// Define global data mappings
this.globalDataMappings = [
    {
        topic: 'users',
        datasetInfo: {
            datasetName: 'myapi',
            param: { dataType: 'users', limit: 20 }
        }
    },
    {
        topic: 'products',
        datasetInfo: {
            datasetName: 'myapi',
            param: { dataType: 'products', category: 'all' }
        }
    }
];

// Register and fetch data for all topics
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// Advanced: Dynamic param updates
// fetchAndPublish(topic, this, { limit: 50 });  // Merges with registered param

// Note: This is a basic example showing the core pattern.
// For auto-refresh dashboards with per-dataset intervals and dynamic filter handling,
// see the complete implementation: page_script/dashboard_example/
