/*
 * TemperatureSensor - destroy.js
 */

const { removeCustomEvents } = WKit;
const { unsubscribe } = GlobalDataPublisher;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    clearSubscribe(this);
    removeCustomEvents(this, this.customEvents);
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        fx.each(([topic, _]) => unsubscribe(topic, instance))
    );
}

console.log('[TemperatureSensor] Destroyed');
