/* Component: SalesStats
 * Pattern: 2D Component + GlobalDataPublisher Subscription + ECharts
 * Purpose: Displays sales statistics as a bar chart (subscribes to 'salesStats' topic)
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // Initialize ECharts instance
    const targetElement = this.element.querySelector('#echarts');
    this.chartInstance = echarts.init(targetElement);

    // Subscription schema
    this.subscriptions = {
        salesStats: ['renderChart', 'updateTimestamp']
    };

    // Event schema
    this.customEvents = {
        click: {
            '.btn-refresh': '@refreshStatsClicked'
        }
    };

    // Bind handler functions
    this.renderChart = renderChart.bind(this);
    this.updateTimestamp = updateTimestamp.bind(this);

    // Subscribe to topics
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );

    // Bind events
    bindEvents(this, this.customEvents);

    // Initial chart
    renderInitialChart.call(this);
}

// Initial chart render
function renderInitialChart() {
    const option = {
        title: {
            text: 'Sales by Category',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal',
                color: '#6b7280'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        xAxis: {
            type: 'category',
            data: ['Electronics', 'Clothing', 'Food', 'Books', 'Sports']
        },
        yAxis: {
            type: 'value',
            name: 'Sales ($)'
        },
        series: [
            {
                name: 'Sales',
                data: [12000, 8500, 6700, 5400, 4200],
                type: 'bar',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#4F46E5' },
                            { offset: 1, color: '#818CF8' }
                        ]
                    }
                },
                barWidth: '60%'
            }
        ]
    };

    this.chartInstance.setOption(option);
}

// Handler: Render chart with stats data
function renderChart(data) {
    console.log(`[SalesStats] Rendering chart with data:`, data);

    if (!data || data.length === 0) {
        return;
    }

    // Extract data for chart
    const categories = data.map(item => item.category || item.label);
    const values = data.map(item => item.value || item.sales || 0);

    const option = {
        xAxis: {
            type: 'category',
            data: categories
        },
        yAxis: {
            type: 'value',
            name: 'Sales ($)'
        },
        series: [
            {
                name: 'Sales',
                data: values,
                type: 'bar',
                itemStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: '#4F46E5' },
                            { offset: 1, color: '#818CF8' }
                        ]
                    }
                },
                barWidth: '60%'
            }
        ]
    };

    this.chartInstance.setOption(option);
}

// Handler: Update timestamp
function updateTimestamp(data) {
    const timestamp = new Date().toLocaleTimeString();
    const timestampEl = this.element.querySelector('.stats-updated-time');
    if (timestampEl) {
        timestampEl.textContent = timestamp;
    }
}
