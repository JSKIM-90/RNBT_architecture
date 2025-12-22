/*
 * Page - AssetTree Component - destroy
 * 자산 트리 네비게이션 컴포넌트
 */

const { unsubscribe } = GlobalDataPublisher;
const { removeCustomEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTION CLEANUP
// ======================

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

// ======================
// EVENT CLEANUP
// ======================

removeCustomEvents(this, this.customEvents);
this.customEvents = null;

// ======================
// STATE CLEANUP
// ======================

this._treeData = null;
this._expandedNodes = null;
this._searchTerm = null;
this._filterStatus = null;

// ======================
// HANDLER CLEANUP
// ======================

this.renderTree = null;
this._onSearch = null;
this._onFilterChange = null;
this._expandAll = null;
this._collapseAll = null;
this._toggleNode = null;
this._onAssetClick = null;
this._updateTreeView = null;
this._buildTreeHTML = null;
this._bindTreeEvents = null;
this.typeIcons = null;
this.statusColors = null;

console.log('[AssetTree] destroy - cleanup completed');
