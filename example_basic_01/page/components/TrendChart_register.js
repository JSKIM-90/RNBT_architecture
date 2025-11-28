/*
 * Page - TrendChart Component - register
 * Subscribes to: trend
 * Events: @trendPeriodChanged, @trendRefreshClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    trend: ['renderChart']
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
        '.trend-refresh-btn': '@trendRefreshClicked'
    },
    change: {
        '.period-select': '@trendPeriodChanged'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderChart(response) {
    try {
        const { trends } = response;
        console.log(`[TrendChart] renderChart`);

        if (!trends || !trends.temperature) return;

        // Prepare series data for temperature sensors
        const series = trends.temperature.map((sensor, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
            return {
                name: sensor.deviceId,
                type: 'line',
                smooth: true,
                symbol: 'none',
                data: sensor.data.map(d => [d.timestamp, d.value]),
                lineStyle: {
                    width: 2,
                    color: colors[index % colors.length]
                },
                itemStyle: {
                    color: colors[index % colors.length]
                }
            };
        });

        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                },
                formatter: function(params) {
                    const time = new Date(params[0].axisValue).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    let result = `<strong>${time}</strong><br/>`;
                    params.forEach(p => {
                        result += `${p.marker} ${p.seriesName}: ${p.value[1]}°C<br/>`;
                    });
                    return result;
                }
            },
            legend: {
                data: trends.temperature.map(s => s.deviceId),
                top: 0,
                textStyle: {
                    fontSize: 10
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
                type: 'time',
                axisLabel: {
                    fontSize: 10,
                    formatter: function(value) {
                        return new Date(value).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                },
                splitLine: {
                    show: false
                }
            },
            yAxis: {
                type: 'value',
                name: '°C',
                nameTextStyle: {
                    fontSize: 10
                },
                axisLabel: {
                    fontSize: 10
                },
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: '#e2e8f0'
                    }
                }
            },
            series: series
        };

        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[TrendChart] renderChart error:', error);
    }
}
