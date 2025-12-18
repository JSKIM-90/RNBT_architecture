/*
 * Mixin.js
 *
 * 컴포넌트 기능 확장을 위한 Mixin 모음
 *
 * 사용법:
 *   const { applyShadowPopupMixin } = Mixin;
 *
 * ─────────────────────────────────────────────────────────────
 * applyShadowPopupMixin - Shadow DOM 팝업 믹스인
 * ─────────────────────────────────────────────────────────────
 *
 * 핵심 기능:
 * - Shadow DOM 기반 팝업 생성 (CSS 자동 격리)
 * - 팝업 표시/숨김
 * - 내부 요소 쿼리
 * - 이벤트 바인딩 헬퍼
 * - 차트 인스턴스 관리 (ECharts)
 *
 * 사용법:
 *   applyShadowPopupMixin(this, {
 *       getHTML: () => '<div class="popup">...</div>',
 *       getStyles: () => '.popup { ... }',
 *       onCreated: (shadowRoot) => { ... }
 *   });
 *
 * 차트 사용:
 *   this.createChart('.chart-container');  // echarts.init + ResizeObserver
 *   this.updateChart('.chart-container', option);  // setOption
 *   this.getChart('.chart-container');  // 인스턴스 조회
 *   // destroyPopup() 호출 시 차트 자동 정리
 *
 * ─────────────────────────────────────────────────────────────
 * 스타일 분리 검증 (2025-12-16)
 * ─────────────────────────────────────────────────────────────
 *
 * Mixin은 컴포넌트의 스타일링에 관여하지 않음:
 *
 * | 영역                  | Mixin 관여 | 컴포넌트 결정 |
 * |-----------------------|-----------|--------------|
 * | Shadow DOM 내부 CSS   | ❌        | ✅ (getStyles) |
 * | Shadow DOM 내부 HTML  | ❌        | ✅ (getHTML)   |
 * | 선택자                | ❌        | ✅ (bindPopupEvents 인자) |
 * | host의 display        | ✅        | -             |
 *
 * 유일한 제약:
 * - showPopup(): host.style.display = 'block'
 * - hidePopup(): host.style.display = 'none'
 *
 * 만약 opacity, visibility, transform 등 다른 방식의 표시/숨김이
 * 필요하면 이 부분 수정 필요. 현재는 99%의 케이스에서 문제없음.
 * ─────────────────────────────────────────────────────────────
 */

const Mixin = {};

/**
 * 컴포넌트에 Shadow DOM 팝업 기능을 추가
 */
Mixin.applyShadowPopupMixin = function(instance, options) {
    const { getHTML, getStyles, onCreated } = options;

    // Internal state
    instance._popup = {
        host: null,
        shadowRoot: null,
        eventCleanups: [],
        charts: new Map(),           // selector → { chart, resizeObserver }
    };

    /**
     * Shadow DOM 팝업 생성
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

        // 페이지에 추가
        instance.page.element.appendChild(instance._popup.host);

        // 콜백
        if (onCreated) {
            onCreated.call(instance, instance._popup.shadowRoot);
        }

        return instance._popup.shadowRoot;
    };

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
     * Shadow DOM 내부 요소 선택
     */
    instance.popupQuery = function(selector) {
        return instance._popup.shadowRoot?.querySelector(selector);
    };

    /**
     * Shadow DOM 내부 요소 모두 선택
     */
    instance.popupQueryAll = function(selector) {
        return instance._popup.shadowRoot?.querySelectorAll(selector) || [];
    };

    /**
     * 이벤트 델리게이션 기반 바인딩
     *
     * @param {Object} events - { eventType: { selector: handler } }
     * @example
     *   this.bindPopupEvents({
     *       click: {
     *           '.close-btn': () => this.hideDetail(),
     *           '.refresh-btn': () => this.refresh()
     *       },
     *       change: {
     *           '.input-field': (e) => this.onInputChange(e)
     *       }
     *   });
     */
    instance.bindPopupEvents = function(events) {
        Object.entries(events).forEach(([eventType, handlers]) => {
            const listener = (e) => {
                Object.entries(handlers).forEach(([selector, handler]) => {
                    if (e.target.closest(selector)) {
                        handler.call(instance, e);
                    }
                });
            };

            instance._popup.shadowRoot.addEventListener(eventType, listener);
            instance._popup.eventCleanups.push(() => {
                instance._popup.shadowRoot.removeEventListener(eventType, listener);
            });
        });
    };

    // ======================
    // CHART HELPERS
    // ======================

    /**
     * Shadow DOM 내부에 ECharts 인스턴스 생성
     *
     * @param {string} selector - 차트 컨테이너 선택자
     * @returns {Object|null} ECharts 인스턴스
     */
    instance.createChart = function(selector) {
        if (instance._popup.charts.has(selector)) {
            return instance._popup.charts.get(selector).chart;
        }

        const container = instance.popupQuery(selector);
        if (!container) {
            console.warn(`[Mixin] Chart container not found: ${selector}`);
            return null;
        }

        const chart = echarts.init(container);

        const resizeObserver = new ResizeObserver(() => {
            chart.resize();
        });
        resizeObserver.observe(container);

        instance._popup.charts.set(selector, { chart, resizeObserver });

        return chart;
    };

    /**
     * 차트 인스턴스 조회
     *
     * @param {string} selector - 차트 컨테이너 선택자
     * @returns {Object|null} ECharts 인스턴스
     */
    instance.getChart = function(selector) {
        return instance._popup.charts.get(selector)?.chart || null;
    };

    /**
     * 차트 옵션 업데이트
     *
     * @param {string} selector - 차트 컨테이너 선택자
     * @param {Object} option - ECharts option
     */
    instance.updateChart = function(selector, option) {
        const chart = instance.getChart(selector);
        if (!chart) {
            console.warn(`[Mixin] Chart not found: ${selector}`);
            return;
        }

        try {
            chart.setOption(option);
        } catch (e) {
            console.error(`[Mixin] Chart setOption error:`, e);
        }
    };

    /**
     * 팝업 및 리소스 정리
     */
    instance.destroyPopup = function() {
        // 차트 정리
        instance._popup.charts.forEach(({ chart, resizeObserver }) => {
            resizeObserver.disconnect();
            chart.dispose();
        });
        instance._popup.charts.clear();

        // 이벤트 정리
        instance._popup.eventCleanups.forEach(cleanup => cleanup());
        instance._popup.eventCleanups = [];

        // DOM 제거
        if (instance._popup.host) {
            instance._popup.host.remove();
            instance._popup.host = null;
            instance._popup.shadowRoot = null;
        }
    };
};