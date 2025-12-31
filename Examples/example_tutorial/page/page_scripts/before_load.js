/**
 * Page - before_load.js
 *
 * 호출 시점: 페이지 진입 직후, Page 컴포넌트들이 초기화되기 전
 *
 * 책임:
 * - Page 레벨 이벤트 버스 핸들러 등록
 * - 페이지별 설정 초기화
 * - 현재 파라미터 상태 초기화
 *
 * 패턴 포인트:
 * - 이벤트 핸들러에서 param을 변경하고 데이터 재발행
 * - currentParams로 현재 필터/파라미터 상태 관리
 */

const { onEventBusHandlers, fetchData } = WKit;

// ======================
// CURRENT PARAMS STATE
// ======================

/**
 * 현재 파라미터 상태
 *
 * 용도:
 * - 각 topic별 현재 적용된 파라미터 저장
 * - 이벤트 핸들러에서 파라미터 변경 시 사용
 */
this.currentParams = {
    tableData: { category: 'all' },
    chartData: { period: '7d' }
};

// ======================
// EVENT BUS HANDLERS
// ======================

/**
 * Page 레벨 이벤트 핸들러 정의
 *
 * 패턴:
 * 1. 컴포넌트에서 이벤트 발생 (@이벤트명)
 * 2. Page에서 이벤트 수신 및 처리
 * 3. 필요시 파라미터 변경 후 데이터 재발행
 */
this.eventBusHandlers = {

    /**
     * StatsCards 카드 클릭 이벤트
     */
    '@cardClicked': ({ event }) => {
        const card = event.target.closest('[data-stat-key]');
        const statKey = card?.dataset?.statKey;
        console.log('[Page] Card clicked:', statKey);
        // 확장 포인트: 상세 모달 표시 등
    },

    /**
     * DataTable 행 클릭 이벤트
     */
    '@rowClicked': ({ event, data }) => {
        console.log('[Page] Table row clicked:', data);
        // 확장 포인트: 상세 정보 표시 등
    },

    /**
     * DataTable 필터 변경 이벤트
     *
     * 흐름:
     * 1. 이벤트에서 새 카테고리 추출
     * 2. currentParams 업데이트
     * 3. 데이터 재발행
     */
    '@filterChanged': ({ event }) => {
        const category = event.target.value;
        console.log('[Page] Filter changed:', category);

        // 파라미터 업데이트
        this.currentParams.tableData = { category };

        // 데이터 재발행
        GlobalDataPublisher.fetchAndPublish(
            'tableData',
            this,
            this.currentParams.tableData
        );
    },

    /**
     * TrendChart 기간 변경 이벤트
     */
    '@periodChanged': ({ event }) => {
        const period = event.target.value;
        console.log('[Page] Period changed:', period);

        // 파라미터 업데이트
        this.currentParams.chartData = { period };

        // 데이터 재발행
        GlobalDataPublisher.fetchAndPublish(
            'chartData',
            this,
            this.currentParams.chartData
        );
    }
};

// 이벤트 핸들러 등록
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - Event handlers registered');
