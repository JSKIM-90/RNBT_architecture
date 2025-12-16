/*
 * TemperatureSensor - destroy.js
 *
 * ShadowPopupMixin의 destroyPopup() 호출로 리소스 정리
 */

const { remove3DEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Shadow DOM 팝업 정리 (믹스인 메서드)
    // - 이벤트 리스너 제거
    // - ResizeObserver 해제
    // - ECharts dispose
    // - DOM 제거
    this.destroyPopup();

    // 3D 이벤트 정리
    remove3DEvents(this, this.customEvents);

    console.log('[TemperatureSensor 3D] Destroyed:', this.id);
}
