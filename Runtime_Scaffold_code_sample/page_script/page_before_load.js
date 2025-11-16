const { onEventBusHandlers, initThreeRaycasting, pipeForDataMapping } = WKit;

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
            const dataFromMapping = await pipeForDataMapping(targetInstance);
            console.log('[@myClickEvent]', event);
            console.log('[@targetInstance]', targetInstance)
            console.log('[@Data From Mapping]', dataFromMapping)
        }
    }
};

