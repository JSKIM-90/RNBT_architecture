
const { bind3DEvents } = WKit;
const { go, L } = fx;

this.customEvents = getCustomEvents();
this.dataMapping = getDataMapping.call(this);
init.call(this);

function init() {
    bind3DEvents(this, this.customEvents);
};

function getCustomEvents() {
    return {
        click: '@myClickEvent'
    };
};

function getDataMapping() {
    return [
        {
            ownerId: this.id,
            visualInstanceList: ['ComponentDataVisualizer'],
            datasetInfo: {
                datasetName: 'dummyjson',
                param: {
                    dataType: 'carts',
                    id: this.id
                }
            }
        },
    ];
};
