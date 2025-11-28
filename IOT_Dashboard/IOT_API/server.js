const express = require('express');
const cors = require('cors');
const {
  generateCurrentSensors,
  generateActiveAlerts,
  generateDeviceStatus,
  generateRecentEvents,
  generateTrend24h,
  generateZoneStatistics,
  generateDeviceList,
  generateThresholdSettings
} = require('./dataGenerators');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ======================
// REALTIME ENDPOINTS (3-5초 갱신)
// ======================

// GET /api/iot/realtime/sensors/current
app.get('/api/iot/realtime/sensors/current', (req, res) => {
  try {
    const data = generateCurrentSensors();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate sensor data' });
  }
});

// GET /api/iot/realtime/alerts/active
app.get('/api/iot/realtime/alerts/active', (req, res) => {
  try {
    const data = generateActiveAlerts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate alert data' });
  }
});

// ======================
// SHORTTERM ENDPOINTS (10-15초 갱신)
// ======================

// GET /api/iot/shortterm/devices/status
app.get('/api/iot/shortterm/devices/status', (req, res) => {
  try {
    const data = generateDeviceStatus();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate device status' });
  }
});

// GET /api/iot/shortterm/events/recent
app.get('/api/iot/shortterm/events/recent', (req, res) => {
  try {
    const data = generateRecentEvents();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate recent events' });
  }
});

// ======================
// MIDTERM ENDPOINTS (30-60초 갱신)
// ======================

// GET /api/iot/midterm/sensors/trend/24h
app.get('/api/iot/midterm/sensors/trend/24h', (req, res) => {
  try {
    const data = generateTrend24h();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate trend data' });
  }
});

// GET /api/iot/midterm/zones/statistics
app.get('/api/iot/midterm/zones/statistics', (req, res) => {
  try {
    const data = generateZoneStatistics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate zone statistics' });
  }
});

// ======================
// STATIC ENDPOINTS (초기 로드만)
// ======================

// GET /api/iot/static/devices/list
app.get('/api/iot/static/devices/list', (req, res) => {
  try {
    const data = generateDeviceList();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate device list' });
  }
});

// GET /api/iot/static/settings/thresholds
app.get('/api/iot/static/settings/thresholds', (req, res) => {
  try {
    const data = generateThresholdSettings();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate threshold settings' });
  }
});

// ======================
// HEALTH CHECK
// ======================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ======================
// ROOT ENDPOINT
// ======================

app.get('/', (req, res) => {
  res.json({
    message: 'IoT Monitoring Dashboard API Server',
    version: '1.0.0',
    endpoints: {
      realtime: {
        'GET /api/iot/realtime/sensors/current': 'Current sensor readings (refresh: 3-5s)',
        'GET /api/iot/realtime/alerts/active': 'Active alerts (refresh: 3-5s)'
      },
      shortterm: {
        'GET /api/iot/shortterm/devices/status': 'Device status (refresh: 10-15s)',
        'GET /api/iot/shortterm/events/recent': 'Recent events (refresh: 10-15s)'
      },
      midterm: {
        'GET /api/iot/midterm/sensors/trend/24h': '24-hour trend data (refresh: 30-60s)',
        'GET /api/iot/midterm/zones/statistics': 'Zone statistics (refresh: 30-60s)'
      },
      static: {
        'GET /api/iot/static/devices/list': 'Device list (static)',
        'GET /api/iot/static/settings/thresholds': 'Threshold settings (static)'
      }
    }
  });
});

// ======================
// ERROR HANDLER
// ======================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('IoT Monitoring Dashboard API Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log('  Realtime (3-5s):');
  console.log(`    - GET http://localhost:${PORT}/api/iot/realtime/sensors/current`);
  console.log(`    - GET http://localhost:${PORT}/api/iot/realtime/alerts/active`);
  console.log('  Shortterm (10-15s):');
  console.log(`    - GET http://localhost:${PORT}/api/iot/shortterm/devices/status`);
  console.log(`    - GET http://localhost:${PORT}/api/iot/shortterm/events/recent`);
  console.log('  Midterm (30-60s):');
  console.log(`    - GET http://localhost:${PORT}/api/iot/midterm/sensors/trend/24h`);
  console.log(`    - GET http://localhost:${PORT}/api/iot/midterm/zones/statistics`);
  console.log('  Static:');
  console.log(`    - GET http://localhost:${PORT}/api/iot/static/devices/list`);
  console.log(`    - GET http://localhost:${PORT}/api/iot/static/settings/thresholds`);
  console.log('='.repeat(60));
});
