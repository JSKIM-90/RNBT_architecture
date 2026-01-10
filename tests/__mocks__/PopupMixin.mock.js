/**
 * PopupMixin Mock
 *
 * 실제 PopupMixin의 Shadow DOM 팝업 기능을 테스트 가능하게 Mock합니다.
 * - applyShadowPopupMixin: 기본 Shadow DOM 팝업
 * - applyEChartsMixin: ECharts 차트 관리
 * - applyTabulatorMixin: Tabulator 테이블 관리
 *
 * DOM 없이도 팝업 라이프사이클을 테스트할 수 있습니다.
 */

function createPopupMixinMock() {
  // 내부 상태 추적
  const appliedMixins = [];
  const popupHistory = [];
  const chartHistory = [];
  const tableHistory = [];

  const PopupMixin = {};

  /**
   * ─────────────────────────────────────────
   * applyShadowPopupMixin - 기본 Shadow DOM 팝업 Mock
   * ─────────────────────────────────────────
   */
  PopupMixin.applyShadowPopupMixin = function (instance, options) {
    const { getHTML, getStyles, onCreated } = options;

    appliedMixins.push({
      type: 'ShadowPopup',
      instance,
      options,
      timestamp: Date.now(),
    });

    // Internal state (실제와 동일한 구조)
    instance._popup = {
      host: null,
      shadowRoot: null,
      eventCleanups: [],
      charts: new Map(), // EChartsMixin에서 사용
      tables: new Map(), // TabulatorMixin에서 사용
    };

    /**
     * Shadow DOM 팝업 생성 (Mock)
     */
    instance.createPopup = function () {
      if (instance._popup.host) return instance._popup.shadowRoot;

      // Mock DOM 요소 생성
      instance._popup.host = {
        id: `popup-${instance.id || 'unknown'}`,
        style: { display: 'none' },
        remove: function () {
          popupHistory.push({
            action: 'remove',
            instance,
            timestamp: Date.now(),
          });
        },
      };

      // Mock shadowRoot
      instance._popup.shadowRoot = {
        innerHTML: '',
        querySelector: function (selector) {
          return { selector, textContent: '', dataset: {}, style: {} };
        },
        querySelectorAll: function (selector) {
          return [];
        },
      };

      // 스타일 + HTML 저장 (테스트에서 검증 가능)
      const html = getHTML ? getHTML.call(instance) : '';
      const styles = getStyles ? getStyles.call(instance) : '';
      instance._popup.shadowRoot.innerHTML = `<style>${styles}</style>${html}`;

      popupHistory.push({
        action: 'create',
        instance,
        html,
        styles,
        timestamp: Date.now(),
      });

      // 콜백 호출
      if (onCreated) {
        onCreated.call(instance, instance._popup.shadowRoot);
      }

      return instance._popup.shadowRoot;
    };

    /**
     * 팝업 표시
     */
    instance.showPopup = function () {
      if (!instance._popup.host) {
        instance.createPopup();
      }
      instance._popup.host.style.display = 'block';

      popupHistory.push({
        action: 'show',
        instance,
        timestamp: Date.now(),
      });
    };

    /**
     * 팝업 숨김
     */
    instance.hidePopup = function () {
      if (instance._popup.host) {
        instance._popup.host.style.display = 'none';
      }

      popupHistory.push({
        action: 'hide',
        instance,
        timestamp: Date.now(),
      });
    };

    /**
     * Shadow DOM 내부 요소 선택
     */
    instance.popupQuery = function (selector) {
      if (!instance._popup.shadowRoot) return null;
      return instance._popup.shadowRoot.querySelector(selector);
    };

    /**
     * Shadow DOM 내부 요소 모두 선택
     */
    instance.popupQueryAll = function (selector) {
      if (!instance._popup.shadowRoot) return [];
      return instance._popup.shadowRoot.querySelectorAll(selector);
    };

    /**
     * 이벤트 델리게이션 바인딩 (Mock)
     */
    instance.bindPopupEvents = function (events) {
      if (!instance._popup.shadowRoot) return;

      Object.entries(events).forEach(([eventType, handlers]) => {
        Object.entries(handlers).forEach(([selector, handler]) => {
          const cleanup = () => {
            popupHistory.push({
              action: 'unbindEvent',
              instance,
              eventType,
              selector,
              timestamp: Date.now(),
            });
          };
          instance._popup.eventCleanups.push(cleanup);

          popupHistory.push({
            action: 'bindEvent',
            instance,
            eventType,
            selector,
            handler,
            timestamp: Date.now(),
          });
        });
      });
    };

    /**
     * 팝업 및 리소스 정리 (체이닝 패턴의 기본)
     */
    instance.destroyPopup = function () {
      if (!instance._popup.host) return;

      // 이벤트 정리
      instance._popup.eventCleanups.forEach((cleanup) => cleanup());
      instance._popup.eventCleanups = [];

      // DOM 제거
      instance._popup.host.remove();

      popupHistory.push({
        action: 'destroy',
        instance,
        timestamp: Date.now(),
      });

      // 상태 초기화
      instance._popup.host = null;
      instance._popup.shadowRoot = null;
    };
  };

  /**
   * ─────────────────────────────────────────
   * applyEChartsMixin - ECharts 차트 관리 Mock
   * ─────────────────────────────────────────
   */
  PopupMixin.applyEChartsMixin = function (instance) {
    if (!instance._popup) {
      throw new Error('applyShadowPopupMixin must be called before applyEChartsMixin');
    }

    appliedMixins.push({
      type: 'ECharts',
      instance,
      timestamp: Date.now(),
    });

    // 차트 저장소 초기화
    instance._popup.charts = instance._popup.charts || new Map();

    /**
     * ECharts 인스턴스 생성 (Mock)
     */
    instance.createChart = function (selector) {
      const mockChart = {
        selector,
        options: null,
        disposed: false,
        setOption: function (option) {
          this.options = option;
          chartHistory.push({
            action: 'setOption',
            instance,
            selector,
            option,
            timestamp: Date.now(),
          });
        },
        resize: function () {
          chartHistory.push({
            action: 'resize',
            instance,
            selector,
            timestamp: Date.now(),
          });
        },
        dispose: function () {
          this.disposed = true;
          chartHistory.push({
            action: 'dispose',
            instance,
            selector,
            timestamp: Date.now(),
          });
        },
      };

      const mockResizeObserver = {
        disconnected: false,
        disconnect: function () {
          this.disconnected = true;
        },
      };

      instance._popup.charts.set(selector, {
        chart: mockChart,
        resizeObserver: mockResizeObserver,
      });

      chartHistory.push({
        action: 'create',
        instance,
        selector,
        timestamp: Date.now(),
      });

      return mockChart;
    };

    /**
     * 차트 인스턴스 조회
     */
    instance.getChart = function (selector) {
      const entry = instance._popup.charts.get(selector);
      return entry ? entry.chart : null;
    };

    /**
     * 차트 업데이트
     */
    instance.updateChart = function (selector, option) {
      const chart = instance.getChart(selector);
      if (chart) {
        chart.setOption(option);
      }
    };

    // destroyPopup 체이닝 확장
    const originalDestroyPopup = instance.destroyPopup;
    instance.destroyPopup = function () {
      // 차트 정리
      instance._popup.charts.forEach(({ chart, resizeObserver }, selector) => {
        resizeObserver.disconnect();
        chart.dispose();
      });
      instance._popup.charts.clear();

      chartHistory.push({
        action: 'destroyAll',
        instance,
        timestamp: Date.now(),
      });

      // 원래 destroyPopup 호출
      originalDestroyPopup.call(instance);
    };
  };

  /**
   * ─────────────────────────────────────────
   * applyTabulatorMixin - Tabulator 테이블 관리 Mock
   * ─────────────────────────────────────────
   */
  PopupMixin.applyTabulatorMixin = function (instance) {
    if (!instance._popup) {
      throw new Error('applyShadowPopupMixin must be called before applyTabulatorMixin');
    }

    appliedMixins.push({
      type: 'Tabulator',
      instance,
      timestamp: Date.now(),
    });

    // 테이블 저장소 초기화
    instance._popup.tables = instance._popup.tables || new Map();

    /**
     * Tabulator 인스턴스 생성 (Mock)
     */
    instance.createTable = function (selector, options = {}) {
      const mockTable = {
        selector,
        options,
        data: [],
        ready: false,
        destroyed: false,
        setData: function (data) {
          this.data = data;
          tableHistory.push({
            action: 'setData',
            instance,
            selector,
            data,
            timestamp: Date.now(),
          });
        },
        replaceData: function (data) {
          this.data = data;
          tableHistory.push({
            action: 'replaceData',
            instance,
            selector,
            data,
            timestamp: Date.now(),
          });
        },
        redraw: function () {
          tableHistory.push({
            action: 'redraw',
            instance,
            selector,
            timestamp: Date.now(),
          });
        },
        destroy: function () {
          this.destroyed = true;
          tableHistory.push({
            action: 'destroy',
            instance,
            selector,
            timestamp: Date.now(),
          });
        },
        on: function (event, callback) {
          if (event === 'tableBuilt') {
            // 즉시 ready 상태로 전환 (테스트 편의)
            setTimeout(() => {
              this.ready = true;
              callback();
            }, 0);
          }
        },
      };

      const mockResizeObserver = {
        disconnected: false,
        disconnect: function () {
          this.disconnected = true;
        },
      };

      instance._popup.tables.set(selector, {
        table: mockTable,
        resizeObserver: mockResizeObserver,
      });

      tableHistory.push({
        action: 'create',
        instance,
        selector,
        options,
        timestamp: Date.now(),
      });

      return mockTable;
    };

    /**
     * 테이블 인스턴스 조회
     */
    instance.getTable = function (selector) {
      const entry = instance._popup.tables.get(selector);
      return entry ? entry.table : null;
    };

    /**
     * 테이블 데이터 업데이트
     */
    instance.updateTable = function (selector, data) {
      const table = instance.getTable(selector);
      if (table) {
        table.setData(data);
      }
    };

    /**
     * 테이블 옵션 업데이트 (컬럼 + 데이터)
     */
    instance.updateTableOptions = function (selector, options) {
      const table = instance.getTable(selector);
      if (table) {
        table.options = { ...table.options, ...options };
        if (options.data) {
          table.data = options.data;
        }
        tableHistory.push({
          action: 'updateOptions',
          instance,
          selector,
          options,
          timestamp: Date.now(),
        });
      }
    };

    /**
     * 테이블 초기화 완료 여부
     */
    instance.isTableReady = function (selector) {
      const table = instance.getTable(selector);
      return table ? table.ready : false;
    };

    // destroyPopup 체이닝 확장
    const originalDestroyPopup = instance.destroyPopup;
    instance.destroyPopup = function () {
      // 테이블 정리
      instance._popup.tables.forEach(({ table, resizeObserver }, selector) => {
        resizeObserver.disconnect();
        table.destroy();
      });
      instance._popup.tables.clear();

      tableHistory.push({
        action: 'destroyAll',
        instance,
        timestamp: Date.now(),
      });

      // 원래 destroyPopup 호출
      originalDestroyPopup.call(instance);
    };
  };

  // ─────────────────────────────────────────
  // Test Helpers (테스트 전용 API)
  // ─────────────────────────────────────────

  PopupMixin.__reset = function () {
    appliedMixins.length = 0;
    popupHistory.length = 0;
    chartHistory.length = 0;
    tableHistory.length = 0;
  };

  PopupMixin.__getAppliedMixins = function () {
    return [...appliedMixins];
  };

  PopupMixin.__getPopupHistory = function () {
    return [...popupHistory];
  };

  PopupMixin.__getChartHistory = function () {
    return [...chartHistory];
  };

  PopupMixin.__getTableHistory = function () {
    return [...tableHistory];
  };

  /**
   * 특정 인스턴스의 팝업 상태 확인
   */
  PopupMixin.__getPopupState = function (instance) {
    if (!instance._popup) return null;
    return {
      hasHost: !!instance._popup.host,
      hasShadowRoot: !!instance._popup.shadowRoot,
      isVisible: instance._popup.host?.style?.display === 'block',
      chartCount: instance._popup.charts?.size || 0,
      tableCount: instance._popup.tables?.size || 0,
      eventCleanupCount: instance._popup.eventCleanups?.length || 0,
    };
  };

  /**
   * 특정 액션이 발생했는지 확인
   */
  PopupMixin.__wasActionPerformed = function (action, instance = null) {
    const histories = [...popupHistory, ...chartHistory, ...tableHistory];
    return histories.some(
      (h) => h.action === action && (instance === null || h.instance === instance)
    );
  };

  /**
   * destroyPopup 체이닝이 올바르게 동작했는지 검증
   */
  PopupMixin.__verifyDestroyChaining = function (instance) {
    const relevantHistory = [...chartHistory, ...tableHistory, ...popupHistory].filter(
      (h) => h.instance === instance && (h.action === 'destroyAll' || h.action === 'destroy')
    );

    // ECharts/Tabulator가 적용되었으면 destroyAll이 먼저, 마지막에 destroy
    const destroyAllActions = relevantHistory.filter((h) => h.action === 'destroyAll');
    const destroyActions = relevantHistory.filter((h) => h.action === 'destroy');

    if (destroyActions.length === 0) return { valid: false, reason: 'destroy not called' };

    const lastDestroyAll =
      destroyAllActions.length > 0
        ? Math.max(...destroyAllActions.map((h) => h.timestamp))
        : 0;
    const destroyTime = destroyActions[0].timestamp;

    if (lastDestroyAll > 0 && lastDestroyAll > destroyTime) {
      return { valid: false, reason: 'destroyAll called after destroy' };
    }

    return { valid: true };
  };

  return PopupMixin;
}

// 싱글톤 인스턴스
const PopupMixinMock = createPopupMixinMock();

module.exports = {
  PopupMixin: PopupMixinMock,
  createPopupMixinMock,
};
