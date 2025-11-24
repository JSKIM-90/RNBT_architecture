const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Unsubscribe from all topics
    clearSubscribe(this);

    // Clear references
    this.subscriptions = null;
    this.updateStats = null;
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        each(([topic, _]) => unsubscribe(topic, instance))
    );
}
