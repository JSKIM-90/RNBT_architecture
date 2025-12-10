/*
 * Page - before_load
 * IPSILON Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Handle sensor click -> show popup
 * - Handle popup events
 */

const { onEventBusHandlers, fetchData, getInstanceByName, makeIterator } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // TemperatureSensor: Sensor card clicked
    '@sensorClicked': async ({ event, targetInstance }) => {
        const card = event.target.closest('.sensor-card');
        if (!card) return;

        const sensorId = card.dataset.sensorId;
        console.log('[Page] Sensor clicked:', sensorId);

        // Fetch sensor detail with history
        const response = await fetchData(this, 'sensorDetail', { id: sensorId });

        if (response?.data) {
            const { sensor, history } = response.data;

            // Get popup instance and show detail
            const iter = makeIterator(this);
            const popup = getInstanceByName('SensorDetailPopup', iter);

            if (popup) {
                popup.showDetail(sensor, history);
            }
        }
    },

    // SensorDetailPopup: Close button clicked
    '@popupClosed': ({ targetInstance }) => {
        targetInstance.hideDetail();
        console.log('[Page] Popup closed');
    },

    // SensorDetailPopup: Period changed (24h, 7d, 30d)
    '@periodChanged': async ({ event, targetInstance }) => {
        const btn = event.target.closest('.chart-btn');
        if (!btn) return;

        const period = btn.dataset.period;
        const sensorId = targetInstance.currentSensor?.id;

        if (!sensorId) return;

        console.log('[Page] Period changed:', period);

        // Update active button
        targetInstance.element.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Fetch new history data
        const response = await fetchData(this, 'sensorDetail', { id: sensorId, period });

        if (response?.data?.history) {
            // Re-render chart with new data
            targetInstance.showDetail(targetInstance.currentSensor, response.data.history);
        }
    },

    // SensorDetailPopup: Configure threshold clicked
    '@configureClicked': ({ targetInstance }) => {
        const sensorId = targetInstance.currentSensor?.id;
        console.log('[Page] Configure threshold for:', sensorId);
        // TODO: Open threshold configuration modal
        alert(`Configure threshold for ${sensorId}\n(Feature not implemented)`);
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - event handlers ready');
