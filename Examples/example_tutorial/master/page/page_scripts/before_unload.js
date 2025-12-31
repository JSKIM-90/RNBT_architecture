/**
 * Master - before_unload.js
 *
 * 호출 시점: 앱 종료 직전
 *
 * 책임:
 * - Master 레벨 리소스 정리
 * - 이벤트 핸들러 해제
 * - 데이터 매핑 해제
 * - 인터벌 정지
 *
 * 패턴 포인트:
 * - 모든 리소스를 명시적으로 정리
 * - null 할당으로 GC 대상화
 */

const { offEventBusHandlers } = WKit;
const { each } = fx;

// ======================
// CLEANUP
// ======================

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
 * 인터벌 정지 (확장 시 사용)
 */
if (this.intervals) {
    Object.values(this.intervals).forEach(clearInterval);
    this.intervals = null;
}

console.log('[Master] before_unload - Cleanup completed');
