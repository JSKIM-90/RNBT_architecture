/*
 * Page - before_load
 * IPSILON_3D Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup 3D raycasting
 * - Handle sensor click -> fetch detail -> show popup
 */

const { onEventBusHandlers, initThreeRaycasting, fetchData, getInstanceByName, makeIterator, withSelector } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // 3D TemperatureSensor: 센서 클릭
    '@sensorClicked': async ({ event, targetInstance }) => {
        console.log('[Page] 3D Sensor clicked:', targetInstance.id);
        console.log('[Page] Intersected object:', event.intersects[0]?.object);

        const { datasetInfo } = targetInstance;
        if (!datasetInfo) return;

        const { datasetName, param } = datasetInfo;
        const result = await fetchData(this, datasetName, param);
        const { data } = result?.response || {};

        if (data) {
            const { sensor, history } = data;

            // Get popup instance and show detail
            const iter = makeIterator(this);
            const popup = getInstanceByName('SensorDetailPopup', iter);

            if (popup) {
                popup.showDetail(sensor, history);
            }
        }
    },

    // SensorDetailPopup: 닫기 버튼 클릭
    '@popupClosed': ({ targetInstance }) => {
        targetInstance.hideDetail();
        console.log('[Page] Popup closed');
    },

    // SensorDetailPopup: 기간 변경 (24h, 7d, 30d)
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
        const result = await fetchData(this, 'sensorDetail', { id: sensorId, period });
        const { data } = result?.response || {};

        if (data?.history) {
            targetInstance.showDetail(targetInstance.currentSensor, data.history);
        }
    },

    // SensorDetailPopup: 새로고침 버튼 클릭
    '@refreshDetailClicked': async ({ event, targetInstance }) => {
        const sensorId = targetInstance.currentSensor?.id;
        if (!sensorId) return;

        console.log('[Page] Refresh detail:', sensorId);

        // Show loading state
        const refreshBtn = event.target.closest('.popup-refresh');
        if (refreshBtn) refreshBtn.classList.add('loading');

        // Fetch latest data
        const result = await fetchData(this, 'sensorDetail', { id: sensorId });
        const { data } = result?.response || {};

        // Remove loading state
        if (refreshBtn) refreshBtn.classList.remove('loading');

        if (data) {
            const { sensor, history } = data;
            targetInstance.showDetail(sensor, history);
        }
    },

    // SensorDetailPopup: Threshold 설정 클릭
    '@configureClicked': ({ targetInstance }) => {
        const sensorId = targetInstance.currentSensor?.id;
        console.log('[Page] Configure threshold for:', sensorId);
        alert(`Configure threshold for ${sensorId}\n(Feature not implemented)`);
    }
};

onEventBusHandlers(this.eventBusHandlers);

// ======================
// 3D RAYCASTING SETUP
// ======================

this.raycastingEvents = withSelector(this.element, 'canvas', canvas =>
    fx.go(
        [{ type: 'click' }],
        fx.map(event => ({
            ...event,
            handler: initThreeRaycasting(canvas, event.type)
        }))
    )
);

console.log('[Page] before_load - event handlers & raycasting ready');
