/*
 * TemperatureSensor - Self-Contained 3D Component
 *
 * ShadowPopupMixin을 사용한 자기 완결 컴포넌트 예제
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의
 * 2. Data Config - API 필드 매핑
 * 3. 렌더링 함수 바인딩
 * 4. Public Methods - Page에서 호출
 * 5. customEvents - 이벤트 발행
 * 6. Popup - 오버라이드 가능 (getPopupHTML, getPopupStyles, onPopupCreated)
 */

const { bind3DEvents, fetchData } = WKit;
const { applyShadowPopupMixin } = ShadowPopupMixin;

initComponent.call(this);

function initComponent() {
    // ======================
    // 1. 데이터 정의
    // ======================
    this.datasetInfo = [
        { datasetName: 'sensor', param: { id: this.id }, render: ['renderSensorInfo'] },
        { datasetName: 'sensorHistory', param: { id: this.id }, render: ['renderChart'] }
    ];

    // ======================
    // 2. Data Config (API 필드 매핑)
    // ======================
    this.sensorConfig = [
        { key: 'name', selector: '.sensor-name' },
        { key: 'zone', selector: '.sensor-zone' },
        { key: 'temperature', selector: '.sensor-temp' },
        { key: 'humidity', selector: '.sensor-humidity' },
        { key: 'status', selector: '.sensor-status', dataset: 'status' }
    ];

    this.dataConfig = {
        xKey: 'timestamps',
        yKey: 'temperatures'
    };

    this.chartStyleConfig = {
        color: '#3b82f6',
        smooth: true,
        areaStyle: true
    };

    // ======================
    // 3. 렌더링 함수 바인딩
    // ======================
    this.renderSensorInfo = renderSensorInfo.bind(this, this.sensorConfig);
    this.renderChart = renderChart.bind(this, { ...this.dataConfig, ...this.chartStyleConfig });

    // ======================
    // 4. Public Methods
    // ======================
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);

    // ======================
    // 5. 이벤트 발행
    // ======================
    this.customEvents = {
        click: '@sensorClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // 6. Popup (오버라이드 가능)
    // ======================
    this.popupCreatedConfig = {
        chartSelector: '.chart-container',
        events: {
            click: {
                '.close-btn': () => this.hideDetail()
            }
        }
    };

    this.getPopupHTML = getPopupHTML.bind(this);
    this.getPopupStyles = getPopupStyles.bind(this);
    this.onPopupCreated = onPopupCreated.bind(this, this.popupCreatedConfig);

    applyShadowPopupMixin(this, {
        getHTML: this.getPopupHTML,
        getStyles: this.getPopupStyles,
        onCreated: this.onPopupCreated
    });

    console.log('[TemperatureSensor] Registered:', this.id);
}

// ======================
// PUBLIC METHODS
// ======================

function showDetail() {
    this.showPopup();
    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, param, render }) =>
            fx.go(
                fetchData(this.page, datasetName, param),
                result => result?.response?.data,
                data => data && render.forEach(fn => this[fn](data))
            )
        )
    );
}

function renderSensorInfo(config, data) {
    fx.go(
        config,
        fx.each(({ key, selector, dataset }) => {
            const el = this.popupQuery(selector);
            el.textContent = data[key];
            dataset && (el.dataset[dataset] = data[key]);
        })
    );
}

function renderChart(config, data) {
    const option = getLineChartOption(config, data);
    this.updateChart('.chart-container', option);
}

function hideDetail() {
    this.hidePopup();
}

// ======================
// CHART OPTION BUILDER
// ======================

function getLineChartOption(config, data) {
    const { xKey, yKey, color, smooth, areaStyle } = config;

    return {
        grid: {
            left: 40,
            right: 16,
            top: 16,
            bottom: 24
        },
        xAxis: {
            type: 'category',
            data: data[xKey],
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#888', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: '#888', fontSize: 10 },
            splitLine: { lineStyle: { color: '#333' } }
        },
        series: [{
            type: 'line',
            data: data[yKey],
            smooth: smooth,
            symbol: 'none',
            lineStyle: { color: color, width: 2 },
            areaStyle: areaStyle ? {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: hexToRgba(color, 0.3) },
                        { offset: 1, color: hexToRgba(color, 0) }
                    ]
                }
            } : null
        }]
    };
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ======================
// POPUP LIFECYCLE
// ======================

function onPopupCreated({chartSelector, events}) {
    chartSelector && this.createChart(chartSelector);
    events && this.bindPopupEvents(events)
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
            <div class="chart-section">
                <div class="chart-title">Temperature Trend</div>
                <div class="chart-container"></div>
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

.chart-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #333;
}

.chart-title {
    font-size: 12px;
    color: #888;
    margin-bottom: 8px;
}

.chart-container {
    width: 100%;
    height: 150px;
}
    `;
}
