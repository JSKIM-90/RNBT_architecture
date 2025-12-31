/**
 * Master - before_load.js
 *
 * 호출 시점: 앱 시작 직후, Master 컴포넌트들이 초기화되기 전
 *
 * 책임:
 * - Master 레벨 이벤트 버스 핸들러 등록
 * - 앱 전역 설정 초기화
 *
 * 패턴 포인트:
 * - 이벤트 핸들러는 여기서 등록, 데이터 발행은 loaded.js에서
 * - Master 이벤트는 앱 전체 생명주기 동안 유지됨
 */

const { onEventBusHandlers } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

/**
 * Master 레벨 이벤트 핸들러 정의
 *
 * 핸들러 네이밍 규칙:
 * - @컴포넌트명 + 동작 (예: @navItemClicked)
 * - 컴포넌트에서 발생한 이벤트를 Page(Master)에서 처리
 */
this.eventBusHandlers = {

    /**
     * Sidebar 메뉴 아이템 클릭 이벤트
     * - 페이지 이동 처리 (런타임에서 정해진 규칙 있음)
     * - 여기서는 콘솔로 대체
     */
    '@navItemClicked': ({ event }) => {
        const navItem = event.target.closest('[data-menu-id]');
        const menuId = navItem?.dataset?.menuId;

        if (menuId) {
            console.log(`[Master] 페이지가 이동되었습니다: ${menuId}`);
            // 실제 런타임에서는 페이지 이동 API 호출
            // 예: wemb.navigation.goto(menuId);
        }
    },

    /**
     * Header 사용자 메뉴 클릭 이벤트
     */
    '@userMenuClicked': ({ event }) => {
        console.log('[Master] User menu clicked');
        // 확장 포인트: 드롭다운 메뉴 표시 등
    }
};

// 이벤트 핸들러 등록
onEventBusHandlers(this.eventBusHandlers);

console.log('[Master] before_load - Event handlers registered');
