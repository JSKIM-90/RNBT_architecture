/*
 * TemperatureSensor - destroy.js
 *
 * 1:1 정리 원칙:
 * - register.js에서 생성한 모든 리소스 정리
 * - popupHost 제거 시 Shadow DOM 내부도 함께 제거됨
 */

const { remove3DEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // ResizeObserver 정리
    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }

    // ECharts 정리
    if (this.chart) {
        this.chart.dispose();
        this.chart = null;
    }

    // Shadow DOM 팝업 제거 (DOM에서 제거하면 내부 이벤트도 함께 정리됨)
    if (this.popupHost) {
        this.popupHost.remove();
        this.popupHost = null;
        this.shadowRoot = null;
    }

    // 3D 이벤트 정리
    remove3DEvents(this, this.customEvents);

    // 상태 초기화
    this.currentSensor = null;

    console.log('[TemperatureSensor 3D] Destroyed:', this.id);
}
