/**
 * Page - before_unload.js
 *
 * 호출 시점: 페이지 이탈 직전
 *
 * 책임:
 * - 모든 인터벌 정지
 * - 이벤트 핸들러 해제
 * - 데이터 매핑 해제
 * - 메모리 정리
 *
 * 패턴 포인트:
 * - 페이지 이탈 시 반드시 리소스 정리
 * - null 할당으로 GC 대상화
 */

const { offEventBusHandlers } = WKit;
const { each } = fx;

// ======================
// CLEANUP
// ======================

/**
 * 인터벌 정지
 */
if (this.stopAllIntervals) {
    this.stopAllIntervals();
}
this.intervals = null;
this.startAllIntervals = null;
this.stopAllIntervals = null;

/**
 * 이벤트 핸들러 해제
 */
if (this.eventBusHandlers) {
    offEventBusHandlers(this.eventBusHandlers);
    this.eventBusHandlers = null;
}

/**
 * 데이터 매핑 해제
 */
if (this.globalDataMappings) {
    fx.go(
        this.globalDataMappings,
        each(({ topic }) => GlobalDataPublisher.unregisterMapping(topic))
    );
    this.globalDataMappings = null;
}

/**
 * 파라미터 상태 정리
 */
this.currentParams = null;

console.log('[Page] before_unload - Cleanup completed');
