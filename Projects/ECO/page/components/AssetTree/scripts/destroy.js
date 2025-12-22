/**
 * AssetTree Component Destroy
 */

function destroy(component) {
    component._treeData = null;
    component._expandedNodes = null;
    component.destroyPopup?.();
    console.log('[AssetTree] Destroyed');
}
