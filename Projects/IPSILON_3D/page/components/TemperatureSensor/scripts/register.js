/*
 * TemperatureSensor - Self-Contained 3D Component
 *
 * 자기 완결 컴포넌트 패턴:
 * - 3D 모델 클릭 이벤트 처리
 * - Shadow DOM 기반 팝업 (CSS 자동 격리)
 * - 내부에서 fetchData 호출 및 차트 렌더링
 * - Page는 어떤 메서드를 호출할지만 결정
 *
 * Events:
 *   @sensorClicked - 센서 클릭 시 발행
 *
 * Methods (Page에서 호출 가능):
 *   showDetail()   - 데이터 패칭 + 팝업 표시
 *   hideDetail()   - 팝업 숨김
 *   highlight()    - 3D 모델 하이라이트 (대안 시나리오)
 *   focusCamera()  - 카메라 포커스 (대안 시나리오)
 */

const { bind3DEvents, fetchData } = WKit;

initComponent.call(this);

function initComponent() {
    // ======================
    // DATA SOURCE DEFINITIONS (복수)
    // ======================
    this.datasetInfo = [
        { datasetName: 'sensor', param: { id: this.id } },
        { datasetName: 'sensorHistory', param: { id: this.id } },
        { datasetName: 'sensorAlerts', param: { id: this.id } }
    ];

    // ======================
    // 3D EVENT BINDING
    // ======================
    this.customEvents = {
        click: '@sensorClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // INTERNAL STATE
    // ======================
    this.popupHost = null;
    this.shadowRoot = null;
    this.chart = null;
    this.currentSensor = null;
    this.resizeObserver = null;

    // ======================
    // PUBLIC METHODS (Page에서 호출)
    // ======================
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);
    this.highlight = highlight.bind(this);
    this.focusCamera = focusCamera.bind(this);

    // Internal methods
    this.createPopup = createPopup.bind(this);
    this.updateSensor = updateSensor.bind(this);
    this.updateChart = updateChart.bind(this);
    this.updateAlerts = updateAlerts.bind(this);
    this.bindPopupEvents = bindPopupEvents.bind(this);
    this.getPopupStyles = getPopupStyles.bind(this);
    this.getPopupHTML = getPopupHTML.bind(this);

    console.log('[TemperatureSensor 3D] Registered (Self-Contained):', this.id);
}

// ======================
// PUBLIC METHODS
// ======================

async function showDetail() {
    console.log('[TemperatureSensor] showDetail - fetching data for:', this.id);

    // 3개 API 병렬 호출 (컴포넌트 내부에서 직접)
    const [sensorResult, historyResult, alertsResult] = await Promise.all([
        fetchData(this.page, 'sensor', { id: this.id }),
        fetchData(this.page, 'sensorHistory', { id: this.id }),
        fetchData(this.page, 'sensorAlerts', { id: this.id })
    ]);

    const sensor = sensorResult?.response?.data;
    const history = historyResult?.response?.data;
    const alerts = alertsResult?.response?.data;

    if (!sensor) {
        console.warn('[TemperatureSensor] No sensor data received');
        return;
    }

    // Shadow DOM 팝업 생성/표시
    this.createPopup();
    this.updateSensor(sensor);
    if (history) this.updateChart(history);
    this.updateAlerts(alerts);

    this.popupHost.style.display = 'block';
    console.log('[TemperatureSensor] Detail popup shown');
}

function hideDetail() {
    if (this.popupHost) {
        this.popupHost.style.display = 'none';
    }
    this.currentSensor = null;
    console.log('[TemperatureSensor] Detail popup hidden');
}

function highlight() {
    // 대안 시나리오: 3D 모델 하이라이트
    console.log('[TemperatureSensor] Highlight:', this.id);
    // TODO: Three.js 머티리얼 변경 등
}

function focusCamera() {
    // 대안 시나리오: 카메라 포커스
    console.log('[TemperatureSensor] Focus camera on:', this.id);
    // TODO: 카메라 이동 애니메이션
}

// ======================
// POPUP CREATION (Shadow DOM)
// ======================

