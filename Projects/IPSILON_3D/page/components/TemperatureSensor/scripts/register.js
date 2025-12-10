/*
 * TemperatureSensor - 3D Component
 *
 * 단일 온도 센서를 나타내는 3D 컴포넌트
 *
 * Event: @sensorClicked
 * datasetInfo: sensorDetail (센서 ID로 상세 정보 조회)
 */

const { bind3DEvents } = WKit;

// ======================
// 3D EVENT BINDING
// ======================

this.customEvents = {
    click: '@sensorClicked'
};

// Data source info (클릭 시 상세 데이터 조회용)
this.datasetInfo = {
    datasetName: 'sensorDetail',
    param: {
        id: this.id
    }
};

bind3DEvents(this, this.customEvents);

console.log('[TemperatureSensor 3D] Registered:', this.id);
