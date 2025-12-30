/*
 * ServerIcon Component - beforeDestroy
 * Unsubscribes from: serverStatus
 */

const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    clearSubscribe(this);
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        each(([topic, _]) => unsubscribe(topic, instance))
    );
}
