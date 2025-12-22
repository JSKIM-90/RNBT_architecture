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
this._updateTreeView = null;
this._buildTree = null;
this._createZoneNode = null;
this._createTypeNode = null;
this._createAssetNode = null;
this._templates = null;

// Public API
this.search = null;
this.filter = null;
this.expandAll = null;
this.collapseAll = null;
this.toggleNode = null;
this.selectAsset = null;

// Config
this.typeIcons = null;
this.statusColors = null;

console.log('[AssetTree] destroy - cleanup completed');
