/*
 * PDU - Self-Contained 3D Component (Tabbed UI)
 *
 * applyShadowPopupMixin + applyTabulatorMixin을 사용한 탭 팝업 컴포넌트
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의 (pdu, circuits, history)
 * 2. Data Config - API 필드 매핑
 * 3. Table Config - Tabulator 컬럼 정의
 * 4. Chart Config - ECharts 옵션 빌더
 * 5. 렌더링 함수 바인딩
 * 6. Public Methods - Page에서 호출
 * 7. customEvents - 이벤트 발행
 * 8. Template Data - HTML/CSS (publishCode에서 로드)
 * 9. Popup - template 기반 탭 Shadow DOM 팝업
 */

const { bind3DEvents, fetchData } = WKit;
const { applyShadowPopupMixin, applyEChartsMixin, applyTabulatorMixin } = PopupMixin;

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
    const assetId = this.setter.ecoAssetInfo.assetId;

    this.datasetInfo = [
        { datasetName: 'pdu', param: { id: assetId }, render: ['renderPDUInfo'] },
        { datasetName: 'pduCircuits', param: { id: assetId }, render: ['renderCircuitTable'] },
        { datasetName: 'pduHistory', param: { id: assetId }, render: ['renderPowerChart'] }
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
    // 3. Table Config - Tabulator 컬럼 정의
    // ======================
    this.tableConfig = {
        selector: '.table-container',
        columns: [
            { title: 'ID', field: 'id', widthGrow: 0.5, hozAlign: 'right' },
            { title: 'Name', field: 'name', widthGrow: 2 },
            {
                title: 'Current',
                field: 'current',
                widthGrow: 1,
                hozAlign: 'right',
                formatter: (cell) => `${cell.getValue()}A`
            },
            {
                title: 'Power',
                field: 'power',
                widthGrow: 1,
                hozAlign: 'right',
                formatter: (cell) => `${cell.getValue()}kW`
            },
            {
                title: 'Status',
                field: 'status',
                widthGrow: 1,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const colors = { active: '#22c55e', inactive: '#8892a0' };
                    return `<span style="color: ${colors[value] || '#8892a0'}">${value}</span>`;
                }
            },
            {
                title: 'Breaker',
                field: 'breaker',
                widthGrow: 0.8,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const color = value === 'on' ? '#22c55e' : '#ef4444';
                    return `<span style="color: ${color}">${value.toUpperCase()}</span>`;
                }
            }
        ],
        optionBuilder: this._getTableOption.bind(this)
    };

    // ======================
    // 4. Chart Config - ECharts 옵션 빌더
    // ======================
    this.chartConfig = {
        selector: '.chart-container',
        xKey: 'timestamps',
        series: [
            { yKey: 'power', name: 'Power (kW)', color: '#3b82f6', smooth: true, areaStyle: true },
            { yKey: 'current', name: 'Current (A)', color: '#f59e0b', smooth: true, yAxisIndex: 1 }
        ],
        optionBuilder: getDualAxisChartOption
    };

    // ======================
    // 5. 렌더링 함수 바인딩
    // ======================
    this.renderPDUInfo = renderPDUInfo.bind(this, [...this.baseInfoConfig, ...this.pduInfoConfig]);
    this.renderCircuitTable = renderCircuitTable.bind(this, this.tableConfig);
    this.renderPowerChart = renderPowerChart.bind(this, this.chartConfig);

    // ======================
    // 6. Public Methods
    // ======================
    this.showDetail = showDetail.bind(this);
    this.hideDetail = hideDetail.bind(this);
    this._switchTab = switchTab.bind(this);
    this._getTableOption = getTableOption.bind(this);

    // ======================
    // 7. 이벤트 발행
    // ======================
    this.customEvents = {
        click: '@pduClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // 8. Template Config
    // ======================
    this.templateConfig = {
        popup: 'popup-pdu',
    };

    // ======================
    // 9. Popup (template 기반 탭)
    // ======================
    this.popupCreatedConfig = {
        chartSelector: '.chart-container',
        tableSelector: '.table-container',
        events: {
            click: {
                '.close-btn': () => this.hideDetail(),
                '.tab-btn': (e) => this._switchTab(e.target.dataset.tab)
            }
        }
    };

    const { htmlCode, cssCode } = this.properties.publishCode || {};
    this.getPopupHTML = () => extractTemplate(htmlCode || '', this.templateConfig.popup);
    this.getPopupStyles = () => cssCode || '';
    this.onPopupCreated = onPopupCreated.bind(this, this.popupCreatedConfig);

    applyShadowPopupMixin(this, {
        getHTML: this.getPopupHTML,
        getStyles: this.getPopupStyles,
        onCreated: this.onPopupCreated
    });

    applyEChartsMixin(this);
    applyTabulatorMixin(this);

    console.log('[PDU] Registered:', assetId);
}

// ======================
// PUBLIC METHODS
// ======================

function showDetail() {
    this.showPopup();
    this._switchTab('circuits');

    fx.go(
        this.datasetInfo,
        fx.each(({ datasetName, param, render }) =>
            fx.go(
                fetchData(this.page, datasetName, param),
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

function switchTab(tabName) {
    const buttons = this.popupQueryAll('.tab-btn');
    const panels = this.popupQueryAll('.tab-panel');

    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
    panels.forEach(panel => panel.classList.toggle('active', panel.dataset.panel === tabName));

    if (tabName === 'power') {
        const chart = this.getChart('.chart-container');
        if (chart) chart.resize();
    } else if (tabName === 'circuits') {
        const table = this.getTable('.table-container');
        if (table) table.redraw(true);
    }
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderPDUInfo(config, data) {
    fx.go(
        config,
        fx.each(({ key, selector, dataAttr, suffix }) => {
            const el = this.popupQuery(selector);
            if (!el) return;
            const value = data[key];
            el.textContent = suffix ? `${value}${suffix}` : value;
            dataAttr && (el.dataset[dataAttr] = value);
        })
    );
}

function renderCircuitTable(config, data) {
    const { optionBuilder } = config;
    const option = optionBuilder(config, data.circuits);
    this.updateTable('.table-container', data.circuits, option);
}

function renderPowerChart(config, data) {
    const { optionBuilder, ...chartConfig } = config;
    const option = optionBuilder(chartConfig, data);
    this.updateChart('.chart-container', option);
}

// ======================
// TABLE OPTION BUILDER
// ======================

function getTableOption(config, data) {
    return {
        layout: 'fitColumns',
        responsiveLayout: 'collapse',
        height: 250,
        placeholder: 'No circuits found',
        initialSort: [{ column: 'power', dir: 'desc' }],
        columns: config.columns
    };
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

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ======================
// POPUP LIFECYCLE
// ======================

function onPopupCreated({ chartSelector, tableSelector, events }) {
    chartSelector && this.createChart(chartSelector);
    tableSelector && this.createTable(tableSelector);
    events && this.bindPopupEvents(events);
}
