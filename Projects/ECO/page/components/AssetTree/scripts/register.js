/**
 * AssetTree - 자산 트리 네비게이션 컴포넌트
 *
 * 계층 구조로 자산을 탐색하고 3D 컴포넌트와 연동
 * - Zone → Type → Asset 계층 구조
 * - 클릭 시 해당 3D 컴포넌트 포커스/상세 팝업
 * - 상태별 아이콘 표시 (정상/경고/위험)
 * - 검색/필터 기능
 */

function register(component) {
    const { fetchData, emit3DEvent } = WKit;
    const { applyShadowPopupMixin } = PopupMixin;

    // ======================
    // TEMPLATE HELPER
    // ======================
    function extractTemplate(htmlCode, templateId) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlCode, 'text/html');
        const template = doc.querySelector(`template#${templateId}`);
        return template?.innerHTML || '';
    }

    // ======================
    // DATA DEFINITION
    // ======================
    component.datasetInfo = [
        { datasetName: 'assetTree', param: {}, render: ['renderTree'] }
    ];

    // ======================
    // STATE
    // ======================
    component._treeData = null;
    component._expandedNodes = new Set(['root']);
    component._searchTerm = '';
    component._filterStatus = 'all';

    // ======================
    // ICON CONFIG
    // ======================
    component.typeIcons = {
        ups: '⚡',
        pdu: '🔌',
        crac: '❄️',
        sensor: '🌡️'
    };

    component.statusColors = {
        normal: '#22c55e',
        warning: '#f59e0b',
        critical: '#ef4444'
    };

    // ======================
    // RENDER FUNCTIONS
    // ======================
    component.renderTree = function(data) {
        component._treeData = data;
        component._updateTreeView();
    };

    component._updateTreeView = function() {
        const container = component.popupQuery('.tree-container');
        if (!container || !component._treeData) return;

        const { zones } = component._treeData;
        const html = component._buildTreeHTML(zones);
        container.innerHTML = html;
        component._bindTreeEvents(container);
    };

    component._buildTreeHTML = function(zones) {
        const searchTerm = component._searchTerm.toLowerCase();
        const filterStatus = component._filterStatus;

        let html = '<ul class="tree-root">';

        zones.forEach(zone => {
            const zoneId = `zone-${zone.id}`;
            const isExpanded = component._expandedNodes.has(zoneId);

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
                const isTypeExpanded = component._expandedNodes.has(typeId);
                const typeIcon = component.typeIcons[type] || '📦';

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
                    const statusColor = component.statusColors[asset.status] || '#888';
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
    };

    component._bindTreeEvents = function(container) {
        // 토글 클릭
        container.querySelectorAll('.node-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const header = e.target.closest('.node-header');
                const nodeId = header.dataset.nodeId;
                if (nodeId) {
                    component._toggleNode(nodeId);
                }
            });
        });

        // 자산 클릭
        container.querySelectorAll('.asset-node').forEach(node => {
            node.addEventListener('click', () => {
                const assetId = node.dataset.assetId;
                const assetType = node.dataset.assetType;
                component._onAssetClick(assetId, assetType);
            });
        });
    };

    component._toggleNode = function(nodeId) {
        if (component._expandedNodes.has(nodeId)) {
            component._expandedNodes.delete(nodeId);
        } else {
            component._expandedNodes.add(nodeId);
        }
        component._updateTreeView();
    };

    component._onAssetClick = function(assetId, assetType) {
        // 3D 컴포넌트로 이벤트 발송
        emit3DEvent(component.page, `@${assetType}Focus`, { assetId });

        // 선택 상태 표시
        component.popupQuery('.asset-node.selected')?.classList.remove('selected');
        component.popupQuery(`[data-asset-id="${assetId}"]`)?.classList.add('selected');
    };

    // ======================
    // SEARCH & FILTER
    // ======================
    component._onSearch = function(term) {
        component._searchTerm = term;
        component._updateTreeView();
    };

    component._onFilterChange = function(status) {
        component._filterStatus = status;
        component._updateTreeView();
    };

    component._expandAll = function() {
        if (!component._treeData) return;
        component._treeData.zones.forEach(zone => {
            component._expandedNodes.add(`zone-${zone.id}`);
            Object.keys(zone.assets).forEach(type => {
                component._expandedNodes.add(`zone-${zone.id}-${type}`);
            });
        });
        component._updateTreeView();
    };

    component._collapseAll = function() {
        component._expandedNodes.clear();
        component._expandedNodes.add('root');
        component._updateTreeView();
    };

    // ======================
    // PUBLIC METHODS
    // ======================
    component.showDetail = function() {
        component.showPopup();

        fx.go(
            component.datasetInfo,
            fx.each(({ datasetName, param, render }) =>
                fx.go(
                    fetchData(component.page, datasetName, param),
                    result => result?.response?.data,
                    data => data && render.forEach(fn => component[fn](data))
                )
            )
        ).catch(e => {
            console.error('[AssetTree]', e);
            component.hidePopup();
        });
    };

    component.hideDetail = function() {
        component.hidePopup();
    };

    component.refresh = function() {
        if (component._popupVisible) {
            component.showDetail();
        }
    };

    // ======================
    // TEMPLATE CONFIG
    // ======================
    component.templateConfig = {
        popup: 'popup-asset-tree'
    };

    component.popupCreatedConfig = {
        events: {
            click: {
                '.close-btn': () => component.hideDetail(),
                '.refresh-btn': () => component.refresh(),
                '.expand-all-btn': () => component._expandAll(),
                '.collapse-all-btn': () => component._collapseAll()
            },
            input: {
                '.search-input': (e) => component._onSearch(e.target.value)
            },
            change: {
                '.status-filter': (e) => component._onFilterChange(e.target.value)
            }
        }
    };

    // ======================
    // POPUP SETUP
    // ======================
    const { htmlCode, cssCode } = component.properties.publishCode || {};

    component.getPopupHTML = () => extractTemplate(htmlCode || '', component.templateConfig.popup);
    component.getPopupStyles = () => cssCode || '';
    component.onPopupCreated = function({ events }) {
        if (events) component.bindPopupEvents(events);
    }.bind(null, component.popupCreatedConfig);

    applyShadowPopupMixin(component, {
        getHTML: component.getPopupHTML,
        getStyles: component.getPopupStyles,
        onCreated: component.onPopupCreated
    });

    console.log('[AssetTree] Registered');
}
