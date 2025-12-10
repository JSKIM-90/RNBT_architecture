/*
 * TemperatureSensor - register.js
 *
 * Topic: temperatureSensors
 * Event: @sensorClicked (sensorId)
 */

const { bindEvents } = WKit;
const { subscribe } = GlobalDataPublisher;

initComponent.call(this);

function initComponent() {
    // Event binding schema
    this.customEvents = {
        click: {
            '.sensor-card': '@sensorClicked'
        }
    };

    // Subscription schema
    this.subscriptions = {
        temperatureSensors: ['renderSensors']
    };

    // Bind methods
    this.renderSensors = renderSensors.bind(this);

    // Setup
    bindEvents(this, this.customEvents);

    fx.go(
        Object.entries(this.subscriptions),
        fx.each(([topic, fnList]) =>
            fx.each(fn => subscribe(topic, this, this[fn]), fnList)
        )
    );

    console.log('[TemperatureSensor] Registered');
}

function renderSensors(response) {
    const { data } = response;
    if (!data) return;

    const { sensors, summary } = data;

    // Update summary counts
    updateSummary.call(this, summary);

    // Render sensor cards
    const grid = this.element.querySelector('.sensor-grid');
    const template = this.element.querySelector('#sensor-card-template');

    grid.innerHTML = '';

    fx.go(
        sensors,
        fx.each(sensor => {
            const card = template.content.cloneNode(true);
            const cardEl = card.querySelector('.sensor-card');

            // Set data attributes
            cardEl.dataset.sensorId = sensor.id;
            cardEl.dataset.status = sensor.status;

            // Fill content
            card.querySelector('.sensor-name').textContent = sensor.name;
            card.querySelector('.sensor-zone').textContent = sensor.zone;
            card.querySelector('.temp-value').textContent = sensor.temperature.toFixed(1);
            card.querySelector('.temp-unit').textContent = '\u00B0C';
            card.querySelector('.humidity-value').textContent = `${sensor.humidity}%`;

            const badge = card.querySelector('.status-badge');
            badge.textContent = sensor.status;
            badge.dataset.status = sensor.status;

            card.querySelector('.last-updated').textContent = formatTime(sensor.lastUpdated);

            grid.appendChild(card);
        })
    );

    console.log('[TemperatureSensor] Rendered', sensors.length, 'sensors');
}

function updateSummary(summary) {
    if (!summary) return;

    this.element.querySelector('.count-normal').textContent = summary.normal;
    this.element.querySelector('.count-warning').textContent = summary.warning;
    this.element.querySelector('.count-critical').textContent = summary.critical;
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
