/*
 * ShadowPopupMixin.js
 *
 * 자기 완결 컴포넌트를 위한 Shadow DOM 팝업 믹스인
 *
 * 핵심 기능:
 * - Shadow DOM 기반 팝업 생성 (CSS 자동 격리)
 * - 팝업 표시/숨김
 * - 내부 요소 쿼리
 * - 이벤트 바인딩 헬퍼
 *
 * 사용법:
 *   const { applyShadowPopupMixin } = ShadowPopupMixin;
 *   applyShadowPopupMixin(this, {
 *       getHTML: () => '<div class="popup">...</div>',
 *       getStyles: () => '.popup { ... }',
 *       onCreated: (shadowRoot) => { ... }
 *   });
 */

const ShadowPopupMixin = {};

/**
 * 컴포넌트에 Shadow DOM 팝업 기능을 추가
 */
ShadowPopupMixin.applyShadowPopupMixin = function(instance, options) {
    const { getHTML, getStyles, onCreated } = options;

    // Internal state
    instance._popup = {
        host: null,
        shadowRoot: null,
        eventCleanups: []
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

    /**
     * 팝업 및 리소스 정리
     */
    instance.destroyPopup = function() {
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
