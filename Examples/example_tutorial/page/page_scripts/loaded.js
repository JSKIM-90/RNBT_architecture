/**
 * Page - loaded.js
 *
 * 호출 시점: Page 컴포넌트들이 모두 초기화된 후
 *
 * 책임:
 * - Page 레벨 데이터 매핑 등록
 * - 초기 데이터 발행
 * - 자동 갱신 인터벌 시작
 *
 * 패턴 포인트:
 * - globalDataMappings: topic과 dataset 연결
 * - refreshInterval: 자동 갱신 주기
 * - startAllIntervals(): 인터벌 시작
 */

const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

/**
 * Page 레벨 데이터 매핑 정의
 *
 * 주요 속성:
 * - topic: 컴포넌트가 구독할 주제명
 * - datasetInfo.datasetName: datasetList.json의 name
 * - datasetInfo.param: 기본 파라미터
 * - refreshInterval: 자동 갱신 주기 (ms)
 */
this.globalDataMappings = [
    {
        topic: 'stats',
        datasetInfo: {
            datasetName: 'statsApi',
            param: {}
        },
        refreshInterval: 10000  // 10초마다 갱신
    },
    {
        topic: 'tableData',
        datasetInfo: {
            datasetName: 'tableApi',
            param: { category: 'all' }
        },
        refreshInterval: 30000  // 30초마다 갱신
    },
    {
        topic: 'chartData',
        datasetInfo: {
            datasetName: 'chartApi',
            param: { period: '7d' }
        },
        refreshInterval: 15000  // 15초마다 갱신
    }
];

// ======================
// INITIALIZATION
// ======================

/**
 * 데이터 매핑 등록 및 초기 발행
 */
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => {
        // currentParams에서 초기값 가져오기 (before_load에서 설정됨)
        const params = this.currentParams?.[topic] || {};
        GlobalDataPublisher.fetchAndPublish(topic, this, params);
    })
);

// ======================
// AUTO REFRESH
// ======================

/**
 * 인터벌 저장소
 */
this.intervals = {};

/**
 * 모든 인터벌 시작
 *
 * refreshInterval이 있는 매핑에 대해 자동 갱신 설정
 */
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

/**
 * 모든 인터벌 정지
 */
this.stopAllIntervals = function() {
    Object.values(this.intervals).forEach(clearInterval);
    this.intervals = {};
    console.log('[Page] Auto-refresh intervals stopped');
};

// 인터벌 시작
this.startAllIntervals();

console.log('[Page] loaded - Data mappings registered, initial data published, intervals started');
