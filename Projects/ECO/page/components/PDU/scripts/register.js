/*
 * PDU - Self-Contained 3D Component (Tabbed UI)
 *
 * applyShadowPopupMixin을 사용한 탭 팝업 컴포넌트
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의 (pdu, history)
 * 2. Data Config - API 필드 매핑
 * 3. Chart Config - ECharts 옵션 빌더
 * 4. 렌더링 함수 바인딩
 * 5. Public Methods - Page에서 호출
 * 6. customEvents - 이벤트 발행
 * 7. Template Data - HTML/CSS (publishCode에서 로드)
 * 8. Popup - template 기반 탭 Shadow DOM 팝업
 */

const { bind3DEvents, fetchData } = Wkit;
const { applyShadowPopupMixin, applyEChartsMixin } = PopupMixin;

// ======================
// TEMPLATE HELPER
// ======================
function extractTemplate(htmlCode, templateId) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const template = doc.querySelector(`template#${templateId}`);
    return template?.innerHTML || '';
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

initComponent.call(this);

function initComponent() {
    // ======================
    // 1. 데이터 정의 (동적 assetId 지원)
    // ======================
    this._defaultAssetId = this.setter?.ecoAssetInfo?.assetId || this.id;

    this.datasetInfo = [
        { datasetName: 'pdu', render: ['renderPDUInfo'] },
        { datasetName: 'pduHistory', render: ['renderPowerChart'] }
    ];

    // ======================
    // 2. Data Config (API 필드 매핑)
    // ======================
    this.baseInfoConfig = [
        { key: 'name', selector: '.pdu-name' },
        { key: 'zone', selector: '.pdu-zone' },
        { key: 'status', selector: '.pdu-status', dataAttr: 'status' }
    ];

    this.pduInfoConfig = [
        { key: 'totalPower', selector: '.pdu-power', suffix: 'kW' },
        { key: 'totalCurrent', selector: '.pdu-current', suffix: 'A' },
        { key: 'voltage', selector: '.pdu-voltage', suffix: 'V' },
        { key: 'activeCircuits', selector: '.pdu-active-circuits' },
        { key: 'powerFactor', selector: '.pdu-pf' }
    ];

    // ======================
    // 3. Chart Config - ECharts 옵션 빌더
    // ======================
    this.chartConfig = {
        xKey: 'timestamps',
        series: [
            { yKey: 'power', name: 'Power (kW)', color: '#3b82f6', smooth: true, areaStyle: true },
            { yKey: 'current', name: 'Current (A)', color: '#f59e0b', smooth: true, yAxisIndex: 1 }
        ],
        optionBuilder: getDualAxisChartOption
    };

    // ======================
    // 4. 렌더링 함수 바인딩
    // ======================
    this.renderPDUInfo = renderPDUInfo.bind(this);
    this.renderPowerChart = renderPowerChart.bind(this);

    // ======================
    // 5. Public Methods
    // ======================
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);

    // ======================
    // 6. 이벤트 발행
    // ======================
    this.customEvents = {
        click: '@assetClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // 7. Template Config
    // ======================
    this.templateConfig = {
        popup: 'popup-pdu',
    };

    this.popupCreatedConfig = {
        chartSelector: '.chart-container',
        events: {
            click: {
                '.close-btn': () => this.hideDetail()
            }
        }
    };

    // ======================
    // 8. Popup Setup
    // ======================
    const { htmlCode, cssCode } = this.properties.publishCode || {};
    const ctx = this;

    this.getPopupHTML = () => extractTemplate(htmlCode || '', ctx.templateConfig.popup);
    this.getPopupStyles = () => cssCode || '';
    this.onPopupCreated = function() {
        const { chartSelector, events } = ctx.popupCreatedConfig;
        if (chartSelector) ctx.createChart(chartSelector);
        if (events) ctx.bindPopupEvents(events);
    };

    applyShadowPopupMixin(this, {
        getHTML: this.getPopupHTML,
        getStyles: this.getPopupStyles,
        onCreated: this.onPopupCreated
    });

    applyEChartsMixin(this);

    console.log('[PDU] Registered:', this._defaultAssetId);
}

// ======================
// PUBLIC METHODS
// ======================

function showDetail(assetId) {
    const targetId = assetId || this._defaultAssetId;
    this.showPopup();

    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, render }) =>
            fx.go(
                fetchData(this.page, datasetName, { assetId: targetId }),
                result => result?.response?.data,
                data => data && render.forEach(fn => this[fn](data))
            )
        )
    ).catch(e => {
        console.error('[PDU]', e);
        this.hidePopup();
    });
}

function hideDetail() {
    this.hidePopup();
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderPDUInfo(data) {
    const config = [...this.baseInfoConfig, ...this.pduInfoConfig];
    fx.go(
        config,
        fx.each(({ key, selector, dataAttr, suffix }) => {
            const el = this.popupQuery(selector);
            if (!el) return;
            const value = data[key];
            el.textContent = suffix ? `${value}${suffix}` : value;
            if (dataAttr) el.dataset[dataAttr] = value;
        })
    );
}

function renderPowerChart(data) {
    const { optionBuilder, ...chartConfig } = this.chartConfig;
    const option = optionBuilder(chartConfig, data);
    this.updateChart('.chart-container', option);
}

// ======================
// CHART OPTION BUILDER
// ======================

function getDualAxisChartOption(config, data) {
    const { xKey, series: seriesConfig } = config;

    return {
        grid: { left: 50, right: 50, top: 35, bottom: 24 },
        legend: {
            data: seriesConfig.map(s => s.name),
            top: 0,
            textStyle: { color: '#8892a0', fontSize: 11 }
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: '#1a1f2e',
            borderColor: '#2a3142',
            textStyle: { color: '#e0e6ed', fontSize: 12 }
        },
        xAxis: {
            type: 'category',
            data: data[xKey],
            axisLine: { lineStyle: { color: '#333' } },
            axisLabel: { color: '#888', fontSize: 10 }
        },
        yAxis: [
            {
                type: 'value',
                name: 'kW',
                position: 'left',
                axisLine: { show: true, lineStyle: { color: '#3b82f6' } },
                axisLabel: { color: '#888', fontSize: 10 },
                splitLine: { lineStyle: { color: '#333' } }
            },
            {
                type: 'value',
                name: 'A',
                position: 'right',
                axisLine: { show: true, lineStyle: { color: '#f59e0b' } },
                axisLabel: { color: '#888', fontSize: 10 },
                splitLine: { show: false }
            }
        ],
        series: seriesConfig.map(({ yKey, name, color, smooth, areaStyle, yAxisIndex = 0 }) => ({
            name,
            type: 'line',
            yAxisIndex,
            data: data[yKey],
            smooth,
            symbol: 'none',
            lineStyle: { color, width: 2 },
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