function createPopup() {
    if (this.popupHost) return; // 이미 생성됨

    // Shadow DOM 호스트 생성
    this.popupHost = document.createElement('div');
    this.popupHost.id = `sensor-popup-${this.id}`;
    this.shadowRoot = this.popupHost.attachShadow({ mode: 'open' });

    // Shadow DOM 내부에 스타일 + HTML 삽입
    this.shadowRoot.innerHTML = `
        <style>${this.getPopupStyles()}</style>
        ${this.getPopupHTML()}
    `;

    // 페이지 요소에 추가 (웹 빌더 컨텍스트)
    this.page.element.appendChild(this.popupHost);

    // 이벤트 바인딩
    this.bindPopupEvents();

    // ResizeObserver for chart
    const chartContainer = this.shadowRoot.querySelector('.chart-container');
    if (chartContainer) {
        this.resizeObserver = new ResizeObserver(() => {
            if (this.chart) this.chart.resize();
        });
        this.resizeObserver.observe(chartContainer);
    }

    console.log('[TemperatureSensor] Popup created with Shadow DOM');
}

function bindPopupEvents() {
    const root = this.shadowRoot;

    // 닫기 버튼
    root.querySelectorAll('[data-action="close"]').forEach(btn => {
        btn.addEventListener('click', () => this.hideDetail());
    });

    // 새로고침 버튼
    const refreshBtn = root.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.classList.add('loading');

            const [sensorResult, historyResult] = await Promise.all([
                fetchData(this.page, 'sensor', { id: this.id }),
                fetchData(this.page, 'sensorHistory', { id: this.id })
            ]);

            refreshBtn.classList.remove('loading');

            const sensor = sensorResult?.response?.data;
            const history = historyResult?.response?.data;

            if (sensor) this.updateSensor(sensor);
            if (history) this.updateChart(history);
        });
    }

    // 기간 변경 버튼 (24h, 7d, 30d)
    root.querySelectorAll('.chart-btn[data-period]').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const period = e.target.dataset.period;

            // Active 상태 변경
            root.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // 히스토리 재조회
            const historyResult = await fetchData(this.page, 'sensorHistory', {
                id: this.id,
                period
            });

            const history = historyResult?.response?.data;
            if (history) this.updateChart(history);
        });
    });

    // Configure 버튼
    const configBtn = root.querySelector('[data-action="configure"]');
    if (configBtn) {
        configBtn.addEventListener('click', () => {
            console.log('[TemperatureSensor] Configure threshold for:', this.id);
            alert(`Configure threshold for ${this.id}\n(Feature not implemented)`);
        });
    }
}

// ======================
// UPDATE METHODS
// ======================

function updateSensor(sensor) {
    if (!sensor) return;

    this.currentSensor = sensor;
    const root = this.shadowRoot;

    root.querySelector('.popup-title').textContent = sensor.name;
    root.querySelector('.popup-zone').textContent = sensor.zone;
    root.querySelector('.current-temp').textContent = sensor.temperature.toFixed(1);
    root.querySelector('.temp-unit').textContent = '\u00B0C';
    root.querySelector('.current-humidity').textContent = sensor.humidity;
    root.querySelector('.threshold-warning-val').textContent = `${sensor.threshold.warning}\u00B0C`;
    root.querySelector('.threshold-critical-val').textContent = `${sensor.threshold.critical}\u00B0C`;

    const badge = root.querySelector('.status-badge-large');
    badge.textContent = sensor.status;
    badge.dataset.status = sensor.status;

    root.querySelector('.detail-last-updated').textContent = formatTime(sensor.lastUpdated);
}

function updateChart(history) {
    if (!history) return;

    const chartContainer = this.shadowRoot.querySelector('.chart-container');

    // Initialize chart if not exists
    if (!this.chart) {
        this.chart = echarts.init(chartContainer);
    }

    const { timestamps, temperatures, thresholds } = history;

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e2332',
            borderColor: '#2d3548',
            textStyle: { color: '#e0e6ed' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '10%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: timestamps,
            axisLine: { lineStyle: { color: '#2d3548' } },
            axisLabel: { color: '#8b95a5', fontSize: 10 }
        },
        yAxis: {
            type: 'value',
            axisLine: { lineStyle: { color: '#2d3548' } },
            axisLabel: { color: '#8b95a5', fontSize: 10 },
            splitLine: { lineStyle: { color: '#2d3548', type: 'dashed' } }
        },
        series: [
            {
                name: 'Temperature',
                type: 'line',
                data: temperatures,
                smooth: true,
                lineStyle: { color: '#3b82f6', width: 2 },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                        { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                    ])
                },
                itemStyle: { color: '#3b82f6' }
            },
            {
                name: 'Warning',
                type: 'line',
                data: timestamps.map(() => thresholds.warning),
                lineStyle: { color: '#fbbf24', width: 1, type: 'dashed' },
                itemStyle: { color: '#fbbf24' },
                symbol: 'none'
            },
            {
                name: 'Critical',
                type: 'line',
                data: timestamps.map(() => thresholds.critical),
                lineStyle: { color: '#f87171', width: 1, type: 'dashed' },
                itemStyle: { color: '#f87171' },
                symbol: 'none'
            }
        ]
    };

    this.chart.setOption(option);
}

