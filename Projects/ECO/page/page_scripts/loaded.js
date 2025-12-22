/*
 * Page - loaded
 * ECO (Energy & Cooling Operations) Dashboard
 *
 * Note: 자기완결 컴포넌트(UPS, PDU, CRAC, TempHumiditySensor)가
 *       클릭 시 직접 fetchData로 데이터를 조회하므로
 *       Page 레벨의 globalDataMappings가 필요 없음
 */

// ======================
// DATA MAPPINGS (없음)
// ======================

// 자기완결 컴포넌트 패턴:
// - UPS: 'ups', 'upsHistory' dataset 직접 조회
// - PDU: 'pdu', 'pduCircuits', 'pduHistory' dataset 직접 조회
// - CRAC: 'crac', 'cracHistory' dataset 직접 조회
// - TempHumiditySensor: 'sensor', 'sensorHistory' dataset 직접 조회
// - Page는 데이터 발행 역할 없음

this.globalDataMappings = [];
this.currentParams = {};

// ======================
// INTERVAL MANAGEMENT (구조 유지)
// ======================

this.startAllIntervals = () => {
    this.refreshIntervals = {};
};

this.stopAllIntervals = () => {
    const { each } = fx;
    fx.go(
        Object.values(this.refreshIntervals || {}),
        each(interval => clearInterval(interval))
    );
};

console.log('[Page] loaded - ECO Dashboard self-contained component mode');
