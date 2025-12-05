/*
 * Page - TimeTrendChart Component - register
 * 시간대별 거래추이 (Area Chart with 5 series)
 *
 * Subscribes to: timeTrendData
 * Events: @filterClicked
 *
 * Expected Data Structure (Bottom-Up):
 * {
 *   peakDate: "2025/08/05",
 *   series: {
 *     labels: ["00", "02", "04", ..., "22"],
 *     역대픽: [1200, 1300, ...],
 *     연중최고픽: [1100, 1200, ...],
 *     월픽: [600, 650, ...],
 *     전일: [400, 450, ...],
 *     금일: [300, 350, ...]
 *   },
 *   activeFilter: "전체"
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    timeTrendData: ['renderChart']
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
this.chartInstance = echarts.init(chartContainer, null, {
    renderer: 'canvas'
});

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
        '.btn': '@filterClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderChart(response) {
    const { data } = response;
    console.log(`[TimeTrendChart] renderChart:`, data);

    if (!data || !data.series) return;

    // Update PEAK date
    const peakDateEl = this.element.querySelector('[data-peak-date]');
    if (peakDateEl && data.peakDate) {
        peakDateEl.textContent = data.peakDate;
    }

    // Update active filter button
    if (data.activeFilter) {
        updateActiveFilter.call(this, data.activeFilter);
    }

    const { labels, 역대픽, 연중최고픽, 월픽, 전일, 금일 } = data.series;

    const option = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'line',
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)',
                    width: 2
                }
            },
            backgroundColor: 'rgba(53, 60, 60, 0.8)',
            borderColor: 'transparent',
            textStyle: {
                color: '#fff',
                fontSize: 14
            }
        },
        legend: {
            show: false
        },
        grid: {
            left: 40,
            right: 10,
            top: 10,
            bottom: 30,
            containLabel: false
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: labels,
            axisLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.3)'
                }
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#d2d8d6',
                fontSize: 12
            },
            splitLine: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: 1800,
            interval: 600,
            axisLine: {
                show: false
            },
            axisTick: {
                show: false
            },
            axisLabel: {
                color: '#d2d8d6',
                fontSize: 12,
                formatter: '{value}'
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    type: 'dashed'
                }
            }
        },
        series: [
            createAreaSeries('역대픽', 역대픽, '#526FE5'),
            createAreaSeries('연중최고픽', 연중최고픽, '#52BEE5'),
            createAreaSeries('월픽', 월픽, '#009178'),
            createAreaSeries('전일', 전일, '#52E5C3'),
            createAreaSeries('금일', 금일, '#AAFD84')
        ]
    };

    try {
        this.chartInstance.setOption(option);
    } catch (error) {
        console.error('[TimeTrendChart] ECharts setOption error:', error);
    }
}

function createAreaSeries(name, data, color) {
    return {
        name: name,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: data,
        lineStyle: {
            color: color,
            width: 2
        },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: color + '80' },
                    { offset: 1, color: color + '10' }
                ]
            }
        }
    };
}

function updateActiveFilter(activeFilter) {
    const buttons = this.element.querySelectorAll('.btn');
    buttons.forEach(btn => {
        if (btn.dataset.filter === activeFilter) {
            btn.classList.remove('btn-inactive');
            btn.classList.add('btn-active');
        } else {
            btn.classList.remove('btn-active');
            btn.classList.add('btn-inactive');
        }
    });
}

console.log('[TimeTrendChart] register - initialized');
