/*
 * Page - TimeTrendChart Component - register
 * 시간대별 거래추이 (Area Chart with 5 series)
 *
 * Subscribes to: timeTrendData
 * Events: @filterClicked
 *
 * Expected Raw API Data Structure:
 * [
 *   { tm: "00", val_max: 1200, val_year: 1100, val_month: 600, val_prev: 400, val_today: 300 },
 *   { tm: "02", val_max: 1300, val_year: 1150, val_month: 650, val_prev: 420, val_today: 320 },
 *   ...
 * ]
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;

// ======================
// CONFIG (정적 선언)
// ======================

const config = {
    // Raw API 필드 매핑
    xKey: 'tm',             // X축에 사용할 API 필드

    // 시리즈 정의: key는 API 필드명, name은 범례 표시명
    seriesMap: [
        { key: 'val_max', name: '역대픽', color: '#526FE5' },
        { key: 'val_year', name: '연중최고픽', color: '#52BEE5' },
        { key: 'val_month', name: '월픽', color: '#009178' },
        { key: 'val_prev', name: '전일', color: '#52E5C3' },
        { key: 'val_today', name: '금일', color: '#AAFD84' }
    ],

    // 시리즈 공통 스타일
    smooth: true,
    symbol: 'none',
    areaStyle: true,        // Area 차트 여부
    areaGradient: true,     // 그라데이션 채우기

    // Y축 설정
    yAxis: {
        min: 0,
        max: 1800,
        interval: 600
    }
};

// ======================
// BINDNGS (커링 + 바인딩)
// ======================

this.renderChart = fx.curry(renderLineData)(config).bind(this);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    timeTrendData: ['renderChart']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// INITIALIZE ECHARTS
// ======================

const chartContainer = this.appendElement.querySelector('#echarts');
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
// RENDER FUNCTION (호이스팅)
// ======================

function renderLineData(config, { response }) {
    const { data } = response;
    if (!data || !data[Symbol.iterator]) return;

    const { xKey, seriesMap, smooth, symbol, areaStyle, areaGradient, yAxis } = config;

    const option = {
        xAxis: {
            type: 'category',
            data: fx.go(data, fx.map(d => d[xKey]))
        },
        yAxis: {
            type: 'value',
            min: yAxis.min,
            max: yAxis.max,
            interval: yAxis.interval
        },
        series: fx.go(
            seriesMap,
            fx.map(s => ({
                name: s.name,
                type: 'line',
                smooth,
                symbol,
                data: fx.go(data, fx.map(d => d[s.key])),
                itemStyle: { color: s.color },
                lineStyle: { color: s.color, width: 2 },
                areaStyle: areaStyle ? {
                    color: areaGradient ? {
                        type: 'linear',
                        x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: s.color + '80' },
                            { offset: 1, color: s.color + '10' }
                        ]
                    } : s.color
                } : undefined
            }))
        )
    };

    try {
        this.chartInstance.setOption(option);
    } catch (e) {
        console.error('[TimeTrendChart] setOption error:', e);
    }
}
