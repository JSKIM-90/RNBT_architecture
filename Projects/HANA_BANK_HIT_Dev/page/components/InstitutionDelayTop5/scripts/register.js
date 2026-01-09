/*
 * Page - InstitutionDelayTop5 Component - register
 * 타 기관 지연 TOP5 테이블 컴포넌트
 *
 * Subscribes to: institutionDelayData
 * Events: @rowClicked
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
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.table-row': '@rowClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderData({ response }) {
    const { data } = response;
    if (!data || !data.items) return;

    const { items } = data;
    console.log(`[InstitutionDelayTop5] renderData: ${items.length} items`);

    const rowTemplate = this.appendElement.querySelector('#row-template');
    const categoryTemplate = this.appendElement.querySelector('#category-template');
    const tableBody = this.appendElement.querySelector('.table-body');
    const categoryTable = this.appendElement.querySelector('.category-table');

    if (!rowTemplate || !categoryTemplate || !tableBody || !categoryTable) return;

    // Clear existing content
    tableBody.innerHTML = '';
    categoryTable.innerHTML = '';

    items.forEach((item, index) => {
        // Render category cell
        const categoryClone = categoryTemplate.content.cloneNode(true);
        const categoryCell = categoryClone.querySelector('.category-cell');
        const categoryLabel = categoryClone.querySelector('.category-label');

        if (item.category === 'electronic') {
            categoryCell.classList.add('type-electronic');
            categoryLabel.classList.add('electronic');
            categoryLabel.textContent = '전자';
        } else {
            categoryCell.classList.add('type-openbanking');
            categoryLabel.classList.add('openbanking', 'category-label-multiline');
            categoryLabel.innerHTML = '<span>오픈</span><span>뱅킹</span>';
        }

        categoryTable.appendChild(categoryClone);

        // Render data row
        const rowClone = rowTemplate.content.cloneNode(true);
        const tableRow = rowClone.querySelector('.table-row');

        tableRow.classList.add(index % 2 === 0 ? 'odd' : 'even');
        tableRow.dataset.index = index;
        tableRow.dataset.name = item.name;

        rowClone.querySelector('.name-cell-text').textContent = item.name;
        rowClone.querySelector('.data-timeout').textContent = formatNumber(item.timeout);
        rowClone.querySelector('.data-delay').textContent = formatNumber(item.delay);
        rowClone.querySelector('.data-inquiry').textContent = formatNumber(item.inquiry);
        rowClone.querySelector('.data-deposit').textContent = formatNumber(item.deposit);

        tableBody.appendChild(rowClone);
    });
}

function formatNumber(num) {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
}