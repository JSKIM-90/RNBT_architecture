/**
 * AssetList - 자산 목록 컴포넌트 (일반 2D 컴포넌트)
 *
 * 기능:
 * 1. 자산 목록 표시 (Tabulator 테이블)
 * 2. 검색 (이름/ID) - 내부 이벤트
 * 3. 필터 (타입/상태) - 내부 이벤트
 * 4. 새로고침 버튼 - 외부 이벤트 (@refreshClicked)
 * 5. 행 클릭 - 외부 이벤트 (@assetSelected)
 *
 * 데이터 흐름:
 * - GlobalDataPublisher의 'assets' topic 구독
 * - 페이지가 데이터 발행 → 컴포넌트가 수신하여 렌더링
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each } = fx;

initComponent.call(this);

function initComponent() {
    // ======================
    // 1. SUBSCRIPTIONS (GlobalDataPublisher 구독)
    // ======================
    this.subscriptions = {
        'assets': ['renderTable']
    };

    // ======================
    // 2. 상태 관리 (로컬 필터링용)
    // ======================
    this._allAssets = [];
    this._searchTerm = '';
    this._typeFilter = 'all';
    this._statusFilter = 'all';
    this._tableInstance = null;

    // ======================
    // 3. 테이블 설정
    // ======================
    this.tableConfig = {
        layout: 'fitColumns',
        height: '100%',
        placeholder: 'No assets found',
        selectable: 1,
        columns: [
            {
                title: 'ID',
                field: 'id',
                widthGrow: 1,
                headerSort: true
            },
            {
                title: 'Name',
                field: 'name',
                widthGrow: 2,
                headerSort: true
            },
            {
                title: 'Type',
                field: 'type',
                widthGrow: 1,
                headerSort: true,
                formatter: typeFormatter
            },
            {
                title: 'Zone',
                field: 'zone',
                widthGrow: 1,
                headerSort: true
            },
            {
                title: 'Status',
                field: 'status',
                widthGrow: 1,
                headerSort: true,
                formatter: statusFormatter
            }
        ]
    };

    // ======================
    // 4. 렌더링 함수 바인딩
    // ======================
    this.renderTable = renderTable.bind(this);

    // ======================
    // 5. Public Methods (로컬 필터링)
    // ======================
    this.search = search.bind(this);
    this.filterByType = filterByType.bind(this);
    this.filterByStatus = filterByStatus.bind(this);

    // ======================
    // 6. GlobalDataPublisher 구독 등록
    // ======================
    fx.go(
        Object.entries(this.subscriptions),
        each(([topic, fnList]) =>
            each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
        )
    );

    // ======================
    // 7. 내부 이벤트 (컴포넌트 자체 UI 상태 관리)
    // ======================
    this._internalHandlers = {};
    setupInternalHandlers.call(this);

    // ======================
    // 8. 외부 이벤트 (페이지에 알림)
    // ======================
    this.customEvents = {
        click: {
            '.refresh-btn': '@refreshClicked'
        }
    };

    bindEvents(this, this.customEvents);

    // ======================
    // 9. Tabulator 초기화
    // ======================
    initTable.call(this);

    console.log('[AssetList] Registered - subscribing to "assets" topic');
}

// ======================
// INTERNAL EVENT HANDLERS (내부 이벤트)
// ======================
function setupInternalHandlers() {
    const root = this.appendElement;

    // 검색 입력 핸들러
    this._internalHandlers.searchInput = (e) => this.search(e.target.value);

    // 타입 필터 핸들러
    this._internalHandlers.typeChange = (e) => this.filterByType(e.target.value);

    // 상태 필터 핸들러
    this._internalHandlers.statusChange = (e) => this.filterByStatus(e.target.value);

    // 이벤트 등록
    root.querySelector('.search-input')?.addEventListener('input', this._internalHandlers.searchInput);
    root.querySelector('.type-filter')?.addEventListener('change', this._internalHandlers.typeChange);
    root.querySelector('.status-filter')?.addEventListener('change', this._internalHandlers.statusChange);
}

// ======================
// FORMATTERS
// ======================
function typeFormatter(cell) {
    const value = cell.getValue();
    return `<span class="type-badge" data-type="${value}">${value.toUpperCase()}</span>`;
}

function statusFormatter(cell) {
    const value = cell.getValue();
    return `<span class="status-badge" data-status="${value}">${value}</span>`;
}

// ======================
// TABLE INITIALIZATION
// ======================
function initTable() {
    const container = this.appendElement.querySelector('.table-container');
    if (!container) return;

    const uniqueId = `tabulator-${this.id}`;
    container.id = uniqueId;

    const ctx = this;

    this._tableInstance = new Tabulator(`#${uniqueId}`, this.tableConfig);

    // Tabulator 6.x: on() 메서드로 이벤트 등록
    this._tableInstance.on('rowClick', (_, row) => {
        const asset = row.getData();
        onRowClick.call(ctx, asset);
    });
}

// ======================
// RENDER FUNCTIONS (GlobalDataPublisher에서 호출)
// ======================
function renderTable({ response }) {
    const { assets } = response.data;
    this._allAssets = assets || [];
    applyFilters.call(this);
    updateCount.call(this);
}

// ======================
// FILTER FUNCTIONS (로컬 필터링)
// ======================
function applyFilters() {
    const searchTerm = this._searchTerm.toLowerCase();
    const typeFilter = this._typeFilter;
    const statusFilter = this._statusFilter;

    const filtered = this._allAssets.filter(asset => {
        const matchesSearch = !searchTerm ||
            asset.name.toLowerCase().includes(searchTerm) ||
            asset.id.toLowerCase().includes(searchTerm);

        const matchesType = typeFilter === 'all' || asset.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    if (this._tableInstance) {
        this._tableInstance.setData(filtered);
    }

    updateCount.call(this, filtered.length);
}

function updateCount(count) {
    const countEl = this.appendElement.querySelector('.count-value');
    if (countEl) {
        countEl.textContent = count !== undefined ? count : this._allAssets.length;
    }
}

// ======================
// PUBLIC METHODS (로컬 필터링)
// ======================
function search(term) {
    this._searchTerm = term;
    applyFilters.call(this);
}

function filterByType(type) {
    this._typeFilter = type;
    applyFilters.call(this);
}

function filterByStatus(status) {
    this._statusFilter = status;
    applyFilters.call(this);
}

// ======================
// ROW CLICK HANDLER (외부 이벤트 발행)
// ======================
function onRowClick(asset) {
    // 페이지에 이벤트 발행 - 페이지가 어떤 컴포넌트를 호출할지 결정
    Weventbus.emit('@assetSelected', {
        event: { asset },
        targetInstance: this
    });
}
