/*
 * Page - before_load
 * IPSILON_3D Temperature Monitoring Dashboard
 *
 * 자기 완결 컴포넌트 패턴 적용:
 * - Page는 어떤 메서드를 호출할지만 결정
 * - 데이터 패칭, 팝업 생성은 컴포넌트 내부에서 처리
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup 3D raycasting
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // 3D TemperatureSensor: 센서 클릭
    // Page는 "어떤 메서드를 호출할지"만 결정
    '@sensorClicked': ({ event, targetInstance }) => {
        console.log('[Page] 3D Sensor clicked:', targetInstance.id);
        console.log('[Page] Intersected object:', event.intersects[0]?.object);

        // 시나리오 A: 상세 팝업 표시 (기본)
        targetInstance.showDetail();

        // 시나리오 B: 하이라이트만 (대안)
        // targetInstance.highlight();

        // 시나리오 C: 카메라 포커스 (대안)
        // targetInstance.focusCamera();
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

console.log('[Page] before_load - event handlers & raycasting ready (Self-Contained Pattern)');

/*
 * ======================
 * 기존 분리 패턴 (참조용, 삭제 가능)
 * ======================
 *
 * 아래 핸들러들은 SensorDetailPopup을 별도 컴포넌트로 사용할 때 필요했던 코드입니다.
 * 자기 완결 패턴에서는 모든 로직이 TemperatureSensor 내부에 있으므로 불필요합니다.
 *
 * '@sensorClicked': async ({ event, targetInstance }) => {
 *     const sensorId = targetInstance.id;
 *     const [sensorResult, historyResult, alertsResult] = await Promise.all([
 *         fetchData(this, 'sensor', { id: sensorId }),
 *         fetchData(this, 'sensorHistory', { id: sensorId }),
 *         fetchData(this, 'sensorAlerts', { id: sensorId })
 *     ]);
 *     const popup = getInstanceByName('SensorDetailPopup', makeIterator(this));
 *     if (popup) popup.showDetail(sensor, history, alerts);
 * },
 *
 * '@popupClosed': ({ targetInstance }) => {
 *     targetInstance.hideDetail();
 * },
 *
 * '@periodChanged': async ({ event, targetInstance }) => {
 *     // 기간 변경 처리...
 * },
 *
 * '@refreshDetailClicked': async ({ event, targetInstance }) => {
 *     // 새로고침 처리...
 * },
 *
 * '@configureClicked': ({ targetInstance }) => {
 *     // 설정 처리...
 * }
 */
