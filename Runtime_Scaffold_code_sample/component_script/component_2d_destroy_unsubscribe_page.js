const { unsubscribe } = GlobalDataPublisher;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    clearSubscribe(this);
};

function clearSubscribe(instance) {
    go(
        Object.entries(instance.subscriptions),
        each(([topic, _]) => unsubscribe(topic, instance))
    );
}