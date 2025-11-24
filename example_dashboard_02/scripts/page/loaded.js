const { each } = fx;

// Define global data mappings
this.globalDataMappings = [
    {
        topic: 'salesData',
        datasetInfo: {
            datasetName: 'dummyjson',
            param: {
                endpoint: 'products',
                limit: 30
            }
        }
    }
];

// Register and fetch data for all topics
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
);
