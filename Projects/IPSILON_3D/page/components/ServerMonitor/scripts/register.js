/*
 * ServerMonitor - Self-Contained 3D Component (Tabbed UI)
 *
 * applyTabbedPopupMixin을 사용한 탭 팝업 컴포넌트 예제
 *
 * 핵심 구조:
 * 1. datasetInfo - 데이터 정의 (server, processes, history)
 * 2. Data Config - API 필드 매핑
 * 3. Table Config - Tabulator 컬럼 정의
 * 4. Chart Config - ECharts 옵션 빌더 (다중 시리즈)
 * 5. 렌더링 함수 바인딩
 * 6. Public Methods - Page에서 호출
 * 7. customEvents - 이벤트 발행
 * 8. Template Data - HTML/CSS (publishCode에서 로드)
 * 9. Popup - template 기반 탭 Shadow DOM 팝업
 */

const { bind3DEvents, fetchData } = WKit;
const { applyTabbedPopupMixin, applyTabulatorMixin } = Mixin;

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
    const assetId = this.setter.ipsilonAssetInfo.assetId;

    this.datasetInfo = [
        { datasetName: 'server', param: { id: assetId }, render: ['renderServerInfo'] },
        { datasetName: 'serverProcesses', param: { id: assetId }, render: ['renderProcessTable'] },
        { datasetName: 'serverHistory', param: { id: assetId }, render: ['renderPerformanceChart'] }
    ];

    // ======================
    // 2. Data Config (API 필드 매핑)
    // ======================
    this.baseInfoConfig = [
        { key: 'name', selector: '.server-name' },
        { key: 'zone', selector: '.server-zone' },
        { key: 'status', selector: '.server-status', dataAttr: 'status' }
    ];

    this.serverInfoConfig = [
        { key: 'cpu', selector: '.server-cpu', suffix: '%' },
        { key: 'memory', selector: '.server-memory', suffix: '%' },
        { key: 'disk', selector: '.server-disk', suffix: '%' },
        { key: 'os', selector: '.server-os' },
        { key: 'uptime', selector: '.server-uptime', suffix: ' days' }
    ];

    // ======================
    // 3. Table Config - Tabulator 컬럼 정의
    // ======================
    this.tableConfig = {
        selector: '.table-container',
        columns: [
            { title: 'PID', field: 'pid', widthGrow: 1, hozAlign: 'right' },
            { title: 'Name', field: 'name', widthGrow: 2 },
            { title: 'User', field: 'user', widthGrow: 1 },
            { title: 'Type', field: 'type', widthGrow: 1.5 },
            {
                title: 'CPU',
                field: 'cpu',
                widthGrow: 1,
                hozAlign: 'right',
                formatter: (cell) => {
                    const value = cell.getValue();
                    const color = value > 25 ? '#ef4444' : value > 15 ? '#eab308' : '#22c55e';
                    return `<span style="color: ${color}">${value}%</span>`;
                }
            },
            {
                title: 'Mem',
                field: 'memory',
                widthGrow: 1,
                hozAlign: 'right',
                formatter: (cell) => `${cell.getValue()}MB`
            },
            {
                title: 'Status',
                field: 'status',
                widthGrow: 1,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const colors = { high: '#ef4444', warning: '#eab308', normal: '#22c55e' };
                    return `<span style="color: ${colors[value] || '#8892a0'}">${value}</span>`;
                }
            },
            { title: 'Up', field: 'uptime', widthGrow: 1, hozAlign: 'right' }
        ],
        optionBuilder: this._getTableOption.bind(this)
    };

    // ======================
    // 4. Chart Config - ECharts 옵션 빌더 (다중 시리즈)
    // ======================
    this.chartConfig = {
        selector: '.chart-container',
        xKey: 'timestamps',
        series: [
            { yKey: 'cpu', name: 'CPU', color: '#3b82f6', smooth: true, areaStyle: true },
            { yKey: 'memory', name: 'Memory', color: '#22c55e', smooth: true, areaStyle: true }
        ],
        optionBuilder: getMultiLineChartOption
    };

    // ======================
    // 5. 렌더링 함수 바인딩
    // ======================
    this.renderServerInfo = renderServerInfo.bind(this, [...this.baseInfoConfig, ...this.serverInfoConfig]);
    this.renderProcessTable = renderProcessTable.bind(this, this.tableConfig);
    this.renderPerformanceChart = renderPerformanceChart.bind(this, this.chartConfig);

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
        click: '@serverClicked'
    };

    bind3DEvents(this, this.customEvents);

    // ======================
    // 8. Template Config
    // ======================
    this.templateConfig = {
        popup: 'popup-server',
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

    applyTabbedPopupMixin(this, {
        getHTML: this.getPopupHTML,
        getStyles: this.getPopupStyles,
        onCreated: this.onPopupCreated
    });

    applyTabulatorMixin(this, {
        tableSelector: '.table-container'
    });

    console.log('[ServerMonitor] Registered:', assetId);
}

// ======================
// PUBLIC METHODS
// ======================

function showDetail() {
    this.showPopup();
    this._switchTab('overview');

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
        console.error('[ServerMonitor]', e);
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
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderServerInfo(config, data) {
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

function renderProcessTable(config, data) {
    const { optionBuilder } = config;
    const option = optionBuilder(config, data.processes);
    this.updateTable('.table-container', data.processes, option);
}

function renderPerformanceChart(config, data) {
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
        placeholder: 'No processes found',
        initialSort: [{ column: 'cpu', dir: 'desc' }],
        columns: config.columns
    };
}

// ======================
// CHART OPTION BUILDER
// ======================

function getMultiLineChartOption(config, data) {
    const { xKey, series: seriesConfig } = config;

    return {
        grid: { left: 45, right: 16, top: 30, bottom: 24 },
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
        yAxis: {
            type: 'value',
            min: 0,
            max: 100,
            axisLine: { show: false },
            axisLabel: { color: '#888', fontSize: 10, formatter: '{value}%' },
            splitLine: { lineStyle: { color: '#333' } }
        },
        series: seriesConfig.map(({ yKey, name, color, smooth, areaStyle }) => ({
            name,
            type: 'line',
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
