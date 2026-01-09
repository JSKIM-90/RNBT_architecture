/*
 * Page - PerformanceStatus Component - register
 * 구간별 성능현황 컴포넌트
 *
 * Subscribes to: performanceStatusData
 * Events: @itemClicked
 *
 * 데이터 구조 (Bottom-Up 추론):
 * {
 *   header: {
 *     count: number,        // 전체 건수 (681)
 *     totalTps: number,     // 전체 TPS (16959.0)
 *     avgResponse: number   // 평균 응답시간 (0.603)
 *   },
 *   items: [
 *     {
 *       label: string,      // 구간명 (전체, WEB, WAS, TP, TP-DB, MCA, 대내 EAI, 대내 EIC, 대외 EIC)
 *       number: number,     // 건수
 *       tps: number,        // TPS
 *       response: number,   // 응답시간
 *       cylinderType: string // 실린더 타입 (green, blue, red, yellow)
 *     }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each } = fx;

// ======================
// CYLINDER TYPE MAPPING
// ======================

// 실린더 이미지 매핑 (Figma 에셋 해시)
const CYLINDER_ASSETS = {
    green: 'assets/22d18fb2964a57ef7db9eaa50bd9135cbff48aa5.svg',
    blue: 'assets/cad60b4e3cd34eaac69c5d923a31932955d32d8c.svg',
    yellow: 'assets/3d5912f055fba78c669d556c26e1f66c6ef0cc1a.svg',
    red: 'assets/fa8972967a99dcd64e9820680b79f9346edeef9f.svg',
    purple: 'assets/60de5f08b5d94f20c34edde8382f259149e5ae2f.svg'
};

// ======================
// DOM REFERENCES
// ======================

const itemTemplate = this.appendElement.querySelector('#item-template');
const itemsContainer = this.appendElement.querySelector('.items-container');
const headerCount = this.appendElement.querySelector('.header-count');
const headerTps = this.appendElement.querySelector('.header-tps');
const headerResponse = this.appendElement.querySelector('.header-response');

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.item': '@itemClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    performanceStatusData: ['renderData']
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
    if (!data) return;

    const { header, items } = data;

    // Render header
    if (header) {
        if (headerCount) headerCount.textContent = header.count.toLocaleString();
        if (headerTps) headerTps.textContent = header.totalTps.toLocaleString();
        if (headerResponse) headerResponse.textContent = header.avgResponse.toFixed(3);
    }

    // Render items
    if (!items || !itemTemplate || !itemsContainer) return;

    console.log(`[PerformanceStatus] renderData: ${items.length} items`);

    // Clear existing items
    itemsContainer.innerHTML = '';

    // Group items into rows of 3
    const rows = [];
    for (let i = 0; i < items.length; i += 3) {
        rows.push(items.slice(i, i + 3));
    }

    // Render rows
    rows.forEach(rowItems => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row';

        rowItems.forEach((item, index) => {
            const clone = itemTemplate.content.cloneNode(true);
            const itemEl = clone.querySelector('.item');

            // Set cylinder image
            const cylinderImg = itemEl.querySelector('.cylinder-img img');
            if (cylinderImg) {
                cylinderImg.src = CYLINDER_ASSETS[item.cylinderType] || CYLINDER_ASSETS.green;
            }

            // Set number
            const numberEl = itemEl.querySelector('.item-number');
            if (numberEl) {
                numberEl.textContent = item.number;
            }

            // Set label
            const labelEl = itemEl.querySelector('.item-label p');
            if (labelEl) {
                labelEl.textContent = item.label;
            }

            // Set TPS (no comma formatting per Figma design)
            const tpsEl = itemEl.querySelector('.item-tps p');
            if (tpsEl) {
                tpsEl.textContent = item.tps;
            }

            // Set response
            const responseEl = itemEl.querySelector('.item-response p');
            if (responseEl) {
                responseEl.textContent = item.response.toFixed(3);
            }

            // Store data for event handling
            itemEl.dataset.index = index;
            itemEl.dataset.label = item.label;

            rowDiv.appendChild(clone);
        });

        itemsContainer.appendChild(rowDiv);
    });
}
