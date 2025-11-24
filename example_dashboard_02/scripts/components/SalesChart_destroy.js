const { unsubscribe } = GlobalDataPublisher;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Dispose ECharts instance
    disposeChart(this);

    // Unsubscribe from all topics
    clearSubscribe(this);

    // Clear references
    this.subscriptions = null;
    this.renderChart = null;
}

function clearSubscribe(instance) {
    fx.go(
        Object.entries(instance.subscriptions),
        each(([topic, _]) => unsubscribe(topic, instance))
    );
}

function disposeChart(instance) {
    if (instance.chartInstance) {
        instance.chartInstance.dispose();
        instance.chartInstance = null;
    }
}