function updateAlerts(alertsData) {
    const alertList = this.shadowRoot.querySelector('.alert-list');
    const alerts = alertsData?.alerts || [];

    if (alerts.length === 0) {
        alertList.innerHTML = '<div class="no-alerts">No recent alerts</div>';
        return;
    }

    alertList.innerHTML = fx.go(
        alerts,
        fx.map(alert => `
            <div class="alert-item" data-severity="${alert.severity}">
                <span class="alert-icon">${alert.severity === 'critical' ? '\u26A0\uFE0F' : '\u26A1'}</span>
                <div class="alert-content">
                    <span class="alert-message">${alert.message}</span>
                    <span class="alert-time">${formatTime(alert.timestamp)}</span>
                </div>
            </div>
        `),
        fx.reduce((a, b) => a + b)
    );
}

// ======================
// HELPER FUNCTIONS
// ======================

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ======================
// POPUP HTML TEMPLATE
// ======================

function getPopupHTML() {
    return `
<div class="popup-overlay">
    <div class="popup-container">
        <div class="popup-header">
            <div class="popup-title-area">
                <h3 class="popup-title"></h3>
                <span class="popup-zone"></span>
            </div>
            <div class="popup-actions">
                <button class="popup-refresh" data-action="refresh" title="Refresh">&#8635;</button>
                <button class="popup-close" data-action="close">&times;</button>
            </div>
        </div>

        <div class="popup-body">
            <!-- Current Status Section -->
            <div class="current-status-section">
                <div class="status-card temperature">
                    <div class="status-label">Temperature</div>
                    <div class="status-value">
                        <span class="current-temp"></span>
                        <span class="temp-unit"></span>
                    </div>
                    <div class="threshold-info">
                        <span class="threshold-warning">Warning: <span class="threshold-warning-val"></span></span>
                        <span class="threshold-critical">Critical: <span class="threshold-critical-val"></span></span>
                    </div>
                </div>

                <div class="status-card humidity">
                    <div class="status-label">Humidity</div>
                    <div class="status-value">
                        <span class="current-humidity"></span>
                        <span class="humidity-unit">%</span>
                    </div>
                </div>

                <div class="status-card status">
                    <div class="status-label">Status</div>
                    <div class="status-badge-large"></div>
                    <div class="last-updated-info">
                        Last updated: <span class="detail-last-updated"></span>
                    </div>
                </div>
            </div>

            <!-- History Chart Section -->
            <div class="chart-section">
                <div class="chart-header">
                    <h4 class="chart-title">Temperature History (24h)</h4>
                    <div class="chart-controls">
                        <button class="chart-btn active" data-period="24h">24h</button>
                        <button class="chart-btn" data-period="7d">7d</button>
                        <button class="chart-btn" data-period="30d">30d</button>
                    </div>
                </div>
                <div class="chart-container"></div>
            </div>

            <!-- Alert History Section -->
            <div class="alert-section">
                <h4 class="alert-title">Recent Alerts</h4>
                <div class="alert-list"></div>
            </div>
        </div>

        <div class="popup-footer">
            <button class="btn btn-secondary" data-action="close">Close</button>
            <button class="btn btn-primary" data-action="configure">Configure Threshold</button>
        </div>
    </div>
</div>
    `;
}

// ======================
// POPUP STYLES (Shadow DOM 내부 - 자동 격리)
// ======================

