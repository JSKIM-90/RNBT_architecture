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
// ASSET DATA
// ======================

const ASSET_TYPES = ['sensor', 'server', 'rack', 'cooling', 'power', 'network'];
const ZONES = ['Zone-A', 'Zone-B', 'Zone-C', 'Zone-D'];

// 고정된 자산 목록 (실제로는 DB에서 관리)
const ASSETS = [
    // Sensors (12개)
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `sensor-${String(i + 1).padStart(3, '0')}`,
        type: 'sensor',
        name: `Temperature Sensor ${String.fromCharCode(65 + Math.floor(i / 3))}-${(i % 3) + 1}`,
        zone: ZONES[i % 4],
        status: ['normal', 'normal', 'normal', 'warning', 'critical'][Math.floor(Math.random() * 5)]
    })),
    // Servers (8개)
    ...Array.from({ length: 8 }, (_, i) => ({
        id: `server-${String(i + 1).padStart(3, '0')}`,
        type: 'server',
        name: `Server ${String.fromCharCode(65 + Math.floor(i / 2))}-${(i % 2) + 1}`,
        zone: ZONES[i % 4],
        status: ['normal', 'normal', 'warning'][Math.floor(Math.random() * 3)]
    })),
    // Racks (4개)
    ...Array.from({ length: 4 }, (_, i) => ({
        id: `rack-${String(i + 1).padStart(3, '0')}`,
        type: 'rack',
        name: `Rack ${String.fromCharCode(65 + i)}`,
        zone: ZONES[i],
        status: 'normal'
    })),
    // Cooling (2개)
    ...Array.from({ length: 2 }, (_, i) => ({
        id: `cooling-${String(i + 1).padStart(3, '0')}`,
        type: 'cooling',
        name: `CRAC Unit ${i + 1}`,
        zone: ZONES[i * 2],
        status: 'normal'
    })),
    // Power (2개)
    ...Array.from({ length: 2 }, (_, i) => ({
        id: `power-${String(i + 1).padStart(3, '0')}`,
        type: 'power',
        name: `PDU ${String.fromCharCode(65 + i)}`,
        zone: ZONES[i * 2],
        status: 'normal'
    })),
    // Network (2개)
    ...Array.from({ length: 2 }, (_, i) => ({
        id: `network-${String(i + 1).padStart(3, '0')}`,
        type: 'network',
        name: `Switch ${String.fromCharCode(65 + i)}`,
        zone: ZONES[i * 2],
        status: 'normal'
    }))
];

function generateAssetsSummary(assets) {
    const byType = {};
    const byStatus = { normal: 0, warning: 0, critical: 0 };

    assets.forEach(asset => {
        byType[asset.type] = (byType[asset.type] || 0) + 1;
        byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
    });

    return {
        total: assets.length,
        byType,
        byStatus
    };
}

// ======================
// API ENDPOINTS
// ======================

// GET /api/assets/summary - Summary만 반환 (전체 자산 기준)
app.get('/api/assets/summary', (req, res) => {
    const summary = generateAssetsSummary(ASSETS);

    console.log(`[${new Date().toISOString()}] GET /api/assets/summary`);
    res.json({
        data: {
            summary
        }
    });
});

// GET /api/assets - 전체 자산 조회 (타입별 필터 지원)
app.get('/api/assets', (req, res) => {
    const { type } = req.query;

    let filteredAssets = ASSETS;

    // 타입 필터
    if (type) {
        const types = type.split(',');
        filteredAssets = ASSETS.filter(asset => types.includes(asset.type));
    }

    const summary = generateAssetsSummary(filteredAssets);

    console.log(`[${new Date().toISOString()}] GET /api/assets${type ? `?type=${type}` : ''} - ${filteredAssets.length} assets`);
    res.json({
        data: {
            assets: filteredAssets,
            summary
        }
    });
});

// GET /api/asset/:id - 개별 자산 조회 (유효성 검증용)
app.get('/api/asset/:id', (req, res) => {
    const { id } = req.params;
    const asset = ASSETS.find(a => a.id === id);

    console.log(`[${new Date().toISOString()}] GET /api/asset/${id} - ${asset ? 'found' : 'not found'}`);

    if (!asset) {
        return res.status(404).json({
            error: 'Asset not found',
            id: id
        });
    }

    res.json({ data: asset });
});

// POST /api/assets/validate - 배치 자산 유효성 검증
app.post('/api/assets/validate', (req, res) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({
            error: 'ids array is required'
        });
    }

    const validIds = [];
    const invalidIds = [];

    ids.forEach(id => {
        const asset = ASSETS.find(a => a.id === id);
        if (asset) {
            validIds.push(id);
        } else {
            invalidIds.push(id);
        }
    });

    console.log(`[${new Date().toISOString()}] POST /api/assets/validate - ${ids.length} ids, ${validIds.length} valid, ${invalidIds.length} invalid`);

    res.json({
        data: {
            validIds,
            invalidIds
        }
    });
});

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
    console.log(`  GET /api/assets/summary      - Summary only (no assets)`);
    console.log(`  GET /api/assets              - All assets (with summary)`);
    console.log(`  GET /api/assets?type=sensor  - Filter by type`);
    console.log(`  GET /api/asset/:id           - Single asset by ID (404 if not found)`);
    console.log(`  POST /api/assets/validate    - Batch validate asset IDs`);
    console.log(`  GET /api/sensor/:id          - Sensor current status`);
    console.log(`  GET /api/sensor/:id/history  - Temperature history`);
    console.log(`  GET /api/sensor/:id/alerts   - Alert list`);
    console.log(`\n`);
});
