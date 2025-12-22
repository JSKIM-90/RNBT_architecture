/**
 * Overview - ECO 종합 현황 대시보드 컴포넌트
 *
 * 전체 자산 현황 및 핵심 KPI를 한눈에 보여주는 대시보드
 * - 자산 상태 요약 (정상/경고/위험)
 * - 전력 KPI (총 전력, 평균 부하율, PUE)
 * - 환경 KPI (평균 온도, 습도)
 * - 최근 알람/이벤트 리스트
 */

function register(component) {
    const { fetchData } = WKit;
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

    // ======================
    // DATA DEFINITION
    // ======================
    component.datasetInfo = [
        { datasetName: 'overview', param: {}, render: ['renderOverview'] },
        { datasetName: 'overviewEvents', param: {}, render: ['renderEventTable'] }
    ];

    // ======================
    // DATA CONFIG
    // ======================
    component.summaryConfig = {
        total: { selector: '.total-count', label: '전체 자산' },
        normal: { selector: '.normal-count', label: '정상' },
        warning: { selector: '.warning-count', label: '경고' },
        critical: { selector: '.critical-count', label: '위험' }
    };

    component.kpiConfig = [
        { key: 'totalPower', selector: '.kpi-power', suffix: 'kW', label: '총 전력' },
        { key: 'avgLoad', selector: '.kpi-load', suffix: '%', label: '평균 부하율' },
        { key: 'pue', selector: '.kpi-pue', suffix: '', label: 'PUE' },
        { key: 'avgTemp', selector: '.kpi-temp', suffix: '°C', label: '평균 온도' },
        { key: 'avgHumidity', selector: '.kpi-humidity', suffix: '%', label: '평균 습도' }
    ];

    component.assetTypeConfig = [
        { key: 'ups', selector: '.asset-ups', icon: '⚡', label: 'UPS' },
        { key: 'pdu', selector: '.asset-pdu', icon: '🔌', label: 'PDU' },
        { key: 'crac', selector: '.asset-crac', icon: '❄️', label: 'CRAC' },
        { key: 'sensor', selector: '.asset-sensor', icon: '🌡️', label: 'Sensor' }
    ];

    component.tableConfig = {
        selector: '.event-table',
        columns: [
            { title: 'Time', field: 'time', widthGrow: 1.5 },
            { title: 'Asset', field: 'asset', widthGrow: 1 },
            { title: 'Type', field: 'type', widthGrow: 0.8 },
            {
                title: 'Severity',
                field: 'severity',
                widthGrow: 0.8,
                formatter: (cell) => {
                    const value = cell.getValue();
                    const colors = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
                    return `<span style="color: ${colors[value] || '#888'}">${value.toUpperCase()}</span>`;
                }
            },
            { title: 'Message', field: 'message', widthGrow: 3 }
        ],
        optionBuilder: component._getTableOption
    };

    // ======================
    // RENDER FUNCTIONS
    // ======================
    component.renderOverview = function(data) {
        // 자산 상태 요약
        const { summary } = data;
        fx.go(
            Object.entries(component.summaryConfig),
            fx.each(([key, config]) => {
                const el = component.popupQuery(config.selector);
                if (el) el.textContent = summary[key] || 0;
            })
        );

        // 타입별 자산 현황
        const { assetsByType } = data;
        fx.go(
            component.assetTypeConfig,
            fx.each(({ key, selector }) => {
                const el = component.popupQuery(selector);
                if (el && assetsByType[key]) {
                    const typeData = assetsByType[key];
                    el.querySelector('.type-total').textContent = typeData.total;
                    el.querySelector('.type-normal').textContent = typeData.normal;
                    el.querySelector('.type-warning').textContent = typeData.warning;
                    el.querySelector('.type-critical').textContent = typeData.critical;
                }
            })
        );

        // KPI 렌더링
        const { kpi } = data;
        fx.go(
            component.kpiConfig,
            fx.each(({ key, selector, suffix }) => {
                const el = component.popupQuery(selector);
                if (el) el.textContent = `${kpi[key]}${suffix}`;
            })
        );

        // 상태 도넛 차트
        component.renderStatusChart(summary);
    };

    component.renderStatusChart = function(summary) {
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
        component.updateChart('.status-chart', option);
    };

    component.renderEventTable = function(data) {
        component.updateTable('.event-table', data.events || []);
    };

    component._getTableOption = function() {
        return {
            layout: 'fitColumns',
            height: 200,
            placeholder: 'No events',
            columns: component.tableConfig.columns
        };
    };

    // ======================
    // PUBLIC METHODS
    // ======================
    component.showDetail = function() {
        component.showPopup();

        fx.go(
            component.datasetInfo,
            fx.each(({ datasetName, param, render }) =>
                fx.go(
                    fetchData(component.page, datasetName, param),
                    result => result?.response?.data,
                    data => data && render.forEach(fn => component[fn](data))
                )
            )
        ).catch(e => {
            console.error('[Overview]', e);
            component.hidePopup();
        });
    };

    component.hideDetail = function() {
        component.hidePopup();
    };

    component.refresh = function() {
        if (component._popupVisible) {
            component.showDetail();
        }
    };

    // ======================
    // TEMPLATE CONFIG
    // ======================
    component.templateConfig = {
        popup: 'popup-overview'
    };

    component.popupCreatedConfig = {
        chartSelector: '.status-chart',
        tableSelector: '.event-table',
        events: {
            click: {
                '.close-btn': () => component.hideDetail(),
                '.refresh-btn': () => component.refresh()
            }
        }
    };

    // ======================
    // POPUP SETUP
    // ======================
    const { htmlCode, cssCode } = component.properties.publishCode || {};

    component.getPopupHTML = () => extractTemplate(htmlCode || '', component.templateConfig.popup);
    component.getPopupStyles = () => cssCode || '';
    component.onPopupCreated = function({ chartSelector, tableSelector, events }) {
        if (chartSelector) component.createChart(chartSelector);
        if (tableSelector) component.createTable(tableSelector, component._getTableOption());
        if (events) component.bindPopupEvents(events);
    }.bind(null, component.popupCreatedConfig);

    applyShadowPopupMixin(component, {
        getHTML: component.getPopupHTML,
        getStyles: component.getPopupStyles,
        onCreated: component.onPopupCreated
    });

    applyEChartsMixin(component);
    applyTabulatorMixin(component);

    console.log('[Overview] Registered');
}
