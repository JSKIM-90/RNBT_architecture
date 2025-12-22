/**
 * TempHumiditySensor - Destroy Script
 */

function destroy(component) {
    if (component.destroyPopup) {
        component.destroyPopup();
    }
    console.log('[TempHumiditySensor] Destroyed:', component.setter?.ecoAssetInfo?.assetId);
}
