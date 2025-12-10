/*
 * SensorDetailPopup - destroy.js
 */

const { removeCustomEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Disconnect ResizeObserver
    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

    // Dispose ECharts
    if (this.chart) {
        this.chart.dispose();
        this.chart = null;
    }

    // Remove events
    removeCustomEvents(this, this.customEvents);

    this.currentSensor = null;
}

console.log('[SensorDetailPopup] Destroyed');
