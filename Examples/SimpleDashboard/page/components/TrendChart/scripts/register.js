/**
 * Page - TrendChart Component - register.js
 *
 * 책임:
 * - 트렌드 라인 차트 표시 (ECharts 사용)
 * - 기간 변경 이벤트 발행
 *
 * Subscribes to: chartData
 * Events: @periodChanged
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;

// ======================
// CONFIG (Chart Config 패턴)
// ======================

const chartConfig = {
    xKey: 'labels',
    seriesKey: 'series',
    optionBuilder: getChartOptions
};

// ======================
// BINDINGS
// ======================

this.renderChart = renderChart.bind(this, chartConfig);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    chartData: ['renderChart']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// ECHARTS INITIALIZATION
// ======================

const chartContainer = this.appendElement.querySelector('.chart-container');
this.chartInstance = echarts.init(chartContainer);

this.resizeObserver = new ResizeObserver(() => {
    this.chartInstance && this.chartInstance.resize();
});
this.resizeObserver.observe(chartContainer);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    change: {
        '.period-select': '@periodChanged'
    }
};

bindEvents(this, this.customEvents);

console.log('[TrendChart] Registered');

// ======================
// RENDER FUNCTIONS
// ======================

function renderChart(config, { response }) {
    const { data, meta } = response;
    if (!data) return;

    const { optionBuilder, ...chartCfg } = config;
    const option = optionBuilder(chartCfg, data);

    try {
        this.chartInstance.setOption(option, true);
        console.log('[TrendChart] Chart rendered:', meta?.period || 'default');
    } catch (error) {
        console.error('[TrendChart] setOption error:', error);
    }
}

// ======================
// OPTION BUILDER
// ======================

function getChartOptions(config, data) {
    const { xKey, seriesKey } = config;
    const labels = data[xKey];
    const seriesData = data[seriesKey];

    return {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: fx.go(seriesData, fx.map(s => s.name)),
            top: 0,
            textStyle: {
                fontSize: 12
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: labels,
            axisLabel: {
                fontSize: 11
            },
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                fontSize: 11
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#e2e8f0'
                }
            }
        },
        series: fx.go(
            seriesData,
            fx.map(s => ({
                name: s.name,
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                data: s.data,
                lineStyle: {
                    color: s.color,
                    width: 2
                },
                itemStyle: {
                    color: s.color
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: s.color + '40' },
                            { offset: 1, color: s.color + '05' }
                        ]
                    }
                }
            }))
        )
    };
}
