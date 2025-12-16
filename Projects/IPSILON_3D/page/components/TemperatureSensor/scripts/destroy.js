/*
 * TemperatureSensor - destroy.js
 */

const { remove3DEvents } = WKit;

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Shadow DOM 팝업 정리
    this.destroyPopup();

    // 3D 이벤트 정리
    remove3DEvents(this, this.customEvents);

    console.log('[TemperatureSensor] Destroyed:', this.id);
}
