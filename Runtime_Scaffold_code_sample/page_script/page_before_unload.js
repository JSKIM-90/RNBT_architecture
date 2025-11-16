const { go, map } = fx;
const { makeIterator, dispose3DTree, clearSceneBackground, offEventBusHandlers } = WKit;

onPageUnLoad.call(this);

function onPageUnLoad() {
    clearEventBus.call(this);
    clearDataPublisher.call(this);
    clearThreeInstances.call(this);
};

function clearEventBus() {
    offEventBusHandlers.call(this, this.eventBusHandlers);
    this.eventBusHandlers = null;
};

function clearDataPublisher() {
    go(
        this.globalDataMappings,
        map(({ topic }) => topic),
        each((GlobalDataPublisher.unregisterMapping))

    )
};

function clearThreeInstances() {
    const { scene } = wemb.threeElements;
    go(
        makeIterator(this, 'threeLayer'),
        map(({ appendElement }) => dispose3DTree(appendElement))
    )

    clearSceneBackground(scene);
    this.element.removeEventListener(this.raycastingEventType, this.raycastingEventHandler);
    this.raycastingEventHandler = null;
};

