/*
 * Page - SpendingChart Component - register
 * Card Company Dashboard
 * Subscribes to: spending
 * Events: @spendingChartRefreshClicked
 * Library: ECharts
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    spending: ['renderChart']
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
        '.chart-refresh-btn': '@spendingChartRefreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderChart(response) {
    const { data } = response;
    console.log(`[SpendingChart] renderChart:`, data);

    if (!data || !data.categories) return;

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#6366f1'];

    const option = {
        tooltip: {
            trigger: 'item',
            formatter: '{b}: ${c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            right: '5%',
            top: 'center',
            textStyle: {
                fontSize: 11
            }
        },
        series: [
            {
                name: 'Spending',
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['35%', '50%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 14,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: false
                },
                data: data.categories.map((item, index) => ({
                    name: item.name,
                    value: item.amount,
                    itemStyle: {
                        color: colors[index % colors.length]
                    }
                }))
            }
        ]
    };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[SpendingChart] ECharts setOption error:', error);
    }
}
