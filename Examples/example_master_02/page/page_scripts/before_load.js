/*
 * Page - before_load
 * Card Company Dashboard
 *
 * Responsibilities:
 * - Register event bus handlers
 * - Setup configurations
 */

const { onEventBusHandlers, fetchData } = WKit;

// ======================
// EVENT BUS HANDLERS
// ======================

this.eventBusHandlers = {
    // TransactionTable: Filter changed - 필터 변경 시 page를 1로 리셋
    '@transactionFilterChanged': ({ event, targetInstance }) => {
        const category = event.target.value;

        // 필터 변경 시 page 1로 리셋
        if (targetInstance.pageState) {
            targetInstance.pageState.page = 1;
            targetInstance.pageState.category = category;
        }

        this.currentParams['transactions'] = {
            ...this.currentParams['transactions'],
            category,
            page: 1
        };

        GlobalDataPublisher.fetchAndPublish('transactions', this, this.currentParams['transactions']);
    },

    // TransactionTable: Refresh clicked
    '@tableRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('transactions', this, this.currentParams['transactions'] || {});
    },

    // TransactionTable: Pagination clicked
    '@paginationClicked': ({ event, targetInstance }) => {
        const btn = event.target.closest('.pagination-btn');
        if (!btn) return;

        const action = btn.dataset.action;
        const pageNum = btn.dataset.page;

        let newPage = targetInstance.pageState.page;

        if (action === 'prev') {
            newPage = Math.max(1, newPage - 1);
        } else if (action === 'next') {
            newPage = Math.min(targetInstance.pageState.totalPages, newPage + 1);
        } else if (pageNum) {
            newPage = parseInt(pageNum);
        }

        if (newPage !== targetInstance.pageState.page) {
            targetInstance.pageState.page = newPage;

            this.currentParams['transactions'] = {
                ...this.currentParams['transactions'],
                page: newPage
            };

            GlobalDataPublisher.fetchAndPublish('transactions', this, this.currentParams['transactions']);
        }
    },

    // SpendingChart: Refresh clicked
    '@spendingChartRefreshClicked': () => {
        GlobalDataPublisher.fetchAndPublish('spending', this, this.currentParams['spending'] || {});
    }
};

// Register event handlers
onEventBusHandlers(this.eventBusHandlers);

console.log('[Page] before_load - event handlers ready');
