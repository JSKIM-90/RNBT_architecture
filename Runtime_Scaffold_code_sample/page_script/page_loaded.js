const { go, each, C } = fx

initPageDataPublisher.call(this);

function initPageDataPublisher() {
    this.globalDataMappings = getGlobalDataMappings();
    go(
        this.globalDataMappings,
        each((GlobalDataPublisher.registerMapping)),
        each(({ topic }) => GlobalDataPublisher.fetchAndPublish(topic, this))
    )

};

function getGlobalDataMappings() {
    return [
        {
            topic: 'users',
            datasetInfo: {
                datasetName: 'dummyjson',
                param: { dataType: 'users', id: 'default' },
            },
        },
        {
            topic: 'comments',
            datasetInfo: {
                datasetName: 'dummyjson',
                param: { dataType: 'comments', id: 'default' },
            },
        },
    ];
};



