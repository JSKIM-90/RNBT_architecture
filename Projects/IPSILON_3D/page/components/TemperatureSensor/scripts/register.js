/*
 * TemperatureSensor - Self-Contained 3D Component
 *
 * ShadowPopupMixin을 사용한 자기 완결 컴포넌트 예제
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의
 * 2. customEvents - 이벤트 발행
 * 3. ShadowPopupMixin - 팝업 관리
 * 4. Public Methods - Page에서 호출
 */

const { bind3DEvents, fetchData } = WKit;
const { applyShadowPopupMixin } = ShadowPopupMixin;

initComponent.call(this);

function initComponent() {
    // ======================
    // 1. 데이터 정의
    // ======================
    this.datasetInfo = [
        { datasetName: 'sensor', param: { id: this.id } }
    ];

    // ======================
    // 2. 이벤트 발행
    // ======================
    this.customEvents = {
        click: '@sensorClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // 3. Shadow DOM 팝업 믹스인 적용
    // ======================
    applyShadowPopupMixin(this, {
        getHTML: getPopupHTML,
        getStyles: getPopupStyles,
        onCreated: onPopupCreated
    });

    // ======================
    // 4. Public Methods
    // ======================
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);

    console.log('[TemperatureSensor] Registered:', this.id);
}

// ======================
// PUBLIC METHODS
// ======================

async function showDetail() {
    // 데이터 조회
    const result = await fetchData(this.page, 'sensor', { id: this.id });
    const sensor = result?.response?.data;

    if (!sensor) return;

    // 팝업 표시 + 데이터 렌더링
    this.showPopup();

    this.popupQuery('.sensor-name').textContent = sensor.name;
    this.popupQuery('.sensor-zone').textContent = sensor.zone;
    this.popupQuery('.sensor-temp').textContent = `${sensor.temperature.toFixed(1)}°C`;
    this.popupQuery('.sensor-humidity').textContent = `${sensor.humidity}%`;

    const statusEl = this.popupQuery('.sensor-status');
    statusEl.textContent = sensor.status;
    statusEl.dataset.status = sensor.status;
}

function hideDetail() {
    this.hidePopup();
}

// ======================
// POPUP LIFECYCLE
// ======================

function onPopupCreated() {
    this.bindPopupEvents({
        click: {
            '.close-btn': () => this.hideDetail()
        }
    });
}

// ======================
// POPUP TEMPLATE
// ======================

function getPopupHTML() {
    return `
<div class="popup-overlay">
    <div class="popup">
        <div class="popup-header">
            <span class="sensor-name"></span>
            <span class="sensor-zone"></span>
            <button class="close-btn">&times;</button>
        </div>
        <div class="popup-body">
            <div class="info-row">
                <span class="label">Temperature</span>
                <span class="sensor-temp"></span>
            </div>
            <div class="info-row">
                <span class="label">Humidity</span>
                <span class="sensor-humidity"></span>
            </div>
            <div class="info-row">
                <span class="label">Status</span>
                <span class="sensor-status"></span>
            </div>
        </div>
    </div>
</div>
    `;
}

// ======================
// POPUP STYLES
// ======================

function getPopupStyles() {
    return `
.popup-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.popup {
    width: 300px;
    background: #1e2332;
    border-radius: 12px;
    overflow: hidden;
    font-family: system-ui, sans-serif;
    color: #fff;
}

.popup-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    background: #252b3d;
    border-bottom: 1px solid #333;
}

.sensor-name {
    font-weight: 600;
    flex: 1;
}

.sensor-zone {
    font-size: 12px;
    color: #888;
    background: #1a1f2e;
    padding: 2px 8px;
    border-radius: 4px;
}

.close-btn {
    background: none;
    border: none;
    color: #888;
    font-size: 20px;
    cursor: pointer;
}

.close-btn:hover {
    color: #fff;
}

.popup-body {
    padding: 16px;
}

.info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #333;
}

.info-row:last-child {
    border-bottom: none;
}

.label {
    color: #888;
}

.sensor-status {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
}

.sensor-status[data-status="normal"] {
    background: rgba(74, 222, 128, 0.2);
    color: #4ade80;
}

.sensor-status[data-status="warning"] {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
}

.sensor-status[data-status="critical"] {
    background: rgba(248, 113, 113, 0.2);
    color: #f87171;
}
    `;
}
