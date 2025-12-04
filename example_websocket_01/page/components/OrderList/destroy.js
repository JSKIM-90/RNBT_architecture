const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // 1. 구독 해제
    fx.go(
        Object.keys(this.subscriptions),
        fx.each(topic => unsubscribe(topic, this))
    );
    this.subscriptions = null;

    // 2. 이벤트 제거
    removeCustomEvents(this, this.customEvents);
    this.customEvents = null;

    // 3. 데이터 정리
    this.orders = null;
}
