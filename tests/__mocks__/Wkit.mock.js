/**
 * Wkit Mock
 *
 * 실제 Wkit 유틸리티를 테스트 가능하게 Mock합니다.
 * - 2D/3D 이벤트 바인딩
 * - 데이터 fetch
 * - EventBus 핸들러 관리
 * - 인스턴스 검색
 *
 * 의존성: Weventbus (실제 또는 Mock 주입 필요)
 */

function createWkitMock(WeventbusDep = null) {
  // 의존성 주입 또는 기본 mock 사용
  let Weventbus = WeventbusDep;

  // 내부 상태
  const bindEventsHistory = [];
  const removeEventsHistory = [];
  const bind3DEventsHistory = [];
  const fetchDataHistory = [];
  const onEventBusHistory = [];
  const offEventBusHistory = [];
  const emitEventHistory = [];

  // Mock fetch 응답
  const mockFetchResponses = new Map();

  return {
    // ─────────────────────────────────────────
    // 의존성 주입
    // ─────────────────────────────────────────

    /**
     * Weventbus 의존성 설정
     */
    __setWeventbus(dep) {
      Weventbus = dep;
    },

    // ─────────────────────────────────────────
    // Core API: 2D Event Binding
    // ─────────────────────────────────────────

    /**
     * 2D 이벤트 바인딩
     * @param {Object} instance - 컴포넌트 인스턴스
     * @param {Object} customEvents - 이벤트 정의 객체
     */
    bindEvents(instance, customEvents) {
      bindEventsHistory.push({
        instance,
        customEvents,
        timestamp: Date.now(),
      });

      // 실제 이벤트 바인딩 시뮬레이션
      instance.userHandlerList = instance.userHandlerList || {};

      Object.entries(customEvents).forEach(([eventName, selectorList]) => {
        instance.userHandlerList[eventName] = instance.userHandlerList[eventName] || {};
        Object.keys(selectorList).forEach((selector) => {
          const handler = (event) => {
            const triggerEvent = customEvents[eventName][selector];
            if (triggerEvent && Weventbus) {
              Weventbus.emit(triggerEvent, { event, targetInstance: instance });
            }
          };
          instance.userHandlerList[eventName][selector] = handler;

          // appendElement가 있으면 실제로 바인딩
          if (instance.appendElement && instance.appendElement.addEventListener) {
            instance.appendElement.addEventListener(eventName, handler);
          }
        });
      });
    },

    /**
     * 2D 이벤트 제거
     * @param {Object} instance - 컴포넌트 인스턴스
     * @param {Object} customEvents - 이벤트 정의 객체
     */
    removeCustomEvents(instance, customEvents) {
      removeEventsHistory.push({
        instance,
        customEvents,
        timestamp: Date.now(),
      });

      Object.entries(customEvents).forEach(([eventName, selectorList]) => {
        Object.keys(selectorList).forEach((selector) => {
          const handler = instance.userHandlerList?.[eventName]?.[selector];
          if (handler && instance.appendElement && instance.appendElement.removeEventListener) {
            instance.appendElement.removeEventListener(eventName, handler);
          }
        });
      });
    },

    // ─────────────────────────────────────────
    // Core API: 3D Event Binding
    // ─────────────────────────────────────────

    /**
     * 3D 이벤트 바인딩
     * @param {Object} instance - 3D 컴포넌트 인스턴스
     * @param {Object} customEvents - 3D 이벤트 정의 객체
     */
    bind3DEvents(instance, customEvents) {
      bind3DEventsHistory.push({
        instance,
        customEvents,
        timestamp: Date.now(),
      });

      instance.appendElement = instance.appendElement || {};
      instance.appendElement.eventListener = {};

      Object.keys(customEvents).forEach((browserEvent) => {
        const eventHandler = (event) => {
          const triggerEvent = customEvents[browserEvent];
          if (triggerEvent && Weventbus) {
            Weventbus.emit(triggerEvent, { event, targetInstance: instance });
          }
        };
        instance.appendElement.eventListener[browserEvent] = eventHandler;
      });
    },

    /**
     * 3D 리소스 정리 (Mock)
     */
    dispose3DTree(rootContainer) {
      // Mock: 실제 Three.js 정리 로직 없이 기록만
      return true;
    },

    /**
     * Scene background 정리 (Mock)
     */
    clearSceneBackground(scene) {
      if (scene) {
        scene.background = null;
      }
    },

    /**
     * 모든 3D 리소스 정리 (Mock)
     */
    disposeAllThreeResources(page) {
      // Mock: 실제 Three.js 정리 없이 기록만
      return true;
    },

    // ─────────────────────────────────────────
    // Core API: Data Fetching
    // ─────────────────────────────────────────

    /**
     * 데이터 fetch
     * @param {Object} page - 페이지 인스턴스 (dataService 포함)
     * @param {string} datasetName - 데이터셋 이름
     * @param {Object} param - 요청 파라미터
     * @returns {Promise}
     */
    fetchData(page, datasetName, param) {
      fetchDataHistory.push({
        page,
        datasetName,
        param,
        timestamp: Date.now(),
      });

      // Mock 응답 반환
      const mockKey = `${datasetName}:${JSON.stringify(param || {})}`;
      const mockResponse = mockFetchResponses.get(mockKey) || mockFetchResponses.get(datasetName);

      if (mockResponse !== undefined) {
        return Promise.resolve(mockResponse);
      }

      // 기본 Mock 응답
      return Promise.resolve({ data: null });
    },

    // ─────────────────────────────────────────
    // Core API: EventBus Handlers
    // ─────────────────────────────────────────

    /**
     * EventBus 핸들러 등록
     * @param {Object} eventBusHandlers - { eventName: handler } 객체
     */
    onEventBusHandlers(eventBusHandlers) {
      onEventBusHistory.push({
        handlers: eventBusHandlers,
        timestamp: Date.now(),
      });

      if (Weventbus) {
        Object.entries(eventBusHandlers).forEach(([eventName, handler]) => {
          Weventbus.on(eventName, handler);
        });
      }
    },

    /**
     * EventBus 핸들러 해제
     * @param {Object} eventBusHandlers - { eventName: handler } 객체
     */
    offEventBusHandlers(eventBusHandlers) {
      offEventBusHistory.push({
        handlers: eventBusHandlers,
        timestamp: Date.now(),
      });

      if (Weventbus) {
        Object.entries(eventBusHandlers).forEach(([eventName, handler]) => {
          Weventbus.off(eventName, handler);
        });
      }
    },

    // ─────────────────────────────────────────
    // Core API: Helper Functions
    // ─────────────────────────────────────────

    /**
     * 페이지에서 인스턴스 이터레이터 생성 (Mock)
     */
    makeIterator(page, ...layerList) {
      layerList = layerList.length ? layerList : ['masterLayer', 'twoLayer', 'threeLayer'];
      const instances = [];

      layerList.forEach((layer) => {
        const mapName =
          layer === 'threeLayer' ? '_appendElementListMap' : 'componentInstanceListMap';
        const map = page?.[layer]?.[mapName];
        if (map && map.values) {
          instances.push(...Array.from(map.values()));
        }
      });

      return instances[Symbol.iterator]();
    },

    /**
     * 이름으로 인스턴스 찾기
     */
    getInstanceByName(instanceName, iter) {
      for (const ins of iter) {
        if (ins.name === instanceName) return ins;
      }
      return undefined;
    },

    /**
     * ID로 인스턴스 찾기
     */
    getInstanceById(targetId, iter) {
      for (const ins of iter) {
        if (ins.id === targetId) return ins;
      }
      return undefined;
    },

    /**
     * 이벤트 발생 (코드에서 직접 호출)
     */
    emitEvent(eventName, targetInstance) {
      emitEventHistory.push({
        eventName,
        targetInstance,
        timestamp: Date.now(),
      });

      if (Weventbus) {
        Weventbus.emit(eventName, { targetInstance });
      }
    },

    /**
     * Selector 기반 요소 조작
     */
    withSelector(element, selector, fn) {
      if (!element) return null;
      const target = element.querySelector ? element.querySelector(selector) : null;
      return target ? fn(target) : null;
    },

    // ─────────────────────────────────────────
    // Core API: Schema Utilities (테스트용 기본값)
    // ─────────────────────────────────────────

    getGlobalMappingSchema() {
      return [
        {
          topic: 'users',
          datasetInfo: {
            datasetName: 'dummyjson',
            param: { dataType: 'users', id: 'default' },
          },
        },
      ];
    },

    getCustomEventsSchema() {
      return {
        click: {
          '.navbar-brand': '@triggerNavbarTitle',
          '.nav-link': '@triggerNavLink',
        },
      };
    },

    getCustomEventsSchemaFor3D() {
      return {
        click: '@triggerClick',
      };
    },

    getSubscriptionSchema() {
      return {
        users: ['method1', 'method2'],
      };
    },

    // ─────────────────────────────────────────
    // Test Helpers (테스트 전용 API)
    // ─────────────────────────────────────────

    /**
     * 모든 상태 초기화
     */
    __reset() {
      bindEventsHistory.length = 0;
      removeEventsHistory.length = 0;
      bind3DEventsHistory.length = 0;
      fetchDataHistory.length = 0;
      onEventBusHistory.length = 0;
      offEventBusHistory.length = 0;
      emitEventHistory.length = 0;
      mockFetchResponses.clear();
    },

    /**
     * Mock fetch 응답 설정
     */
    __setMockFetchResponse(datasetName, response, param = null) {
      const key = param ? `${datasetName}:${JSON.stringify(param)}` : datasetName;
      mockFetchResponses.set(key, response);
    },

    /**
     * bindEvents 호출 기록 반환
     */
    __getBindEventsHistory() {
      return [...bindEventsHistory];
    },

    /**
     * removeCustomEvents 호출 기록 반환
     */
    __getRemoveEventsHistory() {
      return [...removeEventsHistory];
    },

    /**
     * bind3DEvents 호출 기록 반환
     */
    __getBind3DEventsHistory() {
      return [...bind3DEventsHistory];
    },

    /**
     * fetchData 호출 기록 반환
     */
    __getFetchDataHistory() {
      return [...fetchDataHistory];
    },

    /**
     * onEventBusHandlers 호출 기록 반환
     */
    __getOnEventBusHistory() {
      return [...onEventBusHistory];
    },

    /**
     * offEventBusHandlers 호출 기록 반환
     */
    __getOffEventBusHistory() {
      return [...offEventBusHistory];
    },

    /**
     * emitEvent 호출 기록 반환
     */
    __getEmitEventHistory() {
      return [...emitEventHistory];
    },

    /**
     * 특정 인스턴스에 bindEvents가 호출되었는지 확인
     */
    __wasBindEventsCalled(instance) {
      return bindEventsHistory.some((h) => h.instance === instance);
    },

    /**
     * 특정 인스턴스에 removeCustomEvents가 호출되었는지 확인
     */
    __wasRemoveEventsCalled(instance) {
      return removeEventsHistory.some((h) => h.instance === instance);
    },

    /**
     * bindEvents/removeCustomEvents 쌍이 맞는지 검증
     */
    __verifyCleanup(instance) {
      const bindCount = bindEventsHistory.filter((h) => h.instance === instance).length;
      const removeCount = removeEventsHistory.filter((h) => h.instance === instance).length;
      return bindCount === removeCount;
    },

    /**
     * onEventBusHandlers/offEventBusHandlers 쌍이 맞는지 검증
     */
    __verifyEventBusCleanup() {
      return onEventBusHistory.length === offEventBusHistory.length;
    },
  };
}

// 싱글톤 인스턴스
const WkitMock = createWkitMock();

module.exports = {
  Wkit: WkitMock,
  createWkitMock,
};
