const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// ======================
// MOCK DATA GENERATORS
// ======================

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

function generateSensor(id) {
    const threshold = {
        warning: 28,
        critical: 35
    };
    const temperature = generateTemperature();
    const status = getStatus(temperature, threshold);
    const humidity = 40 + Math.floor(Math.random() * 20);

    return {
        id,
        name: `Sensor ${id}`,
        zone: `Zone-${String.fromCharCode(65 + (parseInt(id.split('-')[1] || '0') % 4))}`,
        temperature,
        humidity,
        status,
        threshold,
        lastUpdated: new Date().toISOString()
    };
}

function generateHistory(sensorId, period = '24h') {
    const now = new Date();
    const points = period === '24h' ? 24 : period === '7d' ? 168 : 720;
    const interval = 60; // minutes

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

    return {
        sensorId,
        period,
        timestamps,
        temperatures,
        thresholds
    };
}

function generateAlerts(sensorId) {
    const now = new Date();
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
        alerts
    };
}

// ======================
// API ENDPOINTS
// ======================

// GET /api/sensor/:id - 센서 현재 상태
app.get('/api/sensor/:id', (req, res) => {
    const { id } = req.params;
    const sensor = generateSensor(id);

    console.log(`[${new Date().toISOString()}] GET /api/sensor/${id}`);
    res.json({ data: sensor });
});

// GET /api/sensor/:id/history - 온도 히스토리
app.get('/api/sensor/:id/history', (req, res) => {
    const { id } = req.params;
    const { period = '24h' } = req.query;

    const history = generateHistory(id, period);

    console.log(`[${new Date().toISOString()}] GET /api/sensor/${id}/history?period=${period}`);
    res.json({ data: history });
});

// GET /api/sensor/:id/alerts - 알림 목록
app.get('/api/sensor/:id/alerts', (req, res) => {
    const { id } = req.params;

    const alerts = generateAlerts(id);

    console.log(`[${new Date().toISOString()}] GET /api/sensor/${id}/alerts`);
    res.json({ data: alerts });
});

// ======================
// SERVER START
// ======================

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  IPSILON_3D Mock Server`);
    console.log(`  Running on http://localhost:${PORT}`);
    console.log(`========================================`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET /api/sensor/:id          - Sensor current status`);
    console.log(`  GET /api/sensor/:id/history  - Temperature history`);
    console.log(`  GET /api/sensor/:id/alerts   - Alert list`);
    console.log(`\n`);
});
