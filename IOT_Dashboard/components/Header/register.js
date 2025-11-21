const { subscribe } = GlobalDataPublisher;
const { each } = fx;

// ======================
// SUBSCRIPTION
// ======================

// Define topics this component subscribes to
this.subscriptions = {
    deviceStatus: ['renderSystemStatus']
};

// Bind handler methods to this instance
this.renderSystemStatus = renderSystemStatus.bind(this);

// Subscribe to topics
fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// HANDLER FUNCTIONS
// ======================

function renderSystemStatus(data) {
    console.log(`[Header] Device status updated:`, data);

    if (!data || !Array.isArray(data)) {
        console.warn('[Header] Invalid device status data');
        return;
    }

    // Calculate online/offline counts
    const onlineDevices = data.filter(device => device.status === 'online').length;
    const offlineDevices = data.filter(device => device.status === 'offline').length;
    const totalDevices = data.length;

    // Get template and container
    const template = this.element.querySelector('#status-template');
    const container = this.element.querySelector('[data-status-container]');

    if (!template || !container) {
        console.warn('[Header] Template or container not found');
        return;
    }

    // Clone template
    const clone = template.content.cloneNode(true);

    // Update data-attributes and text content
    const totalSpan = clone.querySelector('[data-status-type="total"]');
    const onlineSpan = clone.querySelector('[data-status-type="online"]');
    const offlineSpan = clone.querySelector('[data-status-type="offline"]');

    if (totalSpan) {
        totalSpan.textContent = `Total: ${totalDevices}`;
        totalSpan.dataset.deviceCount = totalDevices;
    }

    if (onlineSpan) {
        onlineSpan.textContent = `Online: ${onlineDevices}`;
        onlineSpan.dataset.deviceCount = onlineDevices;
    }

    if (offlineSpan) {
        offlineSpan.textContent = `Offline: ${offlineDevices}`;
        offlineSpan.dataset.deviceCount = offlineDevices;
    }

    // Clear and append
    container.innerHTML = '';
    container.appendChild(clone);
}
