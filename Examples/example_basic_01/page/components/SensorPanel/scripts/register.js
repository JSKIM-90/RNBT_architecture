/*
 * Page - SensorPanel Component - register
 * Subscribes to: sensors
 * Events: @sensorRefreshClicked
 */

const { subscribe } = GlobalDataPublisher;
const { bindEvents } = WKit;
const { each } = fx;

// ======================
// SUBSCRIPTIONS
// ======================

this.subscriptions = {
    sensors: ['renderSensors']
};

this.renderSensors = renderSensors.bind(this);

fx.go(
    Object.entries(this.subscriptions),
    each(([topic, fnList]) =>
        each(fn => this[fn] && subscribe(topic, this, this[fn]), fnList)
    )
);

// ======================
// EVENT BINDING
// ======================

this.customEvents = {
    click: {
        '.sensor-refresh-btn': '@sensorRefreshClicked'
    }
};

bindEvents(this, this.customEvents);

// ======================
// RENDER FUNCTIONS
// ======================

function renderSensors({ response }) {
    const { sensors } = response;
    console.log(`[SensorPanel] renderSensors: ${sensors?.length || 0} sensors`);

    if (!sensors) return;

    const template = this.element.querySelector('#sensor-card-template');
    const container = this.element.querySelector('.sensor-grid');

    if (!template || !container) return;

    container.innerHTML = '';

    const icons = {
        temperature: '🌡️',
        humidity: '💧',
        pressure: '📊',
        co2: '💨'
    };

    sensors.forEach(sensor => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.sensor-card');

        card.dataset.sensorId = sensor.id;
        card.dataset.sensorType = sensor.type;
        card.dataset.status = sensor.status;

        clone.querySelector('.sensor-icon').textContent = icons[sensor.type] || '📡';
        clone.querySelector('.sensor-zone').textContent = sensor.zone;
        clone.querySelector('.sensor-value').textContent = sensor.value;
        clone.querySelector('.sensor-unit').textContent = sensor.unit;
        clone.querySelector('.sensor-type-label').textContent = sensor.type;

        const statusEl = clone.querySelector('.sensor-status');
        statusEl.textContent = sensor.status;
        statusEl.classList.add(sensor.status);

        container.appendChild(clone);
    });
}
