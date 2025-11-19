const { onEventBusHandlers, initThreeRaycasting, fetchData } = WKit;

initPageController.call(this);

function initPageController() {
    this.eventBusHandlers = getEventBusHandlers.call(this);
    onEventBusHandlers.call(this, this.eventBusHandlers);

    this.raycastingEventType = 'click';
    this.raycastingEventHandler = initThreeRaycasting(this.element, this.raycastingEventType);
};

function getEventBusHandlers() {
    return {
        ['@myClickEvent']: async ({ event, targetInstance }) => {
            // primitive 조합으로 데이터 fetch
            const { dataMapping } = targetInstance;
            let data = null;

            if (dataMapping?.length) {
                const { datasetName, param } = dataMapping[0].datasetInfo;
                data = await fetchData(this, datasetName, param);
            }

            console.log('[@myClickEvent]', event);
            console.log('[@targetInstance]', targetInstance);
            console.log('[@Fetched Data]', data);
        }
    }
};

