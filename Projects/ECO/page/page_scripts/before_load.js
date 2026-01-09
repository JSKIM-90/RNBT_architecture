/*
 * Page - before_load
 * ECO (Energy & Cooling Operations) Dashboard
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup 3D raycasting
 *
 * 이벤트 핸들러:
 * - 3D 클릭: @assetClicked (모든 자기완결 컴포넌트 공통)
 * - AssetList: @assetSelected (행 클릭), @refreshClicked (새로고침)
 */

const { onEventBusHandlers, initThreeRaycasting, withSelector, makeIterator, getInstanceById, getInstanceByName } = Wkit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // ─────────────────────────────────────────
    // 3D 클릭 이벤트 (자기완결 컴포넌트 공통)
    // ─────────────────────────────────────────

    '@assetClicked': ({ event,targetInstance }) => {
        console.log('[Page] Asset clicked:', targetInstance.name, targetInstance.id);
        targetInstance.showDetail();
    },

    // ─────────────────────────────────────────
    // AssetList 이벤트 (일반 2D 컴포넌트)
    // ─────────────────────────────────────────

    // 자산 행 선택 → 해당 3D 컴포넌트 팝업 표시
    '@assetSelected': ({ event, targetInstance }) => {
        console.log(event, targetInstance)
    },

    // 새로고침 버튼 클릭 → GlobalDataPublisher로 데이터 재발행
    '@refreshClicked': () => {
        console.log('[Page] Refresh clicked - fetching assets');
        GlobalDataPublisher.fetchAndPublish('assets', this, this.currentParams?.assets || {})
            .catch(err => console.error('[fetchAndPublish:assets]', err));
    }
};

onEventBusHandlers(this.eventBusHandlers);

// ======================
// 3D RAYCASTING SETUP
// ======================

this.raycastingEvents = withSelector(this.appendElement, 'canvas', canvas =>
    fx.go(
        [{ type: 'click' }],
        fx.map(event => ({
            ...event,
            handler: initThreeRaycasting(canvas, event.type)
        }))
    )
);

console.log('[Page] before_load - ECO Dashboard event handlers & raycasting ready');
