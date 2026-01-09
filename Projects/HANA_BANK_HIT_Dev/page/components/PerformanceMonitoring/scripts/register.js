/*
 * Page - PerformanceMonitoring Component - register
 * 성능 TOP10 컴포넌트
 *
 * Subscribes to: TBD_performanceData
 * Events: @typeChanged, @itemClicked
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   activeType: 'CPU' | 'GPU',
 *   items: [
 *     {
 *       rank: 1,
 *       name: 'Application Support',
 *       hostname: 'sys-web-prd-01',
 *       value: 96
 *     },
 *     ...
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { go, map, each, pipe } = fx;

// ======================
// CONFIG
// ======================

const config = {
    selectors: {
        list: '.list',
        template: '#list-item-template',
        item: '.list__item',
        typeBtn: '.action__btn'
    },
    fields: {
        rank: 'TBD_rank',
        name: 'TBD_name',
        hostname: 'TBD_hostname',
        value: 'TBD_value'
    }
};

// ======================
// 보조 함수 (순수 함수)
// ======================

// 데이터 → 렌더링용 데이터 변환
const toRenderData = (fields) => (item, i) => ({
    rank: item[fields.rank] ?? (i + 1),
    name: item[fields.name] ?? '-',
    hostname: item[fields.hostname] ?? '-',
    value: item[fields.value] ?? 0
});

// template clone → item element 생성
const cloneTemplate = (template) => () =>
    template.content.cloneNode(true).querySelector('.list__item');

// item element에 데이터 바인딩
const bindItemData = (item, data, index) => (
    item.querySelector('.num__text').textContent = data.rank,
    item.querySelector('.name__text').textContent = data.name,
    item.querySelector('.block__host').textContent = data.hostname,
    item.querySelector('.progress__bar').style.setProperty('--progress', `${data.value}%`),
    item.querySelector('.value__number').textContent = data.value,
    item.dataset.index = index,
    item
);

// 버튼 활성화 상태 설정
const setButtonActive = (activeType) => (btn) => {
    const isActive = btn.dataset.type === activeType;
    const textEl = btn.querySelector('.btn__text');
    btn.classList.toggle('action__btn--active', isActive);
    if (textEl) {
        textEl.classList.toggle('btn__text--active', isActive);
        textEl.classList.toggle('btn__text--inactive', !isActive);
    }
};

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    TBD_performanceData: ['renderData']
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
        '.action__btn': '@typeChanged',
        '.list__item': '@itemClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderData(config, { response }) {
    const { data } = response;
    if (!data || !data.items) return;

    const { items, activeType } = data;
    console.log(`[PerformanceMonitoring] renderData: ${items.length} items, type: ${activeType}`);

    const root = this.appendElement;
    const list = root.querySelector(config.selectors.list);
    const template = root.querySelector(config.selectors.template);

    if (!list || !template) {
        console.error('[PerformanceMonitoring] list or template not found');
        return;
    }

    // 1. 버튼 상태 업데이트 (부수효과)
    if (activeType) {
        go(
            root.querySelectorAll(config.selectors.typeBtn),
            each(setButtonActive(activeType))
        );
    }

    // 2. 기존 아이템 제거 (부수효과)
    go(
        list.querySelectorAll(config.selectors.item),
        each(item => item.remove())
    );

    // 3. 데이터 변환 → DOM 생성 → 추가 (파이프라인)
    go(
        items,
        map(toRenderData(config.fields)),                          // 데이터 변환
        map((data, i) => bindItemData(cloneTemplate(template)(), data, i)),  // DOM 생성 + 바인딩
        each(item => list.appendChild(item))                       // 부수효과: DOM 추가
    );
}
