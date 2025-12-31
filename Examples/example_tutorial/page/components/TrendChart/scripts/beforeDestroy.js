/**
 * Page - TrendChart Component - beforeDestroy.js
 *
 * 호출 시점: 컴포넌트 제거 직전
 *
 * 책임:
 * - ECharts 인스턴스 정리
 * - ResizeObserver 해제
 * - 구독 해제
 * - 이벤트 핸들러 해제
 * - 참조 정리
 */

const { unsubscribe } = GlobalDataPublisher;
const { unbindEvents } = WKit;

// ======================
// CLEANUP
// ======================

// ResizeObserver 해제
if (this.resizeObserver) {
    this.resizeObserver.disconnect();
    this.resizeObserver = null;
}

// ECharts 인스턴스 정리
if (this.chartInstance) {
    this.chartInstance.dispose();
    this.chartInstance = null;
}

// 구독 해제
if (this.subscriptions) {
    fx.go(
        Object.entries(this.subscriptions),
        fx.each(([topic, fnList]) =>
            fx.each(fn => this[fn] && unsubscribe(topic, this, this[fn]), fnList)
        )
    );
    this.subscriptions = null;
}

// 이벤트 해제
if (this.customEvents) {
    unbindEvents(this, this.customEvents);
    this.customEvents = null;
}

this.renderChart = null;

console.log('[TrendChart] Destroyed');
