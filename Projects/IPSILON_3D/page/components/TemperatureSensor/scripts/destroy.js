/*
 * TemperatureSensor - destroy.js
 *
 * 3D 이벤트 정리는 Page의 disposeAllThreeResources → dispose3DTree에서 자동 처리됨
 */

onInstanceUnLoad.call(this);

function onInstanceUnLoad() {
    // Shadow DOM 팝업 정리 (차트 포함)
    this.destroyPopup();

    console.log('[TemperatureSensor] Destroyed:', this.id);
}
