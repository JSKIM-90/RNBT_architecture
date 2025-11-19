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
this.currentParams = {
    users: {},
    sales: {}
};

// Initial fetch
fx.go(
    this.globalDataMappings,
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);

// Auto-refresh every 5 seconds
this.refreshInterval = setInterval(() => {
    GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
    GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
}, 5000);

// Note: Event handlers for filter changes should be in page_before_load.js
// Example:
// '@periodFilterChanged': ({ period }) => {
//     this.currentParams.users = { period };
//     this.currentParams.sales = { period };
//     GlobalDataPublisher.fetchAndPublish('users', this, this.currentParams.users);
//     GlobalDataPublisher.fetchAndPublish('sales', this, this.currentParams.sales);
// }
