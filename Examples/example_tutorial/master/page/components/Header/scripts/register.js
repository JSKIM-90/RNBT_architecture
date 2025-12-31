/**
 * Master - Header Component - register.js
 *
 * 책임:
 * - 사용자 정보 표시
 * - 사용자 메뉴 이벤트 발행
 *
 * Subscribes to: userInfo
 * Events: @userMenuClicked
 *
 * 패턴 포인트:
 * - Field Config 패턴으로 데이터 매핑
 * - 컴포넌트는 렌더링만, 이벤트 처리는 Page(Master)에서
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;

// ======================
// CONFIG (Field Config 패턴)
// ======================

/**
 * API 응답 필드를 DOM 요소에 매핑
 *
 * 구조:
 * - key: API 응답 객체의 필드명
 * - selector: DOM 요소 CSS 선택자
 * - attr: 속성으로 설정할 경우 (textContent 대신)
 */
const config = {
    fields: [
        { key: 'name', selector: '.user-name' },
        { key: 'role', selector: '.user-role' },
        { key: 'avatar', selector: '.user-avatar', attr: 'src' }
    ]
};

// ======================
// BINDINGS
// ======================

this.renderUserInfo = renderUserInfo.bind(this, config);

// ======================
// SUBSCRIPTIONS
// ======================

/**
 * 구독 설정
 *
 * 구조: { topic: [렌더함수명1, 렌더함수명2, ...] }
 * - 하나의 topic에 여러 렌더 함수 연결 가능
 */
this.subscriptions = {
    userInfo: ['renderUserInfo']
};

// 구독 등록
fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

/**
 * 이벤트 바인딩 설정
 *
 * 구조: { eventType: { selector: '@이벤트명' } }
 * - 이벤트 발생 시 WEventBus로 전파
 * - Page(Master)의 eventBusHandlers에서 처리
 */
this.customEvents = {
    click: {
        '.user-menu-btn': '@userMenuClicked'
    }
};

bindEvents(this, this.customEvents);

console.log('[Header] Registered');

// ======================
// RENDER FUNCTIONS
// ======================

/**
 * 사용자 정보 렌더링
 *
 * @param {Object} config - Field Config
 * @param {Object} param - API 응답 { response: { data } }
 */
function renderUserInfo(config, { response }) {
    const { data } = response;
    if (!data) return;

    fx.go(
        config.fields,
        fx.each(({ key, selector, attr }) => {
            const el = this.element.querySelector(selector);
            if (!el) return;

            const value = data[key];
            if (attr) {
                el.setAttribute(attr, value);
            } else {
                el.textContent = value;
            }
        })
    );

    console.log('[Header] User info rendered:', data.name);
}
