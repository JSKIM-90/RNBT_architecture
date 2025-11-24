const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Unsubscribe from all topics
    clearSubscribe(this);

    // Remove event listeners
    removeCustomEvents(this, this.customEvents);

    // Clear references
    this.subscriptions = null;
    this.customEvents = null;
    this.renderTable = null;
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        each(([topic, _]) => unsubscribe(topic, instance))
    );
}
