/**
 * Page - DataTable Component - register.js
 *
 * 책임:
 * - 판매 데이터 테이블 표시 (Tabulator 사용)
 * - 카테고리 필터 이벤트 발행
 * - 행 클릭 이벤트 발행
 *
 * Subscribes to: tableData
 * Events: @filterChanged, @rowClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;

// ======================
// CONFIG (Table Config 패턴)
// ======================

const tableConfig = {
    columns: [
        { title: 'ID', field: 'id', width: 60, hozAlign: 'center' },
        { title: 'Product', field: 'product', widthGrow: 2 },
        { title: 'Category', field: 'category', width: 120 },
        { title: 'Qty', field: 'quantity', width: 80, hozAlign: 'right' },
        {
            title: 'Price',
            field: 'price',
            width: 100,
            hozAlign: 'right',
            formatter: cell => `$${cell.getValue().toLocaleString()}`
        },
        {
            title: 'Total',
            field: 'total',
            width: 120,
            hozAlign: 'right',
            formatter: cell => `$${cell.getValue().toLocaleString()}`
        },
        { title: 'Date', field: 'date', width: 110, hozAlign: 'center' }
    ]
};

// ======================
// BINDINGS
// ======================

this.renderTable = renderTable.bind(this, tableConfig);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    tableData: ['renderTable']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// TABULATOR INITIALIZATION
// ======================

const tableContainer = this.appendElement.querySelector('.table-container');
const uniqueId = `table-${Date.now()}`;
tableContainer.id = uniqueId;

this.tableInstance = new Tabulator(`#${uniqueId}`, {
    layout: 'fitColumns',
    height: '100%',
    placeholder: 'No data available',
    columns: tableConfig.columns
});

this.tableInstance.on('rowClick', (e, row) => {
    const data = row.getData();
    Weventbus.emit('@rowClicked', {
        targetInstance: this,
        event: e,
        data: data
    });
});

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    change: {
        '.filter-select': '@filterChanged'
    }
};

bindEvents(this, this.customEvents);

console.log('[DataTable] Registered');

// ======================
// RENDER FUNCTIONS
// ======================

function renderTable(config, { response }) {
    const { data, meta } = response;
    if (!data) return;

    this.tableInstance.setData(data);

    const metaEl = this.appendElement.querySelector('.table-meta');
    if (metaEl && meta) {
        metaEl.textContent = `Total: ${meta.total} items (${meta.category})`;
    }

    console.log('[DataTable] Table rendered:', data.length, 'rows');
}
