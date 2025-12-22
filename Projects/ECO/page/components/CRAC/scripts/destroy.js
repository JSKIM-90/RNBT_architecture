/**
 * CRAC - Destroy Script
 */

function destroy(component) {
    if (component.destroyPopup) {
        component.destroyPopup();
    }
    console.log('[CRAC] Destroyed:', component.setter?.ecoAssetInfo?.assetId);
}
