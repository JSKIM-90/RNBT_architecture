/*
 * AssetTree Component - register
 * 계층형 자산 트리 뷰어 (검색 기능 포함)
 *
 * Subscribes to: TBD_topicName
 * Events: @TBD_nodeClicked, @TBD_nodeToggled, @TBD_searchChanged
 *
 * Expected Data Structure:
 * {
 *   title: "Asset Tree",
 *   items: [
 *     {
 *       id: "1",
 *       name: "Building A",
 *       type: "zone",
 *       children: [
 *         { id: "1-1", name: "Floor 1", type: "zone", children: [...] },
 *         { id: "1-2", name: "Sensor A", type: "sensor" }
 *       ]
 *     }
 *   ]
 * }
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;

// ======================
// CONFIG (정적 선언)
// ======================

const config = {
    titleKey: 'TBD_title',
    itemsKey: 'TBD_items',
    fields: {
        id: 'TBD_id',
        name: 'TBD_name',
        type: 'TBD_type',
        children: 'TBD_children'
    },
    defaultType: 'default'
};

// ======================
// STATE
// ======================

this._expandedNodes = new Set();
this._selectedNodeId = null;
this._searchTerm = '';
this._treeData = null;
this._internalHandlers = {};

// ======================
// BINDINGS (바인딩)
// ======================

this.renderData = renderData.bind(this, config);
this.toggleNode = toggleNode.bind(this);
this.selectNode = selectNode.bind(this);
this.expandAll = expandAll.bind(this);
this.collapseAll = collapseAll.bind(this);
this.handleSearch = handleSearch.bind(this, config);

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    TBD_topicName: ['renderData']
};

fx.go(
    Object.entries(this.subscriptions),
    fx.each(([topic, fnList]) =>
        fx.each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.node-toggle': '@TBD_nodeToggled',
        '.node-content': '@TBD_nodeClicked',
        '.btn-expand-all': '@TBD_expandAllClicked',
        '.btn-collapse-all': '@TBD_collapseAllClicked'
    },
    input: {
        '.search-input': '@TBD_searchChanged'
    }
};

bindEvents(this, this.customEvents);

// 내부 이벤트 핸들러 (컴포넌트 자체 동작)
setupInternalHandlers.call(this);

// ======================
// RENDER FUNCTIONS (호이스팅)
// ======================

function renderData(config, { response }) {
    const { data } = response;
    if (!data) return;

    // 타이틀 렌더링
    const titleEl = this.appendElement.querySelector('.tree-title');
    if (titleEl && data[config.titleKey]) {
        titleEl.textContent = data[config.titleKey];
    }

    // 트리 데이터 저장
    const items = data[config.itemsKey];
    if (items && Array.isArray(items)) {
        this._treeData = items;
        renderTree.call(this, config, items);
    }
}

function renderTree(config, items, searchTerm = '') {
    const rootEl = this.appendElement.querySelector('.tree-root');
    if (!rootEl) return;

    rootEl.innerHTML = '';

    const normalizedSearch = searchTerm.toLowerCase().trim();

    fx.go(
        items,
        fx.each(item => {
            const nodeEl = createNodeElement.call(this, config, item, normalizedSearch);
            if (nodeEl) rootEl.appendChild(nodeEl);
        })
    );
}

function createNodeElement(config, item, searchTerm) {
    const { fields, defaultType } = config;

    const id = item[fields.id];
    const name = item[fields.name] || '-';
    const type = item[fields.type] || defaultType;
    const children = item[fields.children] || [];
    const hasChildren = children.length > 0;
    const isExpanded = this._expandedNodes.has(id);
    const isSelected = this._selectedNodeId === id;

    // 검색 필터링
    const matchesSearch = !searchTerm || name.toLowerCase().includes(searchTerm);
    const hasMatchingChildren = hasChildren && hasMatchingDescendants(children, fields, searchTerm);

    // 검색어가 있고, 본인도 자식도 매칭 안되면 숨김
    if (searchTerm && !matchesSearch && !hasMatchingChildren) {
        return null;
    }

    const li = document.createElement('li');
    li.className = 'tree-node';
    li.dataset.nodeId = id;

    // Node Content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'node-content';
    if (isSelected) contentDiv.classList.add('selected');
    if (searchTerm && matchesSearch) contentDiv.classList.add('highlight');

    // Toggle Arrow
    const toggleSpan = document.createElement('span');
    toggleSpan.className = 'node-toggle';
    if (hasChildren) {
        toggleSpan.textContent = '▶';
        if (isExpanded) toggleSpan.classList.add('expanded');
    } else {
        toggleSpan.classList.add('leaf');
    }

    // Icon
    const iconSpan = document.createElement('span');
    iconSpan.className = 'node-icon';
    iconSpan.dataset.type = type;

    // Label
    const labelSpan = document.createElement('span');
    labelSpan.className = 'node-label';
    labelSpan.textContent = name;
    if (searchTerm && !matchesSearch && hasMatchingChildren) {
        labelSpan.classList.add('dimmed');
    }

    contentDiv.appendChild(toggleSpan);
    contentDiv.appendChild(iconSpan);
    contentDiv.appendChild(labelSpan);
    li.appendChild(contentDiv);

    // Children
    if (hasChildren) {
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'node-children';
        if (isExpanded || (searchTerm && hasMatchingChildren)) {
            childrenUl.classList.add('expanded');
        }

        fx.go(
            children,
            fx.each(child => {
                const childEl = createNodeElement.call(this, config, child, searchTerm);
                if (childEl) childrenUl.appendChild(childEl);
            })
        );

        li.appendChild(childrenUl);
    }

    return li;
}

function hasMatchingDescendants(children, fields, searchTerm) {
    if (!searchTerm) return false;

    return children.some(child => {
        const name = (child[fields.name] || '').toLowerCase();
        if (name.includes(searchTerm)) return true;

        const grandChildren = child[fields.children] || [];
        return grandChildren.length > 0 && hasMatchingDescendants(grandChildren, fields, searchTerm);
    });
}

// ======================
// INTERNAL HANDLERS
// ======================

function setupInternalHandlers() {
    const root = this.appendElement;

    // 핸들러 참조 저장 (beforeDestroy에서 제거용)
    this._internalHandlers.toggleClick = (e) => {
        const toggle = e.target.closest('.node-toggle');
        if (toggle && !toggle.classList.contains('leaf')) {
            e.stopPropagation();
            const nodeEl = toggle.closest('.tree-node');
            if (nodeEl) {
                this.toggleNode(nodeEl.dataset.nodeId);
            }
        }
    };

    this._internalHandlers.nodeClick = (e) => {
        const content = e.target.closest('.node-content');
        if (content && !e.target.closest('.node-toggle')) {
            const nodeEl = content.closest('.tree-node');
            if (nodeEl) {
                this.selectNode(nodeEl.dataset.nodeId);
            }
        }
    };

    this._internalHandlers.expandAllClick = () => this.expandAll();
    this._internalHandlers.collapseAllClick = () => this.collapseAll();
    this._internalHandlers.searchInput = (e) => this.handleSearch(e.target.value);

    // 핸들러 바인딩
    root.addEventListener('click', this._internalHandlers.toggleClick);
    root.addEventListener('click', this._internalHandlers.nodeClick);
    root.querySelector('.btn-expand-all')?.addEventListener('click', this._internalHandlers.expandAllClick);
    root.querySelector('.btn-collapse-all')?.addEventListener('click', this._internalHandlers.collapseAllClick);
    root.querySelector('.search-input')?.addEventListener('input', this._internalHandlers.searchInput);
}

function toggleNode(nodeId) {
    if (this._expandedNodes.has(nodeId)) {
        this._expandedNodes.delete(nodeId);
    } else {
        this._expandedNodes.add(nodeId);
    }
    updateNodeVisuals.call(this, nodeId);
}

function selectNode(nodeId) {
    const prevSelected = this.appendElement.querySelector('.node-content.selected');
    if (prevSelected) prevSelected.classList.remove('selected');

    this._selectedNodeId = nodeId;

    const nodeEl = this.appendElement.querySelector(`[data-node-id="${nodeId}"] > .node-content`);
    if (nodeEl) nodeEl.classList.add('selected');
}

function expandAll() {
    collectAllNodeIds.call(this, this._treeData, this._expandedNodes);
    if (this._treeData) {
        renderTree.call(this, config, this._treeData, this._searchTerm);
    }
}

function collapseAll() {
    this._expandedNodes.clear();
    if (this._treeData) {
        renderTree.call(this, config, this._treeData, this._searchTerm);
    }
}

function collectAllNodeIds(items, set) {
    if (!items) return;
    const { fields } = config;

    fx.go(
        items,
        fx.each(item => {
            const children = item[fields.children];
            if (children && children.length > 0) {
                set.add(item[fields.id]);
                collectAllNodeIds.call(this, children, set);
            }
        })
    );
}

function handleSearch(config, value) {
    this._searchTerm = value;
    if (this._treeData) {
        renderTree.call(this, config, this._treeData, value);
    }
}

function updateNodeVisuals(nodeId) {
    const nodeEl = this.appendElement.querySelector(`[data-node-id="${nodeId}"]`);
    if (!nodeEl) return;

    const toggle = nodeEl.querySelector(':scope > .node-content > .node-toggle');
    const children = nodeEl.querySelector(':scope > .node-children');
    const isExpanded = this._expandedNodes.has(nodeId);

    if (toggle) {
        toggle.classList.toggle('expanded', isExpanded);
    }
    if (children) {
        children.classList.toggle('expanded', isExpanded);
    }
}
