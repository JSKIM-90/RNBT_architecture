/*
 * ServerMonitor - destroy lifecycle
 *
 * 컴포넌트 제거 시 리소스 정리
 */

if (this.hidePopup) {
    this.hidePopup();
}

if (this.destroyTable) {
    this.destroyTable();
}

if (this.destroyChart) {
    this.destroyChart();
}

console.log('[ServerMonitor] Destroyed:', this.setter?.ipsilonAssetInfo?.assetId);
