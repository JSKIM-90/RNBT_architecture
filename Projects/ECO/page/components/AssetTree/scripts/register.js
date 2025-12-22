/*
 * Page - AssetTree Component - register
 * 자산 트리 네비게이션 컴포넌트
 *
 * 계층 구조로 자산을 탐색하고 3D 컴포넌트와 연동
 * - Zone → Type → Asset 계층 구조
 * - 클릭 시 해당 3D 컴포넌트 포커스/상세 팝업
 * - 상태별 아이콘 표시 (정상/경고/위험)
 * - 검색/필터 기능
 *
 * Subscribes to: assetTree
 * Events: @assetSelected, @refreshClicked, @searchChanged, @filterChanged
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    assetTree: ['renderTree']
};

this.renderTree = renderTree.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// STATE
// ======================

this._treeData = null;
this._expandedNodes = new Set(['root']);
this._searchTerm = '';
this._filterStatus = 'all';

// ======================
// ICON CONFIG
// ======================

this.typeIcons = {
    ups: '⚡',
    pdu: '🔌',
    crac: '❄️',
    sensor: '🌡️'
};

this.statusColors = {
    normal: '#22c55e',
    warning: '#f59e0b',
    critical: '#ef4444'
};

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.refresh-btn': '@refreshClicked',
        '.expand-all-btn': '@expandAllClicked',
        '.collapse-all-btn': '@collapseAllClicked'
    },
    input: {
        '.search-input': '@searchChanged'
    },
    change: {
        '.status-filter': '@filterChanged'
    }
};

bindEvents(this, this.customEvents);

// ======================
// INTERNAL EVENT HANDLERS
// ======================

this._onSearch = onSearch.bind(this);
this._onFilterChange = onFilterChange.bind(this);
this._expandAll = expandAll.bind(this);
this._collapseAll = collapseAll.bind(this);
this._toggleNode = toggleNode.bind(this);
this._onAssetClick = onAssetClick.bind(this);
this._updateTreeView = updateTreeView.bind(this);
this._buildTreeHTML = buildTreeHTML.bind(this);
this._bindTreeEvents = bindTreeEvents.bind(this);

// Bind internal handlers to DOM events
const searchInput = this.element.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => this._onSearch(e.target.value));
}

const statusFilter = this.element.querySelector('.status-filter');
if (statusFilter) {
    statusFilter.addEventListener('change', (e) => this._onFilterChange(e.target.value));
}

const expandAllBtn = this.element.querySelector('.expand-all-btn');
if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => this._expandAll());
}

const collapseAllBtn = this.element.querySelector('.collapse-all-btn');
if (collapseAllBtn) {
    collapseAllBtn.addEventListener('click', () => this._collapseAll());
}

// ======================
// RENDER FUNCTIONS
// ======================

function renderTree(response) {
    const { zones } = response;
    console.log(`[AssetTree] renderTree: ${zones?.length || 0} zones`);

    this._treeData = response;
    this._updateTreeView();
}

function updateTreeView() {
    const container = this.element.querySelector('.tree-container');
    if (!container || !this._treeData) return;

    const html = this._buildTreeHTML(this._treeData.zones);
    container.innerHTML = html;
    this._bindTreeEvents(container);
}

function buildTreeHTML(zones) {
    const searchTerm = this._searchTerm.toLowerCase();
    const filterStatus = this._filterStatus;

    let html = '<ul class="tree-root">';

    zones.forEach(zone => {
        const zoneId = `zone-${zone.id}`;
        const isExpanded = this._expandedNodes.has(zoneId);

        // 필터링된 자산 수집
        const filteredTypes = {};
        let zoneHasMatch = false;

        Object.entries(zone.assets).forEach(([type, assets]) => {
            const filtered = assets.filter(asset => {
                const matchesSearch = !searchTerm ||
                    asset.name.toLowerCase().includes(searchTerm) ||
                    asset.id.toLowerCase().includes(searchTerm);
                const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
                return matchesSearch && matchesStatus;
            });

            if (filtered.length > 0) {
                filteredTypes[type] = filtered;
                zoneHasMatch = true;
            }
        });

        if (!zoneHasMatch && searchTerm) return;

        html += `
            <li class="tree-node zone-node ${isExpanded ? 'expanded' : ''}">
                <div class="node-header" data-node-id="${zoneId}">
                    <span class="node-toggle">${isExpanded ? '▼' : '▶'}</span>
                    <span class="node-icon">📁</span>
                    <span class="node-label">${zone.name}</span>
                    <span class="node-count">${zone.totalAssets}</span>
                </div>
                <ul class="node-children" style="display: ${isExpanded ? 'block' : 'none'}">
        `;

        Object.entries(filteredTypes).forEach(([type, assets]) => {
            const typeId = `${zoneId}-${type}`;
            const isTypeExpanded = this._expandedNodes.has(typeId);
            const typeIcon = this.typeIcons[type] || '📦';

            html += `
                <li class="tree-node type-node ${isTypeExpanded ? 'expanded' : ''}">
                    <div class="node-header" data-node-id="${typeId}">
                        <span class="node-toggle">${isTypeExpanded ? '▼' : '▶'}</span>
                        <span class="node-icon">${typeIcon}</span>
                        <span class="node-label">${type.toUpperCase()}</span>
                        <span class="node-count">${assets.length}</span>
                    </div>
                    <ul class="node-children" style="display: ${isTypeExpanded ? 'block' : 'none'}">
            `;

            assets.forEach(asset => {
                const statusColor = this.statusColors[asset.status] || '#888';
                html += `
                    <li class="tree-node asset-node" data-asset-id="${asset.id}" data-asset-type="${type}">
                        <div class="node-header asset-header">
                            <span class="status-dot" style="background: ${statusColor}"></span>
                            <span class="node-label">${asset.name}</span>
                            <span class="asset-id">${asset.id}</span>
                        </div>
                    </li>
                `;
            });

            html += '</ul></li>';
        });

        html += '</ul></li>';
    });

    html += '</ul>';
    return html;
}

function bindTreeEvents(container) {
    const ctx = this;

    // 토글 클릭
    container.querySelectorAll('.node-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const header = e.target.closest('.node-header');
            const nodeId = header.dataset.nodeId;
            if (nodeId) {
                ctx._toggleNode(nodeId);
            }
        });
    });

    // 자산 클릭
    container.querySelectorAll('.asset-node').forEach(node => {
        node.addEventListener('click', () => {
            const assetId = node.dataset.assetId;
            const assetType = node.dataset.assetType;
            ctx._onAssetClick(assetId, assetType);
        });
    });
}

function toggleNode(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
        this._expandedNodes.delete(nodeId);
    } else {
        this._expandedNodes.add(nodeId);
    }
    this._updateTreeView();
}

function onAssetClick(assetId, assetType) {
    console.log(`[AssetTree] Asset clicked: ${assetId} (${assetType})`);

    // 선택 상태 표시
    const prevSelected = this.element.querySelector('.asset-node.selected');
    if (prevSelected) prevSelected.classList.remove('selected');

    const currentNode = this.element.querySelector(`[data-asset-id="${assetId}"]`);
    if (currentNode) currentNode.classList.add('selected');

    // 커스텀 이벤트 발송 (3D 컴포넌트와 연동용)
    this.element.dispatchEvent(new CustomEvent('assetSelected', {
        bubbles: true,
        detail: { assetId, assetType }
    }));
}

// ======================
// SEARCH & FILTER
// ======================

function onSearch(term) {
    this._searchTerm = term;
    this._updateTreeView();
}

function onFilterChange(status) {
    this._filterStatus = status;
    this._updateTreeView();
}

function expandAll() {
    if (!this._treeData) return;
    this._treeData.zones.forEach(zone => {
        this._expandedNodes.add(`zone-${zone.id}`);
        Object.keys(zone.assets).forEach(type => {
            this._expandedNodes.add(`zone-${zone.id}-${type}`);
        });
    });
    this._updateTreeView();
}

function collapseAll() {
    this._expandedNodes.clear();
    this._expandedNodes.add('root');
    this._updateTreeView();
}

console.log('[AssetTree] Registered');
