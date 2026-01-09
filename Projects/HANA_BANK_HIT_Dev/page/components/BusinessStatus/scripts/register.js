/*
 * Page - BusinessStatus Component - register
 * 주요 업무 현황 컴포넌트
 *
 * Subscribes to: businessStatusData
 * Events: @rowClicked
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   sections: [
 *     {
 *       titles: ['1Q', '상품처리'],
 *       rows: [
 *         {
 *           label: '동시 사용자 수',
 *           col1: { current: '10,906', peak: '18,328' },
 *           col2: { current: '2,425', peak: '3,992' }
 *         },
 *         { label: '초당처리량', col1: {...}, col2: {...} },
 *         { label: '평균수행시간', col1: {...}, col2: {...} }
 *       ],
 *       colorType: 'cyan'  // cyan (#0defcb) or blue (#0de7ef)
 *     },
 *     {
 *       titles: ['개인뱅킹', '기업뱅킹'],
 *       rows: [...],
 *       colorType: 'blue'
 *     }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each } = fx;

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.row': '@rowClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    businessStatusData: ['renderData']
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
    if (!data || !data.sections) return;

    const { sections } = data;
    console.log(`[BusinessStatus] renderData: ${sections.length} sections`);

    const sectionElements = this.appendElement.querySelectorAll('.item[data-section]');

    sections.forEach((section, sectionIndex) => {
        const sectionEl = sectionElements[sectionIndex];
        if (!sectionEl) return;

        // Update section titles
        const title1 = sectionEl.querySelector('.section-title-1');
        const title2 = sectionEl.querySelector('.section-title-2');
        if (title1) title1.textContent = section.titles[0];
        if (title2) title2.textContent = section.titles[1];

        // Update rows
        const rows = sectionEl.querySelectorAll('.row');
        section.rows.forEach((rowData, rowIndex) => {
            const rowEl = rows[rowIndex];
            if (!rowEl) return;

            // Column 1 values
            const current1 = rowEl.querySelector('.value-block.first .value-current-1');
            const peak1 = rowEl.querySelector('.value-block.first .value-peak-1');
            if (current1) current1.textContent = rowData.col1.current;
            if (peak1) peak1.textContent = rowData.col1.peak;

            // Column 2 values
            const current2 = rowEl.querySelector('.value-block.second .value-current-2');
            const peak2 = rowEl.querySelector('.value-block.second .value-peak-2');
            if (current2) current2.textContent = rowData.col2.current;
            if (peak2) peak2.textContent = rowData.col2.peak;
        });
    });
}
