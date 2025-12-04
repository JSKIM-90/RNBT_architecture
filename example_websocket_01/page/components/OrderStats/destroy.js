const { unsubscribe } = GlobalDataPublisher;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    fx.go(
        Object.keys(this.subscriptions),
        fx.each(topic => unsubscribe(topic, this))
    );
    this.subscriptions = null;
    this.stats = null;
    this.orderMap.clear();
    this.orderMap = null;
}
