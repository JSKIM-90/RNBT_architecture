/*
 * Page - TransactionTable Component - register
 * Card Company Dashboard
 * Subscribes to: transactions
 * Events: @transactionFilterChanged, @tableRefreshClicked
 * Library: Tabulator
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// TABULATOR INITIALIZATION
// ======================

// 컴포넌트 내 고유 선택자 생성
const tableContainer = this.element.querySelector('.table-container');
const uniqueId = `tabulator-${this.id}`;
tableContainer.id = uniqueId;

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
        '.table-refresh-btn': '@tableRefreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderTransactions(response) {
    const { data } = response;
    console.log(`[TransactionTable] renderTransactions: ${data?.length || 0} items`);

    if (!data || !this.tableInstance) return;

    this.tableInstance.setData(data);
}
