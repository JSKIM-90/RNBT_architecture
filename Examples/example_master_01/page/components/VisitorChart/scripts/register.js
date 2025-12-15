/*
 * Page - VisitorChart Component - register
 * Subscribes to: chartData
 * Events: @chartRefreshClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    chartData: ['renderChart']
};

this.renderChart = renderChart.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// INITIALIZE ECHARTS
// ======================

const chartContainer = this.element.querySelector('#echarts');
this.chartInstance = echarts.init(chartContainer);

// Handle resize with ResizeObserver
this.resizeObserver = new ResizeObserver(() => {
    this.chartInstance && this.chartInstance.resize();
});
this.resizeObserver.observe(chartContainer);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.chart-refresh-btn': '@chartRefreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderChart(response) {
    const { data } = response;
    console.log(`[VisitorChart] renderChart:`, data);

    if (!data || !data.labels) return;

    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            }
        },
        legend: {
            data: ['Visitors', 'Page Views'],
            top: 0
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
            boundaryGap: false,
            data: data.labels,
            axisLabel: {
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: 'Visitors',
                type: 'line',
                smooth: true,
                data: data.visitors,
                itemStyle: { color: '#4f46e5' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
                            { offset: 1, color: 'rgba(79, 70, 229, 0.05)' }
                        ]
                    }
                }
            },
            {
                name: 'Page Views',
                type: 'line',
                smooth: true,
                data: data.pageViews,
                itemStyle: { color: '#10b981' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.3)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
                        ]
                    }
                }
            }
        ]
    };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[VisitorChart] ECharts setOption error:', error);
    }
}
