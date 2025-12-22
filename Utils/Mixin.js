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

/**
 * ─────────────────────────────────────────────────────────────
 * applyTabulatorMixin - Shadow DOM 내 Tabulator 테이블 믹스인
 * ─────────────────────────────────────────────────────────────
 *
 * Shadow DOM 팝업 내에서 Tabulator 테이블을 관리합니다.
 * applyShadowPopupMixin과 함께 사용됩니다.
 *
 * 사용법:
 *   // applyShadowPopupMixin 이후에 호출
 *   applyTabulatorMixin(this);
 *
 * 테이블 사용:
 *   this.createTable('.table-container', options);  // Tabulator 생성 + ResizeObserver
 *   this.updateTable('.table-container', data);     // setData
 *   this.getTable('.table-container');              // 인스턴스 조회
 *   // destroyPopup() 호출 시 테이블 자동 정리 (applyShadowPopupMixin 확장)
 *
 * 옵션 빌더 패턴:
 *   const tableConfig = {
 *       columns: [...],
 *       optionBuilder: (config, data) => ({ ...tabulatorOptions })
 *   };
 *   const options = tableConfig.optionBuilder(tableConfig, data);
 *   this.createTable('.table-container', options);
 *
 * ─────────────────────────────────────────────────────────────
 * Shadow DOM에서 Tabulator CSS 사용하기
 * ─────────────────────────────────────────────────────────────
 *
 * 문제:
 *   Shadow DOM은 외부 스타일시트와 격리됩니다.
 *   메인 페이지에서 Tabulator CSS를 import해도 Shadow DOM에는 적용되지 않음.
 *
 * 해결:
 *   CSS 파일을 fetch하여 Shadow DOM에 <style> 태그로 주입합니다.
 *   - 경로: client/common/libs/tabulator/tabulator_midnight.min.css
 *   - 테마: midnight (다크 모드)
 *
 * 커스터마이징:
 *   midnight 테마가 이미 다크 모드를 지원하므로 최소한의 오버라이드만 권장.
 *   권장 스타일: border-radius, 헤더 강조선, 배경 투명화, 행 높이
 *   피해야 할 스타일: 색상 오버라이드 (테마가 이미 처리)
 * ─────────────────────────────────────────────────────────────
 */
Mixin.applyTabulatorMixin = function(instance) {
    // _popup이 없으면 applyShadowPopupMixin이 먼저 호출되지 않은 것
    if (!instance._popup) {
        console.warn('[Mixin] applyTabulatorMixin requires applyShadowPopupMixin to be called first');
        return;
    }

    // 테이블 저장소 추가
    instance._popup.tables = new Map();  // selector → { table, resizeObserver }
    instance._popup.tabulatorCssInjected = false;

    // Tabulator CSS 파일 경로 (midnight 테마 - 다크 모드)
    const TABULATOR_CSS_PATH = 'client/common/libs/tabulator/tabulator_midnight.min.css';

    /**
     * Shadow DOM에 Tabulator CSS 파일 주입 (최초 1회)
     * CSS 파일을 fetch하여 <style> 태그로 Shadow DOM에 주입
     */
    async function injectTabulatorCSS() {
        if (instance._popup.tabulatorCssInjected) return;

        const shadowRoot = instance._popup.host?.shadowRoot;
        if (!shadowRoot) return;

        instance._popup.tabulatorCssInjected = true; // 중복 요청 방지

        try {
            const response = await fetch(TABULATOR_CSS_PATH);
            if (!response.ok) {
                throw new Error(`Failed to fetch Tabulator CSS: ${response.status}`);
            }
            const cssText = await response.text();

            const style = document.createElement('style');
            style.setAttribute('data-tabulator-theme', 'midnight');
            style.textContent = cssText;
            shadowRoot.appendChild(style);

            console.log('[Mixin] Tabulator CSS injected into Shadow DOM');
        } catch (e) {
            console.error('[Mixin] Failed to inject Tabulator CSS:', e);
            instance._popup.tabulatorCssInjected = false; // 실패 시 재시도 허용
        }
    }

    /**
     * Shadow DOM 내부에 Tabulator 인스턴스 생성
     *
     * @param {string} selector - 테이블 컨테이너 선택자
     * @param {Object} options - Tabulator 옵션 (columns, layout 등)
     * @returns {Object|null} Tabulator 인스턴스
     */
    instance.createTable = function(selector, options = {}) {
        if (instance._popup.tables.has(selector)) {
            return instance._popup.tables.get(selector).table;
        }

        const container = instance.popupQuery(selector);
        if (!container) {
            console.warn(`[Mixin] Table container not found: ${selector}`);
            return null;
        }

        // Tabulator 기본 CSS를 Shadow DOM에 주입
        injectTabulatorCSS();

        // 기본 옵션과 병합
        const defaultOptions = {
            layout: 'fitColumns',
            responsiveLayout: 'collapse',
            height: '100%',
        };

        const table = new Tabulator(container, { ...defaultOptions, ...options });

        // ResizeObserver로 컨테이너 크기 변경 감지
        const resizeObserver = new ResizeObserver(() => {
            table.redraw();
        });
        resizeObserver.observe(container);

        instance._popup.tables.set(selector, { table, resizeObserver });

        return table;
    };

    /**
     * 테이블 인스턴스 조회
     *
     * @param {string} selector - 테이블 컨테이너 선택자
     * @returns {Object|null} Tabulator 인스턴스
     */
    instance.getTable = function(selector) {
        return instance._popup.tables.get(selector)?.table || null;
    };

    /**
     * 테이블 데이터 업데이트
     *
     * @param {string} selector - 테이블 컨테이너 선택자
     * @param {Array} data - 테이블 데이터 배열
     */
    instance.updateTable = function(selector, data) {
        const table = instance.getTable(selector);
        if (!table) {
            console.warn(`[Mixin] Table not found: ${selector}`);
            return;
        }

        try {
            table.setData(data);
        } catch (e) {
            console.error(`[Mixin] Table setData error:`, e);
        }
    };

    /**
     * 테이블 옵션 업데이트 (columns 변경 등)
     *
     * @param {string} selector - 테이블 컨테이너 선택자
     * @param {Object} options - 업데이트할 옵션
     */
    instance.updateTableOptions = function(selector, options) {
        const table = instance.getTable(selector);
        if (!table) {
            console.warn(`[Mixin] Table not found: ${selector}`);
            return;
        }

        try {
            if (options.columns) {
                table.setColumns(options.columns);
            }
            if (options.data) {
                table.setData(options.data);
            }
        } catch (e) {
            console.error(`[Mixin] Table updateOptions error:`, e);
        }
    };

    // destroyPopup 확장 - 테이블 정리 추가
    const originalDestroyPopup = instance.destroyPopup;
    instance.destroyPopup = function() {
        // 테이블 정리
        instance._popup.tables.forEach(({ table, resizeObserver }) => {
            resizeObserver.disconnect();
            table.off();  // 이벤트 해제
            table.destroy();
        });
        instance._popup.tables.clear();

        // 원래 destroyPopup 호출 (차트, 이벤트, DOM 정리)
        originalDestroyPopup.call(instance);
    };
};
