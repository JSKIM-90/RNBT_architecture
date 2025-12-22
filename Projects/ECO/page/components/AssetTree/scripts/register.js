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
 * Events: @refreshClicked (외부 발송), assetSelected (CustomEvent)
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
// EVENT BINDING (페이지 핸들러로 발송)
// ======================

this.customEvents = {
    click: {
        '.refresh-btn': '@refreshClicked',
        '.expand-all-btn': '@expandAllClicked',
        '.collapse-all-btn': '@collapseAllClicked',
        '.node-toggle': '@nodeToggled',
        '.asset-node': '@assetClicked'
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
// INTERNAL HANDLERS
// ======================

this._updateTreeView = updateTreeView.bind(this);
this._buildTree = buildTree.bind(this);
this._createZoneNode = createZoneNode.bind(this);
this._createTypeNode = createTypeNode.bind(this);
this._createAssetNode = createAssetNode.bind(this);

// ======================
// PUBLIC API (페이지 핸들러에서 호출)
// ======================

this.search = function(term) {
    this._searchTerm = term;
    this._updateTreeView();
};

this.filter = function(status) {
    this._filterStatus = status;
    this._updateTreeView();
};

this.expandAll = function() {
    if (!this._treeData) return;
    this._treeData.zones.forEach(zone => {
        this._expandedNodes.add(`zone-${zone.id}`);
        Object.keys(zone.assets).forEach(type => {
            this._expandedNodes.add(`zone-${zone.id}-${type}`);
        });
    });
    this._updateTreeView();
};

this.collapseAll = function() {
    this._expandedNodes.clear();
    this._expandedNodes.add('root');
    this._updateTreeView();
};

this.toggleNode = function(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
        this._expandedNodes.delete(nodeId);
    } else {
        this._expandedNodes.add(nodeId);
    }
    this._updateTreeView();
};

this.selectAsset = function(assetId, assetType) {
    console.log(`[AssetTree] Asset selected: ${assetId} (${assetType})`);

    // 선택 상태 표시
    const prevSelected = this.element.querySelector('.asset-node.selected');
    if (prevSelected) prevSelected.classList.remove('selected');

    const currentNode = this.element.querySelector(`[data-asset-id="${assetId}"]`);
    if (currentNode) currentNode.classList.add('selected');
};

// ======================
// TEMPLATE REFERENCES
// ======================

this._templates = {
    zone: this.element.querySelector('#tpl-zone-node'),
    type: this.element.querySelector('#tpl-type-node'),
    asset: this.element.querySelector('#tpl-asset-node')
};

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
    const treeRoot = this.element.querySelector('.tree-root');
    if (!treeRoot || !this._treeData) return;

    treeRoot.innerHTML = '';
    this._buildTree(treeRoot, this._treeData.zones);
}

function buildTree(treeRoot, zones) {
    const searchTerm = this._searchTerm.toLowerCase();
    const filterStatus = this._filterStatus;

    zones.forEach(zone => {
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

        const zoneNode = this._createZoneNode(zone);
        const zoneChildren = zoneNode.querySelector('.node-children');

        Object.entries(filteredTypes).forEach(([type, assets]) => {
            const typeNode = this._createTypeNode(zone.id, type, assets.length);
            const typeChildren = typeNode.querySelector('.node-children');

            assets.forEach(asset => {
                const assetNode = this._createAssetNode(asset, type);
                typeChildren.appendChild(assetNode);
            });

            zoneChildren.appendChild(typeNode);
        });

        treeRoot.appendChild(zoneNode);
    });
}

function createZoneNode(zone) {
    const zoneId = `zone-${zone.id}`;
    const isExpanded = this._expandedNodes.has(zoneId);

    const node = this._templates.zone.content.cloneNode(true).firstElementChild;
    node.classList.toggle('expanded', isExpanded);

    const header = node.querySelector('.node-header');
    header.dataset.nodeId = zoneId;

    node.querySelector('.node-toggle').textContent = isExpanded ? '▼' : '▶';
    node.querySelector('.node-label').textContent = zone.name;
    node.querySelector('.node-count').textContent = zone.totalAssets;
    node.querySelector('.node-children').style.display = isExpanded ? 'block' : 'none';

    return node;
}

function createTypeNode(zoneId, type, count) {
    const typeId = `zone-${zoneId}-${type}`;
    const isExpanded = this._expandedNodes.has(typeId);
    const typeIcon = this.typeIcons[type] || '📦';

    const node = this._templates.type.content.cloneNode(true).firstElementChild;
    node.classList.toggle('expanded', isExpanded);

    const header = node.querySelector('.node-header');
    header.dataset.nodeId = typeId;

    node.querySelector('.node-toggle').textContent = isExpanded ? '▼' : '▶';
    node.querySelector('.node-icon').textContent = typeIcon;
    node.querySelector('.node-label').textContent = type.toUpperCase();
    node.querySelector('.node-count').textContent = count;
    node.querySelector('.node-children').style.display = isExpanded ? 'block' : 'none';

    return node;
}

function createAssetNode(asset, type) {
    const statusColor = this.statusColors[asset.status] || '#888';

    const node = this._templates.asset.content.cloneNode(true).firstElementChild;
    node.dataset.assetId = asset.id;
    node.dataset.assetType = type;

    node.querySelector('.status-dot').style.background = statusColor;
    node.querySelector('.node-label').textContent = asset.name;
    node.querySelector('.asset-id').textContent = asset.id;

    return node;
}

console.log('[AssetTree] Registered');
