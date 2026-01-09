/*
 * ServerIcon Component - register
 * Subscribes to: serverStatus
 *
 * 서버 상태에 따라 SVG 아이콘 색상 변경
 * - normal: cyan (정상)
 * - warning: yellow (경고)
 * - inactive: gray (비활성)
 */

const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    serverStatus: ['renderStatus']
};

this.renderStatus = renderStatus.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// RENDER FUNCTIONS
// ======================

/**
 * 서버 상태에 따라 SVG 색상 변경
 * @param {Object} param - { response: { status: 'normal' | 'warning' | 'inactive' } }
 */
function renderStatus({ response }) {
    const { status } = response;
    console.log(`[ServerIcon] renderStatus: ${status}`);

    if (!status) return;

    const wrapper = this.appendElement.querySelector('.server-icon-wrapper');
    if (!wrapper) return;

    // data-status 속성 변경 → CSS가 색상 제어
    wrapper.dataset.status = status;
}
