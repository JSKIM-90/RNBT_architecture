const { subscribe } = GlobalDataPublisher;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Subscribe to sales data
    this.subscriptions = {
        salesData: ['renderChart']
    };

    this.renderChart = renderChart.bind(this);

    // Initialize ECharts
    const chartContainer = this.element.querySelector('#echarts');
    this.chartInstance = echarts.init(chartContainer);

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );
}

function renderChart(data) {
    console.log(`[SalesChart] Rendering chart`, data);

    if (!data || !data.products) return;

    const products = data.products.slice(0, 12); // Top 12 products

    const option = {
        title: {
            text: 'Top Products by Revenue',
            left: 'center',
            top: 10,
            textStyle: {
                fontSize: 14,
                fontWeight: 600,
                color: '#111827'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
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
            data: products.map(p => p.title?.substring(0, 15) || 'Product'),
            axisLabel: {
                rotate: 45,
                interval: 0,
                fontSize: 10
            }
        },
        yAxis: {
            type: 'value',
            name: 'Revenue ($)'
        },
        series: [
            {
                name: 'Revenue',
                type: 'bar',
                data: products.map(p => (p.price * (p.stock || 10))),
                itemStyle: {
                    color: '#4f46e5'
                },
                barWidth: '60%'
            }
        ]
    };

    this.chartInstance.setOption(option);
}
