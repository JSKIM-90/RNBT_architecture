/**
 * TempHumiditySensor - Self-Contained 3D Component
 *
 * 온습도 센서 컴포넌트
 * - 현재 온도/습도 표시
 * - 온습도 히스토리 차트
 * - IPSILON_3D TemperatureSensor 참조 구현
 */

function register(component) {
    const { bind3DEvents, fetchData } = WKit;
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

    // ======================
    // DATA DEFINITION
    // ======================
    const assetId = component.setter.ecoAssetInfo?.assetId || 'sensor-001';

    component.datasetInfo = [
        { datasetName: 'sensor', param: { id: assetId }, render: ['renderSensorInfo'] },
        { datasetName: 'sensorHistory', param: { id: assetId }, render: ['renderChart'] }
    ];

    // ======================
    // DATA CONFIG
    // ======================
    component.baseInfoConfig = [
        { key: 'name', selector: '.sensor-name' },
        { key: 'zone', selector: '.sensor-zone' },
        { key: 'status', selector: '.sensor-status', dataAttr: 'status' }
    ];

    component.sensorInfoConfig = [
        { key: 'temperature', selector: '.sensor-temp' },
        { key: 'humidity', selector: '.sensor-humidity' }
    ];

    component.chartConfig = {
        xKey: 'timestamps',
        series: [
            { yKey: 'temperatures', name: 'Temperature', color: '#3b82f6', yAxisIndex: 0 },
            { yKey: 'humidities', name: 'Humidity', color: '#22c55e', yAxisIndex: 1 }
        ],
        yAxis: [
            { name: '°C', position: 'left' },
            { name: '%', position: 'right' }
        ],
        optionBuilder: getDualAxisChartOption
    };

    // ======================
    // RENDER FUNCTIONS
    // ======================
    component.renderSensorInfo = function(data) {
        const config = [...component.baseInfoConfig, ...component.sensorInfoConfig];
        fx.go(
            config,
            fx.each(({ key, selector, dataAttr }) => {
                const el = component.popupQuery(selector);
                if (el) {
                    el.textContent = data[key];
                    if (dataAttr) el.dataset[dataAttr] = data[key];
                }
            })
        );
    };

    component.renderChart = function(data) {
        const { optionBuilder, ...chartConfig } = component.chartConfig;
        const option = optionBuilder(chartConfig, data);
        component.updateChart('.chart-container', option);
    };

    // ======================
    // CHART OPTION BUILDER
    // ======================
    function getDualAxisChartOption(config, data) {
        const { xKey, series: seriesConfig, yAxis: yAxisConfig } = config;

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(26, 31, 46, 0.95)',
                borderColor: '#2a3142',
                textStyle: { color: '#e0e6ed', fontSize: 12 }
            },
            legend: {
                data: seriesConfig.map(s => s.name),
                top: 8,
                textStyle: { color: '#8892a0', fontSize: 11 }
            },
            grid: {
                left: 50,
                right: 50,
                top: 40,
                bottom: 24
            },
            xAxis: {
                type: 'category',
                data: data[xKey],
                axisLine: { lineStyle: { color: '#333' } },
                axisLabel: { color: '#888', fontSize: 10 }
            },
            yAxis: yAxisConfig.map((axis, index) => ({
                type: 'value',
                name: axis.name,
                position: axis.position,
                axisLine: { show: true, lineStyle: { color: '#333' } },
                axisLabel: { color: '#888', fontSize: 10 },
                splitLine: { lineStyle: { color: index === 0 ? '#333' : 'transparent' } }
            })),
            series: seriesConfig.map(({ yKey, name, color, yAxisIndex }) => ({
                name: name,
                type: 'line',
                yAxisIndex: yAxisIndex,
                data: data[yKey],
                smooth: true,
                symbol: 'none',
                lineStyle: { color: color, width: 2 },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: hexToRgba(color, 0.2) },
                            { offset: 1, color: hexToRgba(color, 0) }
                        ]
                    }
                }
            }))
        };
    }

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
            console.error('[TempHumiditySensor]', e);
            component.hidePopup();
        });
    };

    component.hideDetail = function() {
        component.hidePopup();
    };

    // ======================
    // CUSTOM EVENTS
    // ======================
    component.customEvents = {
        click: '@sensorClicked'
    };

    bind3DEvents(component, component.customEvents);

    // ======================
    // TEMPLATE CONFIG
    // ======================
    component.templateConfig = {
        popup: 'popup-sensor'
    };

    component.popupCreatedConfig = {
        chartSelector: '.chart-container',
        events: {
            click: {
                '.close-btn': () => component.hideDetail()
            }
        }
    };

    // ======================
    // POPUP SETUP
    // ======================
    const { htmlCode, cssCode } = component.properties.publishCode || {};

    component.getPopupHTML = () => extractTemplate(htmlCode || '', component.templateConfig.popup);
    component.getPopupStyles = () => cssCode || '';
    component.onPopupCreated = function({ chartSelector, events }) {
        if (chartSelector) component.createChart(chartSelector);
        if (events) component.bindPopupEvents(events);
    }.bind(null, component.popupCreatedConfig);

    applyShadowPopupMixin(component, {
        getHTML: component.getPopupHTML,
        getStyles: component.getPopupStyles,
        onCreated: component.onPopupCreated
    });

    applyEChartsMixin(component);

    console.log('[TempHumiditySensor] Registered:', assetId);
}
