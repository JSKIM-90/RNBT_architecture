/*
 * Page - EventBrowser Component - register
 * 이벤트 현황 테이블 컴포넌트 (Tabulator 버전)
 *
 * Subscribes to: TBD_eventData
 * Events: @rowClicked, @resetClicked, @deleteClicked, @scrollUp, @scrollDown
 * Library: Tabulator
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   summary: {
 *     critical: number,  // 심각 카운트
 *     warning: number,   // 경계 카운트
 *     caution: number,   // 주의 카운트
 *     normal: number     // 정상 카운트
 *   },
 *   items: [
 *     {
 *       grade: 'critical' | 'warning' | 'caution' | 'normal',
 *       group: string,      // 업무그룹
 *       name: string,       // 업무명
 *       hostname: string,   // 호스트명
 *       time: string,       // 발생시간 (2025-00-00 00:00:00)
 *       solution: string,   // 솔루션
 *       area: string,       // 영역
 *       content: string     // 내용
 *     }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { go, map, each } = fx;

// ======================
// CONFIG
// ======================

const config = {
    selectors: {
        tableContainer: '.table-container',
        criticalCount: '[data-bind="criticalCount"]',
        warningCount: '[data-bind="warningCount"]',
        cautionCount: '[data-bind="cautionCount"]',
        normalCount: '[data-bind="normalCount"]'
    },
    gradeIcons: {
        critical: 'assets/515557f12424948eecae944a5fe423532f290941.svg',
        warning: 'assets/d094ff97df0fafdaaa3f19423c856ac8f7dfd07c.svg',
        caution: 'assets/c1f8d66da4c26d0f8b2fa61046dc17902ebadb5a.svg',
        normal: 'assets/a24ee710d5a2b3f82ab15ab24e3839f1c03bf037.svg'
    },
    gradeLabels: {
        critical: '심각',
        warning: '경계',
        caution: '주의',
        normal: '정상'
    },
    fields: {
        grade: 'TBD_grade',
        group: 'TBD_group',
        name: 'TBD_name',
        hostname: 'TBD_hostname',
        time: 'TBD_time',
        solution: 'TBD_solution',
        area: 'TBD_area',
        content: 'TBD_content'
    }
};

// ======================
// 보조 함수 (순수 함수)
// ======================

// 등급별 아이콘 HTML 생성
const createGradeIndicator = (gradeIcons, gradeLabels) => (grade) => {
    const icon = gradeIcons[grade] || gradeIcons.normal;
    const label = gradeLabels[grade] || '정상';
    const labelClass = grade === 'normal' ? 'status-indicator__label--normal' : '';

    return `
        <div class="status-indicator">
            <div class="status-indicator__icon status-indicator__icon--${grade}">
                <img src="${icon}" alt="">
                <div class="status-indicator__stroke status-indicator__stroke--${grade}"></div>
            </div>
            <span class="status-indicator__label ${labelClass}">${label}</span>
        </div>
    `;
};

// 데이터 변환
const toRenderData = (fields) => (item) => ({
    grade: item[fields.grade] ?? 'normal',
    group: item[fields.group] ?? '-',
    name: item[fields.name] ?? '-',
    hostname: item[fields.hostname] ?? '-',
    time: item[fields.time] ?? '-',
    solution: item[fields.solution] ?? '-',
    area: item[fields.area] ?? '-',
    content: item[fields.content] ?? '-'
});

// ======================
// TABULATOR INITIALIZATION
// ======================

const tableContainer = this.appendElement.querySelector(config.selectors.tableContainer);
const uniqueId = `tabulator-${this.id}`;
tableContainer.id = uniqueId;

const gradeFormatter = createGradeIndicator(config.gradeIcons, config.gradeLabels);

this.tableInstance = new Tabulator(`#${uniqueId}`, {
    layout: 'fitColumns',
    height: '100%',
    rowHeight: 36,
    placeholder: '데이터가 없습니다',
    headerSort: true,
    selectable: true,
    columns: [
        {
            title: '등급',
            field: 'grade',
            width: 122,
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: function(cell) {
                const value = cell.getValue();
                cell.getElement().classList.add('grade-cell');
                return gradeFormatter(value);
            }
        },
        {
            title: '업무그룹',
            field: 'group',
            width: 135,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '업무명',
            field: 'name',
            width: 135,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '호스트명',
            field: 'hostname',
            width: 135,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '발생시간',
            field: 'time',
            width: 165,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '솔루션',
            field: 'solution',
            width: 135,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '영역',
            field: 'area',
            width: 135,
            hozAlign: 'center',
            headerHozAlign: 'center'
        },
        {
            title: '내용',
            field: 'content',
            hozAlign: 'left',
            headerHozAlign: 'center'
        }
    ],
    rowClick: function(e, row) {
        console.log('[EventBrowser] Row clicked:', row.getData());
        Weventbus.emit('@rowClicked', { event: e, data: row.getData() });
    }
});

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    TBD_eventData: ['renderData']
};

this.renderData = renderData.bind(this, config);

go(
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
        '[data-action="reset"]': '@resetClicked',
        '[data-action="delete"]': '@deleteClicked',
        '[data-action="scroll-up"]': '@scrollUp',
        '[data-action="scroll-down"]': '@scrollDown'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderData(config, { response }) {
    const { data } = response;
    if (!data) return;

    const { summary, items } = data;
    console.log(`[EventBrowser] renderData: ${items?.length ?? 0} items`);

    const root = this.appendElement;

    // 1. 상태 요약 업데이트
    if (summary) {
        go(
            [
                [config.selectors.criticalCount, summary.critical ?? 0],
                [config.selectors.warningCount, summary.warning ?? 0],
                [config.selectors.cautionCount, summary.caution ?? 0],
                [config.selectors.normalCount, summary.normal ?? 0]
            ],
            each(([selector, value]) => {
                const el = root.querySelector(selector);
                if (el) el.textContent = value;
            })
        );
    }

    // 2. 테이블 데이터 업데이트
    if (items && this.tableInstance) {
        const tableData = go(
            items,
            map(toRenderData(config.fields))
        );
        this.tableInstance.setData(tableData);
    }
}
