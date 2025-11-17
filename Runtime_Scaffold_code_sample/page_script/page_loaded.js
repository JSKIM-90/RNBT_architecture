const { go, each, C } = fx

initPageDataPublisher.call(this);

function initPageDataPublisher() {
    /* 
    datasetInfo의 param이 변경될 수 있어야 함
    현재 fetchAndPublish는 한 번 DataPublisher에 등록하면 param을 변경할 수가 없음.
    호출 시점에서 고정되어야 하는 것은 맞으나, 코드 사용자 입장에서 인자를 어떻게 변경할 수 있을지 고민해야함.
    globalDataMapping를 변경할 경우 데이터 구독과 관련된 상태가 갱신 될 수 있는 방법에 대한 고민
    setter와 Reactivity를 활용해볼 것.
    */
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



