const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// ======================
// MOCK DATA GENERATORS
// ======================

const zones = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];
const rackNames = ['Rack', 'Server', 'Storage', 'Network'];

function generateSensorId(index) {
    return `sensor-${String(index + 1).padStart(3, '0')}`;
}

function generateSensorName(index) {
    const rackType = rackNames[index % rackNames.length];
    const rackNum = Math.floor(index / rackNames.length) + 1;
    const unit = (index % 4) + 1;
    return `${rackType} ${String.fromCharCode(65 + Math.floor(index / 4))}-${String(unit).padStart(2, '0')}`;
}

function generateTemperature() {
    // Base temp 22-26, with random spikes
    const base = 22 + Math.random() * 4;
    const spike = Math.random() > 0.85 ? Math.random() * 15 : 0;
    return Math.round((base + spike) * 10) / 10;
}

function getStatus(temp, threshold) {
    if (temp >= threshold.critical) return 'critical';
    if (temp >= threshold.warning) return 'warning';
    return 'normal';
}

function generateSensors(count = 12) {
    const sensors = [];
    const summary = { total: count, normal: 0, warning: 0, critical: 0, avgTemperature: 0 };
    let totalTemp = 0;

    for (let i = 0; i < count; i++) {
        const threshold = {
            warning: 28 + Math.floor(i / 4) * 2,
            critical: 35 + Math.floor(i / 4) * 2
        };
        const temperature = generateTemperature();
        const status = getStatus(temperature, threshold);
        const humidity = 40 + Math.floor(Math.random() * 20);

        sensors.push({
            id: generateSensorId(i),
            name: generateSensorName(i),
            zone: zones[i % zones.length],
            temperature,
            humidity,
            status,
            threshold,
            lastUpdated: new Date().toISOString()
        });

        summary[status]++;
        totalTemp += temperature;
    }

    summary.avgTemperature = Math.round((totalTemp / count) * 10) / 10;

    return { sensors, summary };
}

function generateHistory(sensorId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = period === '24h' ? 60 : period === '7d' ? 60 : 60; // minutes

    const timestamps = [];
    const temperatures = [];
    const thresholds = { warning: 28, critical: 35 };

    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * interval * 60000);
        timestamps.push(time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));

        // Generate temperature with some pattern
        const baseTemp = 23 + Math.sin(i / 6) * 2;
        const noise = (Math.random() - 0.5) * 3;
        temperatures.push(Math.round((baseTemp + noise) * 10) / 10);
    }

    // Generate some alerts
    const alerts = [];
    const alertCount = Math.floor(Math.random() * 4);
    for (let i = 0; i < alertCount; i++) {
        const hoursAgo = Math.floor(Math.random() * 24);
        const alertTime = new Date(now.getTime() - hoursAgo * 3600000);
        const severity = Math.random() > 0.6 ? 'critical' : 'warning';
        const temp = severity === 'critical' ? 35 + Math.random() * 5 : 28 + Math.random() * 7;

        alerts.push({
            id: `alert-${i + 1}`,
            severity,
            message: `Temperature reached ${temp.toFixed(1)}\u00B0C (${severity})`,
            timestamp: alertTime.toISOString()
        });
    }

    // Sort alerts by time (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
        sensorId,
        period,
        timestamps,
        temperatures,
        thresholds,
        alerts
    };
}

// ======================
// API ENDPOINTS
// ======================

// GET /api/sensors - All sensors with summary
app.get('/api/sensors', (req, res) => {
    const data = generateSensors(12);
    console.log(`[${new Date().toISOString()}] GET /api/sensors - ${data.sensors.length} sensors`);
    res.json({ data });
});

// GET /api/sensors/:id - Single sensor detail
app.get('/api/sensors/:id', (req, res) => {
    const { id } = req.params;
    const { sensors } = generateSensors(12);
    const sensor = sensors.find(s => s.id === id);

    if (!sensor) {
        return res.status(404).json({ error: 'Sensor not found' });
    }

    console.log(`[${new Date().toISOString()}] GET /api/sensors/${id}`);
    res.json({ data: sensor });
});

// GET /api/sensors/:id/history - Sensor history with chart data
app.get('/api/sensors/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const { sensors } = generateSensors(12);
    const sensor = sensors.find(s => s.id === id);

    if (!sensor) {
        return res.status(404).json({ error: 'Sensor not found' });
    }

    const history = generateHistory(id, period);

    console.log(`[${new Date().toISOString()}] GET /api/sensors/${id}/history?period=${period}`);
    res.json({
        data: {
            sensor,
            history
        }
    });
});

// ======================
// SERVER START
// ======================

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  IPSILON Mock Server`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/sensors          - All sensors`);
    console.log(`  GET /api/sensors/:id      - Single sensor`);
    console.log(`  GET /api/sensors/:id/history?period=24h|7d|30d`);
    console.log(`\n`);
});
