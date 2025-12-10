/*
 * Page - loaded
 * IPSILON_3D Temperature Monitoring Dashboard
 *
 * Responsibilities:
 * - Register global data mappings (on-demand only)
 *
 * Note: 3D 센서는 개별 클릭 시 데이터를 조회하므로
 *       폴링 방식의 데이터 발행이 필요 없음
 */

const { each } = fx;

// ======================
// GLOBAL DATA MAPPINGS
// ======================

// sensorDetail: 센서 클릭 시 on-demand로 조회
this.globalDataMappings = [
    {
        topic: 'sensorDetail',
        datasetInfo: {
            datasetName: 'sensorDetail',
            param: {}
        }
        // refreshInterval 없음 (on-demand)
    }
];

// ======================
// PARAM MANAGEMENT
// ======================

this.currentParams = {};

fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => this.currentParams[topic] = {})
    // fetchAndPublish 하지 않음 (on-demand)
);

// ======================
// INTERVAL MANAGEMENT (사용하지 않지만 구조 유지)
// ======================

this.startAllIntervals = () => {
    this.refreshIntervals = {};
};

this.stopAllIntervals = () => {
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

console.log('[Page] loaded - data mappings registered (on-demand mode)');
