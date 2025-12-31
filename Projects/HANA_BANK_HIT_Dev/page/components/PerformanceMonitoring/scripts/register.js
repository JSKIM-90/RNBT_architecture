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
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// CONFIG
// ======================

const config = {
    selectors: {
        list: '.list',
        template: '#list-item-template',
        typeBtn: '.action__btn',
        // Item selectors (relative to item element)
        rank: '.num__text',
        name: '.name__text',
        hostname: '.block__host',
        progressBar: '.progress__bar',
        valueNumber: '.value__number'
    },
    fields: {
        rank: 'TBD_rank',
        name: 'TBD_name',
        hostname: 'TBD_hostname',
        value: 'TBD_value'
    }
};

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    TBD_performanceData: ['renderData']
};

this.renderData = renderData.bind(this, config);

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
        '.action__btn': '@typeChanged',
        '.list__item': '@itemClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderData(config, response) {
    const { data } = response;
    if (!data || !data.items) return;

    const { items, activeType } = data;
    console.log(`[PerformanceMonitoring] renderData: ${items.length} items, type: ${activeType}`);

    const root = this.element;
    const list = root.querySelector(config.selectors.list);
    const template = root.querySelector(config.selectors.template);

    if (!list || !template) {
        console.error('[PerformanceMonitoring] list or template not found');
        return;
    }

    // Update active type buttons
    if (activeType) {
        updateActiveType.call(this, config, activeType);
    }

    // Clear existing items (except template)
    const existingItems = list.querySelectorAll('.list__item');
    existingItems.forEach(item => item.remove());

    // Render items from template
    items.forEach((itemData, index) => {
        const clone = template.content.cloneNode(true);
        const item = clone.querySelector('.list__item');

        // Set rank
        const rankEl = item.querySelector(config.selectors.rank);
        if (rankEl) rankEl.textContent = itemData[config.fields.rank] ?? (index + 1);

        // Set name
        const nameEl = item.querySelector(config.selectors.name);
        if (nameEl) nameEl.textContent = itemData[config.fields.name] ?? '-';

        // Set hostname
        const hostnameEl = item.querySelector(config.selectors.hostname);
        if (hostnameEl) hostnameEl.textContent = itemData[config.fields.hostname] ?? '-';

        // Set progress bar
        const progressBar = item.querySelector(config.selectors.progressBar);
        const value = itemData[config.fields.value] ?? 0;
        if (progressBar) progressBar.style.setProperty('--progress', `${value}%`);

        // Set value number
        const valueEl = item.querySelector(config.selectors.valueNumber);
        if (valueEl) valueEl.textContent = value;

        // Store data for event handling
        item.dataset.index = index;

        list.appendChild(item);
    });
}

function updateActiveType(config, activeType) {
    const root = this.element;
    const buttons = root.querySelectorAll(config.selectors.typeBtn);

    buttons.forEach(btn => {
        const btnType = btn.dataset.type;
        const textEl = btn.querySelector('.btn__text');

        if (btnType === activeType) {
            btn.classList.add('action__btn--active');
            if (textEl) {
                textEl.classList.remove('btn__text--inactive');
                textEl.classList.add('btn__text--active');
            }
        } else {
            btn.classList.remove('action__btn--active');
            if (textEl) {
                textEl.classList.remove('btn__text--active');
                textEl.classList.add('btn__text--inactive');
            }
        }
    });
}
