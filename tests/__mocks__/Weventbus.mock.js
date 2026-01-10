/**
 * Weventbus Mock
 *
 * 실제 Weventbus의 pub-sub 패턴을 테스트 가능하게 Mock합니다.
 * - 모든 이벤트 발행/구독 기록
 * - 동기적 실행으로 테스트 예측 가능성 확보
 * - 스파이 기능으로 호출 검증
 */

function createWeventbusMock() {
  const listeners = new Map();
  const emitHistory = [];
  const onHistory = [];
  const offHistory = [];

  return {
    // ─────────────────────────────────────────
    // Core API (실제 Weventbus와 동일 인터페이스)
    // ─────────────────────────────────────────

    on(event, callback) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(callback);
      onHistory.push({ event, callback, timestamp: Date.now() });
    },

    off(event, callback) {
      if (!listeners.has(event)) return;
      const newList = listeners.get(event).filter((cb) => cb !== callback);
      listeners.set(event, newList);
      offHistory.push({ event, callback, timestamp: Date.now() });
    },

    emit(event, data) {
      emitHistory.push({ event, data, timestamp: Date.now() });
      if (!listeners.has(event)) return;
      listeners.get(event).forEach((callback) => callback(data));
    },

    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    },

    // ─────────────────────────────────────────
    // Test Helpers (테스트 전용 API)
    // ─────────────────────────────────────────

    /**
     * 모든 상태 초기화
     */
    __reset() {
      listeners.clear();
      emitHistory.length = 0;
      onHistory.length = 0;
      offHistory.length = 0;
    },

    /**
     * 특정 이벤트에 등록된 리스너 수 반환
     */
    __getListenerCount(event) {
      return listeners.has(event) ? listeners.get(event).length : 0;
    },

    /**
     * 모든 등록된 이벤트 목록 반환
     */
    __getRegisteredEvents() {
      return Array.from(listeners.keys());
    },

    /**
     * emit 호출 기록 반환
     */
    __getEmitHistory() {
      return [...emitHistory];
    },

    /**
     * 특정 이벤트의 emit 기록만 반환
     */
    __getEmitHistoryFor(event) {
      return emitHistory.filter((h) => h.event === event);
    },

    /**
     * on 호출 기록 반환
     */
    __getOnHistory() {
      return [...onHistory];
    },

    /**
     * off 호출 기록 반환
     */
    __getOffHistory() {
      return [...offHistory];
    },

    /**
     * 특정 이벤트가 emit되었는지 확인
     */
    __wasEmitted(event) {
      return emitHistory.some((h) => h.event === event);
    },

    /**
     * 특정 이벤트가 특정 데이터와 함께 emit되었는지 확인
     */
    __wasEmittedWith(event, expectedData) {
      return emitHistory.some(
        (h) => h.event === event && JSON.stringify(h.data) === JSON.stringify(expectedData)
      );
    },

    /**
     * 특정 이벤트의 emit 횟수 반환
     */
    __getEmitCount(event) {
      return emitHistory.filter((h) => h.event === event).length;
    },

    /**
     * 현재 리스너 맵 반환 (디버깅용)
     */
    __getListenersMap() {
      const result = {};
      listeners.forEach((callbacks, event) => {
        result[event] = callbacks.length;
      });
      return result;
    },
  };
}

// 싱글톤 인스턴스 (실제 Weventbus처럼 사용)
const WeventbusMock = createWeventbusMock();

// Factory 함수도 export (독립 인스턴스 필요 시)
module.exports = {
  Weventbus: WeventbusMock,
  createWeventbusMock,
};
