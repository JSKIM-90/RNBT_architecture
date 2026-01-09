/*
 * Page - InstitutionDelayTop5Tabulator Component - register
 * 타 기관 지연 TOP5 테이블 컴포넌트 (Tabulator 버전)
 *
 * Subscribes to: institutionDelayData
 * Events: @rowClicked
 * Library: Tabulator
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   items: [
 *     {
 *       category: 'electronic' | 'openbanking',
 *       name: string,       // 기관명 (국민은행, 카카오뱅크 등)
 *       timeout: number,    // time_out 값
 *       delay: number,      // 지연 값
 *       inquiry: number,    // 조회대행 값
 *       deposit: number     // 입지대행 값
 *     }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each } = fx;

// ======================
// TABULATOR INITIALIZATION
// ======================

// 컴포넌트 내 고유 선택자 생성
const tableContainer = this.appendElement.querySelector('.table-container');
const uniqueId = `tabulator-${this.id}`;
tableContainer.id = uniqueId;

// NOTE: 컨테이너가 CSS 'fit-content' 속성을 가진 경우,
// 'fitColumns'는 무한 resize 루프를 유발할 수 있음 (서로 크기 참조).
// 그 경우 'fitData'를 사용하여 테이블이 고정 너비를 갖도록 변경 필요.
this.tableInstance = new Tabulator(`#${uniqueId}`, {
    layout: 'fitColumns',
    height: '100%',
    rowHeight: 28,
    placeholder: '데이터가 없습니다',
    headerSort: false,
    columns: [
        {
            title: '',
            field: 'category',
            width: 40,
            hozAlign: 'center',
            formatter: function(cell) {
                const value = cell.getValue();
                cell.getElement().classList.add('category-cell');
                cell.getElement().classList.add(value);

                if (value === 'electronic') {
                    return '전자';
                } else {
                    return '<span style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:28px;line-height:12px;"><span>오픈</span><span>뱅킹</span></span>';
                }
            }
        },
        {
            title: '기관명',
            field: 'name',
            width: 93,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: function(cell) {
                cell.getElement().classList.add('name-cell');
                return cell.getValue();
            }
        },
        {
            title: 'time_out',
            field: 'timeout',
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: function(cell) {
                cell.getElement().classList.add('number-cell');
                const value = cell.getValue();
                return value !== undefined ? value.toLocaleString() : '0';
            }
        },
        {
            title: '지연',
            field: 'delay',
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: function(cell) {
                cell.getElement().classList.add('number-cell');
                const value = cell.getValue();
                return value !== undefined ? value.toLocaleString() : '0';
            }
        },
        {
            title: '조회대행',
            field: 'inquiry',
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: function(cell) {
                cell.getElement().classList.add('number-cell');
                const value = cell.getValue();
                return value !== undefined ? value.toLocaleString() : '0';
            }
        },
        {
            title: '입지대행',
            field: 'deposit',
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: function(cell) {
                cell.getElement().classList.add('number-cell');
                const value = cell.getValue();
                return value !== undefined ? value.toLocaleString() : '0';
            }
        }
    ],
    rowClick: function(e, row) {
        console.log('[InstitutionDelayTop5Tabulator] Row clicked:', row.getData());
        Weventbus.emit('@rowClicked', { event: e, data: row.getData() });
    }
});

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    institutionDelayData: ['renderData']
};

this.renderData = renderData.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// RENDER FUNCTIONS
// ======================

function renderData({ response }) {
    const { data } = response;
    if (!data || !data.items) return;

    const { items } = data;
    console.log(`[InstitutionDelayTop5Tabulator] renderData: ${items.length} items`);

    if (!this.tableInstance) return;

    this.tableInstance.setData(items);
}
