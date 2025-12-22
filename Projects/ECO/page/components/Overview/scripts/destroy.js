/**
 * Overview Component Destroy
 */

function destroy(component) {
    component.destroyChart?.('.status-chart');
    component.destroyTable?.('.event-table');
    component.destroyPopup?.();
    console.log('[Overview] Destroyed');
}
