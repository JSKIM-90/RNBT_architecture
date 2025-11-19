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
