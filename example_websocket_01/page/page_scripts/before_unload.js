const { offEventBusHandlers } = WKit;
const { closeSocket } = GlobalDataPublisher;

onPageUnLoad.call(this);

function onPageUnLoad() {
    clearEventBus.call(this);
    clearSocket.call(this);
}

function clearEventBus() {
    offEventBusHandlers(this.eventBusHandlers);
    this.eventBusHandlers = null;
}

function clearSocket() {
    fx.each(({ topic }) => closeSocket(topic), this.socketMappings);
    this.socketMappings = null;
}
