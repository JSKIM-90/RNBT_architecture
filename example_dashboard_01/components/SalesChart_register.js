/* Component: SalesChart
 * Pattern: 2D Component + GlobalDataPublisher Subscription + ECharts
 * Purpose: Displays sales data as a line chart (subscribes to 'salesData' topic)
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
        salesData: ['renderChart', 'updateTimestamp']
    };

    // Event schema
    this.customEvents = {
        click: {
            '.btn-refresh': '@refreshChartClicked'
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

    // Initial empty chart
    renderInitialChart.call(this);
}

// Initial chart render
function renderInitialChart() {
    const option = {
        title: {
            text: 'Sales Trend',
            left: 'center',
            textStyle: {
                fontSize: 14,
                fontWeight: 'normal',
                color: '#6b7280'
            }
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        },
        yAxis: {
            type: 'value',
            name: 'Sales ($)'
        },
        series: [
            {
                name: 'Sales',
                data: [150, 230, 224, 218, 135, 147, 260],
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#4F46E5'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
                            { offset: 1, color: 'rgba(79, 70, 229, 0.05)' }
                        ]
                    }
                }
            }
        ]
    };

    this.chartInstance.setOption(option);
}

// Handler: Render chart with sales data
function renderChart(data) {
    console.log(`[SalesChart] Rendering chart with data:`, data);

    if (!data || data.length === 0) {
        return;
    }

    // Extract data for chart
    const dates = data.map(item => item.date || item.label);
    const values = data.map(item => item.value || item.sales || 0);

    const option = {
        xAxis: {
            type: 'category',
            data: dates
        },
        yAxis: {
            type: 'value',
            name: 'Sales ($)'
        },
        series: [
            {
                name: 'Sales',
                data: values,
                type: 'line',
                smooth: true,
                itemStyle: {
                    color: '#4F46E5'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
                            { offset: 1, color: 'rgba(79, 70, 229, 0.05)' }
                        ]
                    }
                }
            }
        ]
    };

    this.chartInstance.setOption(option);
}

// Handler: Update timestamp
function updateTimestamp(data) {
    const timestamp = new Date().toLocaleTimeString();
    const timestampEl = this.element.querySelector('.chart-updated-time');
    if (timestampEl) {
        timestampEl.textContent = timestamp;
    }
}
