/**
 * Page - loaded.js
 *
 * 호출 시점: Page 컴포넌트들이 모두 초기화된 후
 *
 * 책임:
 * - Page 레벨 데이터 매핑 등록
 * - 초기 데이터 발행
 * - 자동 갱신 인터벌 시작
 */

const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

this.globalDataMappings = [
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'statsApi',
            param: {}
        },
        refreshInterval: 10000
    },
    {
        topic: 'tableData',
        datasetInfo: {
            datasetName: 'tableApi',
            param: { category: 'all' }
        },
        refreshInterval: 30000
    },
    {
        topic: 'chartData',
        datasetInfo: {
            datasetName: 'chartApi',
            param: { period: '7d' }
        },
        refreshInterval: 15000
    }
];

// ======================
// INITIALIZATION
// ======================

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => {
        const params = this.currentParams?.[topic] || {};
        GlobalDataPublisher.fetchAndPublish(topic, this, params);
    })
);

// ======================
// AUTO REFRESH
// ======================

this.intervals = {};

this.startAllIntervals = function() {
    fx.go(
        this.globalDataMappings,
        fx.filter(m => m.refreshInterval),
        each(({ topic, refreshInterval }) => {
            this.intervals[topic] = setInterval(() => {
                const params = this.currentParams?.[topic] || {};
                GlobalDataPublisher.fetchAndPublish(topic, this, params);
            }, refreshInterval);
        })
    );
    console.log('[Page] Auto-refresh intervals started');
};

this.stopAllIntervals = function() {
    Object.values(this.intervals).forEach(clearInterval);
    this.intervals = {};
    console.log('[Page] Auto-refresh intervals stopped');
};

this.startAllIntervals();

console.log('[Page] loaded - Data mappings registered, initial data published, intervals started');
