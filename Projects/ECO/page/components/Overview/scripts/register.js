/*
 * Page - Overview Component - register
 * ECO 종합 현황 대시보드 컴포넌트
 *
 * 전체 자산 현황 및 핵심 KPI를 한눈에 보여주는 대시보드
 * - 자산 상태 요약 (정상/경고/위험)
 * - 전력 KPI (총 전력, 평균 부하율, PUE)
 * - 환경 KPI (평균 온도, 습도)
 * - 최근 알람/이벤트 리스트
 *
 * Subscribes to: overview, overviewEvents
 * Events: @refreshClicked
 * Libraries: ECharts, Tabulator
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    overview: ['renderOverview'],
    overviewEvents: ['renderEventTable']
};

this.renderOverview = renderOverview.bind(this);
this.renderEventTable = renderEventTable.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// DATA CONFIG
// ======================

this.summaryConfig = {
    total: { selector: '.total-count', label: '전체 자산' },
    normal: { selector: '.normal-count', label: '정상' },
    warning: { selector: '.warning-count', label: '경고' },
    critical: { selector: '.critical-count', label: '위험' }
};

this.kpiConfig = [
    { key: 'totalPower', selector: '.kpi-power', suffix: 'kW', label: '총 전력' },
    { key: 'avgLoad', selector: '.kpi-load', suffix: '%', label: '평균 부하율' },
    { key: 'pue', selector: '.kpi-pue', suffix: '', label: 'PUE' },
    { key: 'avgTemp', selector: '.kpi-temp', suffix: '°C', label: '평균 온도' },
    { key: 'avgHumidity', selector: '.kpi-humidity', suffix: '%', label: '평균 습도' }
];

this.assetTypeConfig = [
    { key: 'ups', selector: '.asset-ups', icon: '⚡', label: 'UPS' },
    { key: 'pdu', selector: '.asset-pdu', icon: '🔌', label: 'PDU' },
    { key: 'crac', selector: '.asset-crac', icon: '❄️', label: 'CRAC' },
    { key: 'sensor', selector: '.asset-sensor', icon: '🌡️', label: 'Sensor' }
];

// ======================
// ECHARTS INITIALIZATION
// ======================

const chartContainer = this.element.querySelector('.status-chart');
if (chartContainer) {
    this.chartInstance = echarts.init(chartContainer);

    // Handle resize with ResizeObserver
    this.resizeObserver = new ResizeObserver(() => {
        this.chartInstance && this.chartInstance.resize();
    });
    this.resizeObserver.observe(chartContainer);
}

// ======================
// TABULATOR INITIALIZATION
// ======================

const tableContainer = this.element.querySelector('.event-table');
if (tableContainer) {
    const uniqueId = `tabulator-${this.id}`;
    tableContainer.id = uniqueId;

    this.tableInstance = new Tabulator(`#${uniqueId}`, {
        layout: 'fitColumns',
        height: 200,
        placeholder: 'No events',
        columns: [
            { title: 'Time', field: 'time', widthGrow: 1.5 },
            { title: 'Asset', field: 'asset', widthGrow: 1 },
            { title: 'Type', field: 'type', widthGrow: 0.8 },
            {
                title: 'Severity',
                field: 'severity',
                widthGrow: 0.8,
                formatter: function(cell) {
                    const value = cell.getValue();
                    const colors = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
                    return `<span style="color: ${colors[value] || '#888'}">${value.toUpperCase()}</span>`;
                }
            },
            { title: 'Message', field: 'message', widthGrow: 3 }
        ]
    });
}

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.refresh-btn': '@refreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderOverview(response) {
    const { summary, assetsByType, kpi } = response;
    console.log('[Overview] renderOverview');

    const ctx = this;

    // 자산 상태 요약
    if (summary) {
        fx.go(
            Object.entries(ctx.summaryConfig),
            each(([key, config]) => {
                const el = ctx.element.querySelector(config.selector);
                if (el) el.textContent = summary[key] || 0;
            })
        );
    }

    // 타입별 자산 현황
    if (assetsByType) {
        fx.go(
            ctx.assetTypeConfig,
            each(({ key, selector }) => {
                const el = ctx.element.querySelector(selector);
                if (el && assetsByType[key]) {
                    const typeData = assetsByType[key];
                    const totalEl = el.querySelector('.type-total');
                    const normalEl = el.querySelector('.type-normal');
                    const warningEl = el.querySelector('.type-warning');
                    const criticalEl = el.querySelector('.type-critical');

                    if (totalEl) totalEl.textContent = typeData.total;
                    if (normalEl) normalEl.textContent = typeData.normal;
                    if (warningEl) warningEl.textContent = typeData.warning;
                    if (criticalEl) criticalEl.textContent = typeData.critical;
                }
            })
        );
    }

    // KPI 렌더링
    if (kpi) {
        fx.go(
            ctx.kpiConfig,
            each(({ key, selector, suffix }) => {
                const el = ctx.element.querySelector(selector);
                if (el) el.textContent = `${kpi[key]}${suffix}`;
            })
        );
    }

    // 상태 도넛 차트
    if (summary && ctx.chartInstance) {
        renderStatusChart.call(ctx, summary);
    }
}

function renderStatusChart(summary) {
    const option = {
        tooltip: { trigger: 'item' },
        legend: {
            orient: 'vertical',
            right: 10,
            top: 'center',
            textStyle: { color: '#8892a0', fontSize: 11 }
        },
        series: [{
            type: 'pie',
            radius: ['50%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 4, borderColor: '#1a1f2e', borderWidth: 2 },
            label: { show: false },
            data: [
                { value: summary.normal, name: '정상', itemStyle: { color: '#22c55e' } },
                { value: summary.warning, name: '경고', itemStyle: { color: '#f59e0b' } },
                { value: summary.critical, name: '위험', itemStyle: { color: '#ef4444' } }
            ]
        }]
    };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[Overview] ECharts setOption error:', error);
    }
}

function renderEventTable(response) {
    const { events } = response;
    console.log(`[Overview] renderEventTable: ${events?.length || 0} events`);

    if (!events || !this.tableInstance) return;

    this.tableInstance.setData(events);
}
