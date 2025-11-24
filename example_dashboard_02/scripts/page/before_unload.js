const { go, map, each } = fx;
const { offEventBusHandlers } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
}

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
}

function clearDataPublisher() {
    go(
        this.globalDataMappings,
        map(({ topic }) => topic),
        each(GlobalDataPublisher.unregisterMapping)
    );
}
