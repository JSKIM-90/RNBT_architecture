/*
 * Page - CpuStatus Component - register
 * 주요 업무 그룹 CPU 현황 컴포넌트
 *
 * Subscribes to: cpuStatusData
 * Events: @chartClicked
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   items: [
 *     { name: '상품', value: 24, color: '#E3B500', labelColor: 'cyan' },
 *     { name: '디지털업무', value: 20, color: '#00A9AE', labelColor: 'yellow' },
 *     { name: 'EBK', value: 18, color: '#00A9AE', labelColor: 'cyan' },
 *     { name: '채널EIC', value: 2, color: '#DF7200', labelColor: 'orange' },
 *     { name: '대내EIC', value: 5, color: '#00A9AE', labelColor: 'cyan' },
 *     { name: '대외EIC', value: 8, color: '#BE1813', labelColor: 'red' }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// CHART CONFIGURATION
// ======================

const chartConfig = {
    trackColor: '#22302B',
    radius: ['75%', '90%'],
    labelFontSize: 14,
    labelFontWeight: 700
};

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.chart-item': '@chartClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    cpuStatusData: ['renderData']
};

this.renderData = renderData.bind(this);

go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// CHART INSTANCES
// ======================

this.charts = [];

// ======================
// RENDER FUNCTIONS
// ======================

function renderData({ response }) {
    const { data } = response;
    if (!data || !data.items) return;

    const { items } = data;
    console.log(`[CpuStatus] renderData: ${items.length} items`);

    const contentsEl = this.appendElement.querySelector('.contents');
    if (!contentsEl) return;

    // Clear existing content
    contentsEl.innerHTML = '';

    // Dispose existing charts
    this.charts.forEach(chart => chart?.dispose());
    this.charts = [];

    // Render each chart item
    items.forEach((item, index) => {
        // Create chart item structure
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.dataset.index = index;
        chartItem.dataset.name = item.name;

        // Chart container
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.id = `cpu-chart-${index}`;

        // Label
        const label = document.createElement('div');
        label.className = `item-label item-label-${item.labelColor}`;
        label.innerHTML = `<p>${item.name}</p>`;

        chartItem.appendChild(chartContainer);
        chartItem.appendChild(label);
        contentsEl.appendChild(chartItem);

        // Initialize ECharts
        const chart = echarts.init(chartContainer);
        this.charts.push(chart);

        // Set chart option
        chart.setOption(createPieOption(item, chartConfig));
    });
}

// ======================
// CHART OPTION FACTORY
// ======================

function createPieOption(item, config) {
    return {
        series: [{
            type: 'pie',
            radius: config.radius,
            center: ['50%', '50%'],
            startAngle: 90,
            silent: true,
            data: [
                {
                    value: item.value,
                    itemStyle: { color: item.color }
                },
                {
                    value: 100 - item.value,
                    itemStyle: { color: config.trackColor }
                }
            ],
            label: { show: false },
            labelLine: { show: false }
        }],
        graphic: {
            type: 'text',
            left: 'center',
            top: 'center',
            style: {
                text: `${item.value}%`,
                fill: '#ffffff',
                fontSize: config.labelFontSize,
                fontWeight: config.labelFontWeight,
                fontFamily: 'Pretendard',
                textAlign: 'center',
                textVerticalAlign: 'middle'
            }
        }
    };
}