function getPopupStyles() {
    return `
/* Reset for Shadow DOM */
*, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

/* Overlay */
.popup-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    font-family: 'Segoe UI', sans-serif;
}

/* Container */
.popup-container {
    width: 700px;
    max-height: 90vh;
    background: #1e2332;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Header */
.popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: #252b3d;
    border-bottom: 1px solid #2d3548;
}

.popup-title-area {
    display: flex;
    align-items: center;
    gap: 12px;
}

.popup-title {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
}

.popup-zone {
    font-size: 12px;
    color: #8b95a5;
    background: #1a1f2e;
    padding: 4px 10px;
    border-radius: 4px;
}

.popup-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.popup-refresh {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #8b95a5;
    font-size: 20px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.popup-refresh:hover {
    background: #374151;
    color: #3b82f6;
}

.popup-refresh.loading {
    animation: spin 1s linear infinite;
}

.popup-close {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #8b95a5;
    font-size: 24px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
}

.popup-close:hover {
    background: #374151;
    color: #ffffff;
}

/* Body */
.popup-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
}

/* Current Status Section */
.current-status-section {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;
}

.status-card {
    background: #252b3d;
    border-radius: 12px;
    padding: 16px;
    text-align: center;
}

.status-card.temperature { border-top: 3px solid #f59e0b; }
.status-card.humidity { border-top: 3px solid #3b82f6; }
.status-card.status { border-top: 3px solid #10b981; }

.status-label {
    font-size: 12px;
    color: #8b95a5;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.status-value {
    font-size: 32px;
    font-weight: 700;
    color: #ffffff;
}

.temp-unit,
.humidity-unit {
    font-size: 18px;
    color: #8b95a5;
}

.threshold-info {
    margin-top: 8px;
    font-size: 11px;
    color: #6b7280;
    display: flex;
    justify-content: center;
    gap: 12px;
}

.threshold-warning { color: #fbbf24; }
.threshold-critical { color: #f87171; }

.status-badge-large {
    display: inline-block;
    font-size: 14px;
    font-weight: 600;
    padding: 8px 20px;
    border-radius: 20px;
    text-transform: uppercase;
}

.status-badge-large[data-status="normal"] {
    background: rgba(74, 222, 128, 0.15);
    color: #4ade80;
}

.status-badge-large[data-status="warning"] {
    background: rgba(251, 191, 36, 0.15);
    color: #fbbf24;
}

.status-badge-large[data-status="critical"] {
    background: rgba(248, 113, 113, 0.15);
    color: #f87171;
}

.last-updated-info {
    margin-top: 8px;
    font-size: 11px;
    color: #6b7280;
}

/* Chart Section */
.chart-section {
    background: #252b3d;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 24px;
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.chart-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
}

.chart-controls {
    display: flex;
    gap: 4px;
}

.chart-btn {
    padding: 6px 12px;
    font-size: 12px;
    border: none;
    background: #1a1f2e;
    color: #8b95a5;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.chart-btn:hover {
    background: #374151;
    color: #ffffff;
}

.chart-btn.active {
    background: #3b82f6;
    color: #ffffff;
}

.chart-container {
    height: 200px;
    width: 100%;
}

/* Alert Section */
.alert-section {
    background: #252b3d;
    border-radius: 12px;
    padding: 16px;
}

.alert-title {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    margin-bottom: 12px;
}

.alert-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 150px;
    overflow-y: auto;
}

.alert-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #1a1f2e;
    border-radius: 8px;
    border-left: 3px solid transparent;
}

.alert-item[data-severity="warning"] {
    border-left-color: #fbbf24;
}

.alert-item[data-severity="critical"] {
    border-left-color: #f87171;
}

.alert-icon {
    font-size: 16px;
}

.alert-content {
    flex: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.alert-message {
    font-size: 13px;
    color: #e0e6ed;
}

.alert-time {
    font-size: 11px;
    color: #6b7280;
}

.no-alerts {
    text-align: center;
    color: #6b7280;
    font-size: 13px;
    padding: 20px;
}

/* Footer */
.popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    background: #252b3d;
    border-top: 1px solid #2d3548;
}

.btn {
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary {
    background: #374151;
    color: #e0e6ed;
}

.btn-secondary:hover {
    background: #4b5563;
}

.btn-primary {
    background: #3b82f6;
    color: #ffffff;
}

.btn-primary:hover {
    background: #2563eb;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}
    `;
}
