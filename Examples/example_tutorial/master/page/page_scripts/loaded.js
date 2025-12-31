/**
 * Master - loaded.js
 *
 * 호출 시점: Master 컴포넌트들이 모두 초기화된 후
 *
 * 책임:
 * - Master 레벨 데이터 매핑 등록
 * - 초기 데이터 발행
 * - 자동 갱신 인터벌 시작 (필요시)
 *
 * 패턴 포인트:
 * - globalDataMappings: topic과 dataset을 연결
 * - Master 데이터는 앱 전체에서 공유됨
 * - 정적 데이터(user, menu)는 refreshInterval 없음
 */

const { each } = fx;

// ======================
// DATA MAPPINGS
// ======================

/**
 * Master 레벨 데이터 매핑 정의
 *
 * 구조:
 * - topic: 컴포넌트가 구독할 주제명
 * - datasetInfo: datasetList.json의 dataset 연결
 *   - datasetName: dataset의 name
 *   - param: API 호출 시 전달할 파라미터
 * - refreshInterval: 자동 갱신 주기 (ms), 없으면 1회만
 */
this.globalDataMappings = [
    {
        topic: 'userInfo',
        datasetInfo: {
            datasetName: 'userApi',
            param: {}
        }
        // refreshInterval 없음 = 정적 데이터 (1회만 로드)
    },
    {
        topic: 'menuList',
        datasetInfo: {
            datasetName: 'menuApi',
            param: {}
        }
        // refreshInterval 없음 = 정적 데이터
    }
];

// ======================
// INITIALIZATION
// ======================

/**
 * 데이터 매핑 등록 및 초기 발행
 *
 * 흐름:
 * 1. GlobalDataPublisher에 매핑 등록
 * 2. 각 topic에 대해 초기 데이터 발행
 */
fx.go(
    this.globalDataMappings,
    each(GlobalDataPublisher.registerMapping),
    each(({ topic }) => {
        GlobalDataPublisher.fetchAndPublish(topic, this.page);
    })
);

console.log('[Master] loaded - Data mappings registered and initial data published');

// ======================
// EXTENSION POINT
// ======================

/**
 * 확장 포인트: 자동 갱신이 필요한 Master 데이터
 *
 * 예: 실시간 알림
 * this.globalDataMappings.push({
 *     topic: 'notifications',
 *     datasetInfo: { datasetName: 'notificationApi', param: { limit: 5 } },
 *     refreshInterval: 5000
 * });
 *
 * 그 후 startAllIntervals() 호출
 */
