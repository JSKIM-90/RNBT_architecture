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
 *
 * 패턴 포인트:
 * - Table Config 패턴 + optionBuilder
 * - Tabulator 라이브러리 통합
 * - 필터 변경 시 param으로 데이터 재요청
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;

// ======================
// CONFIG (Table Config 패턴)
// ======================

/**
 * 테이블 컬럼 설정
 *
 * Tabulator 컬럼 정의 형식
 * - title: 헤더 텍스트
 * - field: 데이터 필드명
 * - width: 컬럼 너비 (optional)
 * - hozAlign: 정렬 (left, center, right)
 * - formatter: 셀 포맷터 함수 (optional)
 */
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
    ],
    optionBuilder: getTableOptions
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

/**
 * Tabulator 인스턴스 초기화
 *
 * 주의:
 * - 컨테이너에 고유 ID 필요
 * - 초기화 후 setData()로 데이터 설정
 */
const tableContainer = this.element.querySelector('.table-container');
const uniqueId = `table-${Date.now()}`;
tableContainer.id = uniqueId;

this.tableInstance = new Tabulator(`#${uniqueId}`, {
    layout: 'fitColumns',
    height: '100%',
    placeholder: 'No data available',
    columns: tableConfig.columns
});

/**
 * 행 클릭 이벤트 처리
 *
 * Tabulator의 rowClick 이벤트를 WEventBus로 전파
 */
this.tableInstance.on('rowClick', (e, row) => {
    const data = row.getData();
    WEventBus.emit('@rowClicked', {
        targetInstance: this,
        event: e,
        data: data
    });
});

// ======================
// EVENT BINDING
// ======================

/**
 * 필터 변경 이벤트
 *
 * select 요소의 change 이벤트를 캡처하여
 * Page의 eventBusHandler에서 처리
 */
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

/**
 * 테이블 데이터 렌더링
 *
 * @param {Object} config - Table Config
 * @param {Object} response - API 응답 { success, data, meta }
 */
function renderTable(config, response) {
    const { data, meta } = response;
    if (!data) return;

    // Tabulator에 데이터 설정
    this.tableInstance.setData(data);

    // 메타 정보 표시 (총 개수, 현재 필터)
    const metaEl = this.element.querySelector('.table-meta');
    if (metaEl && meta) {
        metaEl.textContent = `Total: ${meta.total} items (${meta.category})`;
    }

    console.log('[DataTable] Table rendered:', data.length, 'rows');
}

// ======================
// OPTION BUILDER
// ======================

/**
 * Tabulator 옵션 빌더
 *
 * 확장 포인트:
 * - 정렬, 필터링, 페이지네이션 등 추가 가능
 */
function getTableOptions(config) {
    return {
        layout: 'fitColumns',
        responsiveLayout: 'collapse',
        height: '100%',
        placeholder: 'No data available',
        columns: config.columns
    };
}
