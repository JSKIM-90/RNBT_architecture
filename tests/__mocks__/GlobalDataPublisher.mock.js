/**
 * GlobalDataPublisher Mock
 *
 * 실제 GlobalDataPublisher의 pub-sub 패턴을 테스트 가능하게 Mock합니다.
 * - Topic 기반 구독/발행 시스템
 * - 데이터 매핑 관리
 * - fetchAndPublish 시뮬레이션
 */

function createGlobalDataPublisherMock() {
  // 내부 상태
  const mappings = new Map(); // topic -> { datasetInfo, ... }
  const subscribers = new Map(); // topic -> Map<instance, Set<handler>>
  const publishHistory = [];
  const subscribeHistory = [];
  const unsubscribeHistory = [];
  const registerHistory = [];
  const unregisterHistory = [];

  // Mock 데이터 저장소 (fetchAndPublish에서 반환할 데이터)
  const mockResponses = new Map(); // topic -> response data

  return {
    // ─────────────────────────────────────────
    // Core API (실제 GlobalDataPublisher와 동일 인터페이스)
    // ─────────────────────────────────────────

    /**
     * Topic-데이터셋 매핑 등록
     * @param {Object} mapping - { topic, datasetInfo: { datasetName, param } }
     */
    registerMapping(mapping) {
      const { topic, datasetInfo } = mapping;
      mappings.set(topic, { datasetInfo, ...mapping });
      registerHistory.push({ mapping, timestamp: Date.now() });
    },

    /**
     * Topic 매핑 해제
     * @param {string} topic
     */
    unregisterMapping(topic) {
      mappings.delete(topic);
      unregisterHistory.push({ topic, timestamp: Date.now() });
    },

    /**
     * 컴포넌트가 topic 구독
     * @param {string} topic
     * @param {Object} instance - 컴포넌트 인스턴스
     * @param {Function} handler - 콜백 함수
     */
    subscribe(topic, instance, handler) {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Map());
      }
      const topicSubs = subscribers.get(topic);
      if (!topicSubs.has(instance)) {
        topicSubs.set(instance, new Set());
      }
      topicSubs.get(instance).add(handler);
      subscribeHistory.push({ topic, instance, handler, timestamp: Date.now() });
    },

    /**
     * 컴포넌트의 topic 구독 해제
     * @param {string} topic
     * @param {Object} instance - 컴포넌트 인스턴스
     */
    unsubscribe(topic, instance) {
      if (subscribers.has(topic)) {
        subscribers.get(topic).delete(instance);
      }
      unsubscribeHistory.push({ topic, instance, timestamp: Date.now() });
    },

    /**
     * 데이터 fetch 후 구독자에게 발행
     * @param {string} topic
     * @param {Object} page - 페이지 인스턴스 (dataService 포함)
     * @param {Object} params - 요청 파라미터 (optional)
     * @returns {Promise}
     */
    async fetchAndPublish(topic, page, params = {}) {
      const mapping = mappings.get(topic);
      const mockData = mockResponses.get(topic);

      const response = mockData !== undefined ? mockData : { data: null };

      publishHistory.push({
        topic,
        page,
        params,
        response,
        timestamp: Date.now(),
      });

      // 구독자에게 발행
      if (subscribers.has(topic)) {
        const topicSubs = subscribers.get(topic);
        topicSubs.forEach((handlers, instance) => {
          handlers.forEach((handler) => {
            try {
              handler({ response });
            } catch (e) {
              console.error(`[GlobalDataPublisher Mock] Handler error:`, e);
            }
          });
        });
      }

      return response;
    },

    // ─────────────────────────────────────────
    // Test Helpers (테스트 전용 API)
    // ─────────────────────────────────────────

    /**
     * 모든 상태 초기화
     */
    __reset() {
      mappings.clear();
      subscribers.clear();
      mockResponses.clear();
      publishHistory.length = 0;
      subscribeHistory.length = 0;
      unsubscribeHistory.length = 0;
      registerHistory.length = 0;
      unregisterHistory.length = 0;
    },

    /**
     * Mock 응답 데이터 설정
     * @param {string} topic
     * @param {Object} response - fetchAndPublish 시 반환할 데이터
     */
    __setMockResponse(topic, response) {
      mockResponses.set(topic, response);
    },

    /**
     * 여러 topic에 Mock 응답 설정
     * @param {Object} responses - { topic1: response1, topic2: response2, ... }
     */
    __setMockResponses(responses) {
      Object.entries(responses).forEach(([topic, response]) => {
        mockResponses.set(topic, response);
      });
    },

    /**
     * 등록된 매핑 정보 반환
     */
    __getMappings() {
      const result = {};
      mappings.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    },

    /**
     * 특정 topic의 구독자 수 반환
     */
    __getSubscriberCount(topic) {
      if (!subscribers.has(topic)) return 0;
      let count = 0;
      subscribers.get(topic).forEach((handlers) => {
        count += handlers.size;
      });
      return count;
    },

    /**
     * 특정 topic의 구독 인스턴스 목록 반환
     */
    __getSubscribedInstances(topic) {
      if (!subscribers.has(topic)) return [];
      return Array.from(subscribers.get(topic).keys());
    },

    /**
     * publish 호출 기록 반환
     */
    __getPublishHistory() {
      return [...publishHistory];
    },

    /**
     * 특정 topic의 publish 기록만 반환
     */
    __getPublishHistoryFor(topic) {
      return publishHistory.filter((h) => h.topic === topic);
    },

    /**
     * subscribe 호출 기록 반환
     */
    __getSubscribeHistory() {
      return [...subscribeHistory];
    },

    /**
     * unsubscribe 호출 기록 반환
     */
    __getUnsubscribeHistory() {
      return [...unsubscribeHistory];
    },

    /**
     * registerMapping 호출 기록 반환
     */
    __getRegisterHistory() {
      return [...registerHistory];
    },

    /**
     * unregisterMapping 호출 기록 반환
     */
    __getUnregisterHistory() {
      return [...unregisterHistory];
    },

    /**
     * 특정 topic이 등록되었는지 확인
     */
    __isRegistered(topic) {
      return mappings.has(topic);
    },

    /**
     * 특정 topic에 특정 instance가 구독 중인지 확인
     */
    __isSubscribed(topic, instance) {
      if (!subscribers.has(topic)) return false;
      return subscribers.get(topic).has(instance);
    },

    /**
     * 특정 topic이 publish되었는지 확인
     */
    __wasPublished(topic) {
      return publishHistory.some((h) => h.topic === topic);
    },

    /**
     * 특정 topic의 publish 횟수 반환
     */
    __getPublishCount(topic) {
      return publishHistory.filter((h) => h.topic === topic).length;
    },

    /**
     * 모든 구독 정보 요약 반환 (디버깅용)
     */
    __getSubscriptionSummary() {
      const result = {};
      subscribers.forEach((instanceMap, topic) => {
        result[topic] = {};
        instanceMap.forEach((handlers, instance) => {
          const instanceId = instance.id || instance.name || 'unknown';
          result[topic][instanceId] = handlers.size;
        });
      });
      return result;
    },
  };
}

// 싱글톤 인스턴스
const GlobalDataPublisherMock = createGlobalDataPublisherMock();

module.exports = {
  GlobalDataPublisher: GlobalDataPublisherMock,
  createGlobalDataPublisherMock,
};
