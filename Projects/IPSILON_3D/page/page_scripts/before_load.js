/*
 * Page - before_load
 * IPSILON_3D Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup 3D raycasting
 * - Handle sensor click -> fetch data (parallel) -> show popup
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

        const sensorId = targetInstance.id;

        // 3개 API 병렬 호출
        const [sensorResult, historyResult, alertsResult] = await Promise.all([
            fetchData(this, 'sensor', { id: sensorId }),
            fetchData(this, 'sensorHistory', { id: sensorId }),
            fetchData(this, 'sensorAlerts', { id: sensorId })
        ]);

        const sensor = sensorResult?.response?.data;
        const history = historyResult?.response?.data;
        const alerts = alertsResult?.response?.data;

        if (sensor && history) {
            const iter = makeIterator(this);
            const popup = getInstanceByName('SensorDetailPopup', iter);

            if (popup) {
                popup.showDetail(sensor, history, alerts);
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

        // history만 다시 조회
        const historyResult = await fetchData(this, 'sensorHistory', { id: sensorId, period });
        const history = historyResult?.response?.data;

        if (history) {
            targetInstance.updateChart(history);
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

        // sensor + history 다시 조회 (alerts는 선택적)
        const [sensorResult, historyResult] = await Promise.all([
            fetchData(this, 'sensor', { id: sensorId }),
            fetchData(this, 'sensorHistory', { id: sensorId })
        ]);

        // Remove loading state
        if (refreshBtn) refreshBtn.classList.remove('loading');

        const sensor = sensorResult?.response?.data;
        const history = historyResult?.response?.data;

        if (sensor && history) {
            targetInstance.updateSensor(sensor);
            targetInstance.updateChart(history);
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
