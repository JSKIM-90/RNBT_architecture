/*
 * SensorDetailPopup - register.js
 *
 * Methods exposed to Page:
 * - showDetail(sensor, history, alerts)  // 팝업 열기
 * - hideDetail()                         // 팝업 닫기
 * - updateSensor(sensor)                 // 센서 정보만 갱신
 * - updateChart(history)                 // 차트만 갱신
 * - updateAlerts(alerts)                 // 알림만 갱신
 *
 * Events:
 * - @popupClosed
 * - @refreshDetailClicked
 * - @periodChanged (period)
 * - @configureClicked (sensorId)
 */

const { bindEvents } = WKit;

initComponent.call(this);

function initComponent() {
    // Event binding schema
    this.customEvents = {
        click: {
            '[data-action="close"]': '@popupClosed',
            '[data-action="refresh"]': '@refreshDetailClicked',
            '.chart-btn[data-period]': '@periodChanged',
            '[data-action="configure"]': '@configureClicked'
        }
    };

    // Chart instance
    this.chart = null;
    this.currentSensor = null;

    // Bind methods (exposed to Page)
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);
    this.updateSensor = updateSensor.bind(this);
    this.updateChart = updateChart.bind(this);
    this.updateAlerts = updateAlerts.bind(this);

    // Setup
    bindEvents(this, this.customEvents);

    // ResizeObserver for chart
    const chartContainer = this.element.querySelector('.chart-container');
    this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
            this.chart.resize();
        }
    });
    this.resizeObserver.observe(chartContainer);

    console.log('[SensorDetailPopup] Registered');
}

// ======================
// PUBLIC METHODS
// ======================

function showDetail(sensor, history, alerts) {
    const overlay = this.element.querySelector('.popup-overlay');

    // 센서 정보 렌더링
    updateSensor.call(this, sensor);

    // 차트 렌더링
    if (history) {
        updateChart.call(this, history);
    }

    // 알림 렌더링
    updateAlerts.call(this, alerts);

    // Show popup
    overlay.style.display = 'flex';

    console.log('[SensorDetailPopup] Showing detail for:', sensor.id);
}

function hideDetail() {
    const overlay = this.element.querySelector('.popup-overlay');
    overlay.style.display = 'none';
    this.currentSensor = null;

    console.log('[SensorDetailPopup] Hidden');
}

function updateSensor(sensor) {
    if (!sensor) return;

    this.currentSensor = sensor;

    this.element.querySelector('.popup-title').textContent = sensor.name;
    this.element.querySelector('.popup-zone').textContent = sensor.zone;
    this.element.querySelector('.current-temp').textContent = sensor.temperature.toFixed(1);
    this.element.querySelector('.temp-unit').textContent = '\u00B0C';
    this.element.querySelector('.current-humidity').textContent = sensor.humidity;
    this.element.querySelector('.threshold-warning-val').textContent = `${sensor.threshold.warning}\u00B0C`;
    this.element.querySelector('.threshold-critical-val').textContent = `${sensor.threshold.critical}\u00B0C`;

    const badge = this.element.querySelector('.status-badge-large');
    badge.textContent = sensor.status;
    badge.dataset.status = sensor.status;

    this.element.querySelector('.detail-last-updated').textContent = formatTime(sensor.lastUpdated);
}

function updateChart(history) {
    if (!history) return;

    const chartContainer = this.element.querySelector('.chart-container');

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
    const alertList = this.element.querySelector('.alert-list');
    const template = this.element.querySelector('#alert-item-template');

    const alerts = alertsData?.alerts || [];

    if (alerts.length === 0) {
        alertList.innerHTML = '<div class="no-alerts">No recent alerts</div>';
        return;
    }

    alertList.innerHTML = '';

    fx.go(
        alerts,
        fx.each(alert => {
            const item = template.content.cloneNode(true);
            const itemEl = item.querySelector('.alert-item');

            itemEl.dataset.severity = alert.severity;
            item.querySelector('.alert-icon').textContent = alert.severity === 'critical' ? '\u26A0\uFE0F' : '\u26A1';
            item.querySelector('.alert-message').textContent = alert.message;
            item.querySelector('.alert-time').textContent = formatTime(alert.timestamp);

            alertList.appendChild(item);
        })
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
