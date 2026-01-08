/*
 * Page - TransactionTable Component - register
 * Card Company Dashboard
 * Subscribes to: transactions
 * Events: @transactionFilterChanged, @tableRefreshClicked, @paginationChanged
 * Library: Tabulator
 * Feature: Pagination support
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// PAGE STATE
// ======================

this.pageState = {
    page: 1,
    pageSize: 10,
    category: 'all',
    total: 0,
    totalPages: 0
};

// ======================
// TABULATOR INITIALIZATION
// ======================

// 컴포넌트 내 고유 선택자 생성
const tableContainer = this.element.querySelector('.table-container');
const uniqueId = `tabulator-${this.id}`;
tableContainer.id = uniqueId;

// NOTE: 컨테이너가 CSS 'fit-content' 속성을 가진 경우,
// 'fitColumns'는 무한 resize 루프를 유발할 수 있음 (서로 크기 참조).
// 그 경우 'fitData'를 사용하여 테이블이 고정 너비를 갖도록 변경 필요.
this.tableInstance = new Tabulator(`#${uniqueId}`, {
    layout: 'fitColumns',
    height: '100%',
    placeholder: 'No transactions found',
    columns: [
        {
            title: 'Date',
            field: 'date',
            sorter: 'date',
            width: 120,
            formatter: function(cell) {
                const date = new Date(cell.getValue());
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        },
        {
            title: 'Merchant',
            field: 'merchant',
            sorter: 'string'
        },
        {
            title: 'Category',
            field: 'category',
            sorter: 'string',
            width: 130,
            formatter: function(cell) {
                const value = cell.getValue();
                const icons = {
                    shopping: '🛍️',
                    food: '🍽️',
                    transport: '🚗',
                    entertainment: '🎬',
                    other: '📦'
                };
                return `${icons[value] || '📦'} ${value}`;
            }
        },
        {
            title: 'Amount',
            field: 'amount',
            sorter: 'number',
            hozAlign: 'right',
            width: 120,
            formatter: function(cell) {
                const value = cell.getValue();
                const isNegative = value < 0;
                cell.getElement().classList.add(isNegative ? 'amount-negative' : 'amount-positive');
                return `${isNegative ? '-' : '+'}$${Math.abs(value).toLocaleString()}`;
            }
        }
    ]
});

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    transactions: ['renderTransactions']
};

this.renderTransactions = renderTransactions.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    change: {
        '.filter-select': '@transactionFilterChanged'
    },
    click: {
        '.table-refresh-btn': '@tableRefreshClicked',
        '.pagination-btn': '@paginationClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// PAGINATION METHODS
// ======================

this.getPageParams = getPageParams.bind(this);
this.updatePaginationUI = updatePaginationUI.bind(this);
this.goToPage = goToPage.bind(this);

function getPageParams() {
    return {
        page: this.pageState.page,
        pageSize: this.pageState.pageSize,
        category: this.pageState.category
    };
}

function goToPage(newPage) {
    if (newPage < 1 || newPage > this.pageState.totalPages) return;
    this.pageState.page = newPage;
}

function updatePaginationUI(prevTotalPages) {
    const { page, total, totalPages, pageSize } = this.pageState;

    // 페이지 정보 텍스트 업데이트
    const pageInfo = this.element.querySelector('.pagination-info');
    if (pageInfo) {
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        pageInfo.textContent = `${start}-${end} of ${total}`;
    }

    // prev/next 버튼 상태 업데이트
    const prevBtn = this.element.querySelector('.pagination-btn[data-action="prev"]');
    const nextBtn = this.element.querySelector('.pagination-btn[data-action="next"]');
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;

    // totalPages가 변경된 경우에만 버튼 재생성
    const pageNumbers = this.element.querySelector('.page-numbers');
    if (pageNumbers && prevTotalPages !== totalPages) {
        pageNumbers.innerHTML = generatePageButtons(totalPages);
    }

    // active 클래스 토글
    updateActiveButton.call(this, page);
}

function generatePageButtons(totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
        .map(p => `<button class="pagination-btn" data-page="${p}">${p}</button>`)
        .join('');
}

function updateActiveButton(currentPage) {
    const pageButtons = this.element.querySelectorAll('.pagination-btn[data-page]');
    pageButtons.forEach(btn => {
        const btnPage = parseInt(btn.dataset.page);
        btn.classList.toggle('active', btnPage === currentPage);
    });
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderTransactions({ response }) {
    const { data, pagination } = response;
    console.log(`[TransactionTable] renderTransactions: ${data?.length || 0} items, page ${pagination?.page}/${pagination?.totalPages}`);

    if (!data || !this.tableInstance) return;

    // 이전 totalPages 저장 (비교용)
    const prevTotalPages = this.pageState.totalPages;

    // 페이지네이션 상태 업데이트
    if (pagination) {
        this.pageState.page = pagination.page;
        this.pageState.total = pagination.total;
        this.pageState.totalPages = pagination.totalPages;
    }

    this.tableInstance.setData(data);
    this.updatePaginationUI(prevTotalPages);
}
