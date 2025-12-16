/*
 * TemperatureSensor - Self-Contained 3D Component
 *
 * applyShadowPopupMixin을 사용한 자기 완결 컴포넌트 예제
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의
 * 2. Data Config - API 필드 매핑
 * 3. 렌더링 함수 바인딩
 * 4. Public Methods - Page에서 호출
 * 5. customEvents - 이벤트 발행
 * 6. Template Data - HTML/CSS (publishCode에서 로드)
 * 7. Popup - template 기반 Shadow DOM 팝업
 */

const { bind3DEvents, fetchData } = WKit;
const { applyShadowPopupMixin } = Mixin;

// ======================
// TEMPLATE HELPER
// ======================
function extractTemplate(htmlCode, templateId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const template = doc.querySelector(`template#${templateId}`);
    return template?.innerHTML || '';
}

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
    // 공통: 자산 기본 정보
    this.baseInfoConfig = [
        { key: 'name', selector: '.sensor-name' },
        { key: 'zone', selector: '.sensor-zone' },
        { key: 'status', selector: '.sensor-status', dataAttr: 'status' }
    ];

    // 도메인 특화: 센서 측정값
    this.sensorInfoConfig = [
        { key: 'temperature', selector: '.sensor-temp' },
        { key: 'humidity', selector: '.sensor-humidity' }
    ];

    this.chartConfig = {
        xKey: 'timestamps',
        series: [
            { yKey: 'temperatures', color: '#3b82f6', smooth: true, areaStyle: true }
        ],
        optionBuilder: getLineChartOption
    };

    // ======================
    // 3. 렌더링 함수 바인딩
    // ======================
    this.renderSensorInfo = renderSensorInfo.bind(this, [...this.baseInfoConfig, ...this.sensorInfoConfig]);
    this.renderChart = renderChart.bind(this, this.chartConfig);

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
    // 6. Template Config
    // ======================
    this.templateConfig = {
        popup: 'popup-sensor',  // 팝업용 template ID
        // tooltip: 'tooltip-info',  // 향후 확장
    };

    // ======================
    // 7. Popup (template 기반)
    // ======================
    this.popupCreatedConfig = {
        chartSelector: '.chart-container',
        events: {
            click: {
                '.close-btn': () => this.hideDetail()
            }
        }
    };

    // publishCode에서 HTML/CSS 가져오기
    const { htmlCode, cssCode } = this.properties.publishCode || {};
    this.getPopupHTML = () => extractTemplate(htmlCode || '', this.templateConfig.popup);
    this.getPopupStyles = () => cssCode || '';
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
        fx.each(({ key, selector, dataAttr }) => {
            const el = this.popupQuery(selector);
            el.textContent = data[key];
            dataAttr && (el.dataset[dataAttr] = data[key]);
        })
    );
}

function renderChart(config, data) {
    const { optionBuilder, ...chartConfig } = config;
    const option = optionBuilder(chartConfig, data);
    this.updateChart('.chart-container', option);
}

function hideDetail() {
    this.hidePopup();
}

// ======================
// CHART OPTION BUILDER
// ======================

function getLineChartOption(config, data) {
    const { xKey, series: seriesConfig } = config;

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
        series: seriesConfig.map(({ yKey, color, smooth, areaStyle }) => ({
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
        }))
    };
}

function getBarChartOption(config, data) {
    const { xKey, series: seriesConfig } = config;

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
        series: seriesConfig.map(({ yKey, color, barWidth }) => ({
            type: 'bar',
            data: data[yKey],
            barWidth: barWidth || '60%',
            itemStyle: { color: color, borderRadius: [4, 4, 0, 0] }
        }))
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

