/*
 * ShadowPopupMixin.js
 *
 * 자기 완결 컴포넌트를 위한 Shadow DOM 팝업 믹스인
 *
 * 기능:
 * - Shadow DOM 기반 팝업 생성/관리 (CSS 자동 격리)
 * - 팝업 내부 이벤트 바인딩 헬퍼
 * - 팝업 내부 ECharts 관리
 *
 * 사용법:
 *   const { applyShadowPopupMixin } = ShadowPopupMixin;
 *   applyShadowPopupMixin(this, {
 *       getHTML: () => '<div class="popup">...</div>',
 *       getStyles: () => '.popup { ... }',
 *       onCreated: (shadowRoot) => { ... },
 *       onDestroy: () => { ... }
 *   });
 */

const ShadowPopupMixin = {};

/**
 * 컴포넌트에 Shadow DOM 팝업 기능을 추가
 *
 * @param {Object} instance - 컴포넌트 인스턴스 (this)
 * @param {Object} options - 옵션
 * @param {Function} options.getHTML - 팝업 HTML 반환 함수
 * @param {Function} options.getStyles - 팝업 CSS 반환 함수
 * @param {Function} [options.onCreated] - 팝업 생성 후 콜백 (shadowRoot 전달)
 * @param {Function} [options.onDestroy] - 팝업 제거 전 콜백
 */
ShadowPopupMixin.applyShadowPopupMixin = function(instance, options) {
    const { getHTML, getStyles, onCreated, onDestroy } = options;

    // ======================
    // INTERNAL STATE
    // ======================
    instance._popup = {
        host: null,
        shadowRoot: null,
        chart: null,
        resizeObserver: null,
        eventCleanups: []
    };

    // ======================
    // POPUP CREATION
    // ======================

    /**
     * Shadow DOM 팝업 생성
     * @returns {ShadowRoot} 생성된 shadowRoot
     */
    instance.createPopup = function() {
        if (instance._popup.host) return instance._popup.shadowRoot;

        // Shadow DOM 호스트 생성
        instance._popup.host = document.createElement('div');
        instance._popup.host.id = `popup-${instance.id}`;
        instance._popup.shadowRoot = instance._popup.host.attachShadow({ mode: 'open' });

        // 스타일 + HTML 삽입
        instance._popup.shadowRoot.innerHTML = `
            <style>${getStyles.call(instance)}</style>
            ${getHTML.call(instance)}
        `;

        // 페이지 요소에 추가
        instance.page.element.appendChild(instance._popup.host);

        // 콜백 호출
        if (onCreated) {
            onCreated.call(instance, instance._popup.shadowRoot);
        }

        return instance._popup.shadowRoot;
    };

    // ======================
    // POPUP VISIBILITY
    // ======================

    /**
     * 팝업 표시
     */
    instance.showPopup = function() {
        if (!instance._popup.host) {
            instance.createPopup();
        }
        instance._popup.host.style.display = 'block';
    };

    /**
     * 팝업 숨김
     */
    instance.hidePopup = function() {
        if (instance._popup.host) {
            instance._popup.host.style.display = 'none';
        }
    };

    /**
     * 팝업 토글
     */
    instance.togglePopup = function() {
        if (!instance._popup.host) {
            instance.showPopup();
        } else if (instance._popup.host.style.display === 'none') {
            instance.showPopup();
        } else {
            instance.hidePopup();
        }
    };

    // ======================
    // POPUP QUERY HELPERS
    // ======================

    /**
     * Shadow DOM 내부 요소 선택
     * @param {string} selector - CSS 선택자
     * @returns {Element|null}
     */
    instance.popupQuery = function(selector) {
        return instance._popup.shadowRoot?.querySelector(selector);
    };

    /**
     * Shadow DOM 내부 요소 모두 선택
     * @param {string} selector - CSS 선택자
     * @returns {NodeList}
     */
    instance.popupQueryAll = function(selector) {
        return instance._popup.shadowRoot?.querySelectorAll(selector) || [];
    };

    // ======================
    // POPUP EVENT BINDING
    // ======================

    /**
     * 팝업 내부 이벤트 바인딩
     * @param {string} selector - CSS 선택자
     * @param {string} eventType - 이벤트 타입 (click, change 등)
     * @param {Function} handler - 이벤트 핸들러
     */
    instance.bindPopupEvent = function(selector, eventType, handler) {
        const elements = instance.popupQueryAll(selector);
        const boundHandler = handler.bind(instance);

        elements.forEach(el => {
            el.addEventListener(eventType, boundHandler);
            instance._popup.eventCleanups.push(() => {
                el.removeEventListener(eventType, boundHandler);
            });
        });
    };

    /**
     * data-action 기반 이벤트 바인딩
     * @param {Object} actions - { actionName: handler } 매핑
     */
    instance.bindPopupActions = function(actions) {
        Object.entries(actions).forEach(([action, handler]) => {
            instance.bindPopupEvent(`[data-action="${action}"]`, 'click', handler);
        });
    };

    // ======================
    // POPUP CHART MANAGEMENT
    // ======================

    /**
     * 팝업 내부 ECharts 초기화
     * @param {string} selector - 차트 컨테이너 선택자
     * @param {boolean} [enableResize=true] - 리사이즈 감시 여부
     * @returns {Object} ECharts 인스턴스
     */
    instance.initPopupChart = function(selector, enableResize = true) {
        const container = instance.popupQuery(selector);
        if (!container) return null;

        instance._popup.chart = echarts.init(container);

        if (enableResize) {
            instance._popup.resizeObserver = new ResizeObserver(() => {
                instance._popup.chart?.resize();
            });
            instance._popup.resizeObserver.observe(container);
        }

        return instance._popup.chart;
    };

    /**
     * 팝업 차트 옵션 설정
     * @param {Object} option - ECharts 옵션
     */
    instance.setPopupChartOption = function(option) {
        if (!instance._popup.chart) return;
        instance._popup.chart.setOption(option);
    };

    /**
     * 팝업 차트 가져오기
     * @returns {Object|null} ECharts 인스턴스
     */
    instance.getPopupChart = function() {
        return instance._popup.chart;
    };

    // ======================
    // POPUP DESTRUCTION
    // ======================

    /**
     * 팝업 및 관련 리소스 정리
     */
    instance.destroyPopup = function() {
        // 콜백 호출
        if (onDestroy) {
            onDestroy.call(instance);
        }

        // 이벤트 정리
        instance._popup.eventCleanups.forEach(cleanup => cleanup());
        instance._popup.eventCleanups = [];

        // ResizeObserver 정리
        if (instance._popup.resizeObserver) {
            instance._popup.resizeObserver.disconnect();
            instance._popup.resizeObserver = null;
        }

        // ECharts 정리
        if (instance._popup.chart) {
            instance._popup.chart.dispose();
            instance._popup.chart = null;
        }

        // Shadow DOM 호스트 제거
        if (instance._popup.host) {
            instance._popup.host.remove();
            instance._popup.host = null;
            instance._popup.shadowRoot = null;
        }
    };

    // ======================
    // GETTERS
    // ======================

    /**
     * Shadow Root 가져오기
     * @returns {ShadowRoot|null}
     */
    instance.getShadowRoot = function() {
        return instance._popup.shadowRoot;
    };

    /**
     * 팝업 호스트 가져오기
     * @returns {HTMLElement|null}
     */
    instance.getPopupHost = function() {
        return instance._popup.host;
    };
};

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShadowPopupMixin;
}
