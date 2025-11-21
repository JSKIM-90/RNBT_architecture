/* Component: SalesStats - Cleanup */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Dispose ECharts instance
    if (this.chartInstance) {
        this.chartInstance.dispose();
        this.chartInstance = null;
    }

    // Remove event listeners
    removeCustomEvents(this, this.customEvents);

    // Unsubscribe from all topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, _]) => unsubscribe(topic, this))
    );

    // Clear references
    this.subscriptions = null;
    this.customEvents = null;
    this.renderChart = null;
    this.updateTimestamp = null;
}
