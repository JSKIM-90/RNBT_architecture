// Data Generators for IoT Monitoring Dashboard

// Helper: Random number in range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper: Random integer in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Random item from array
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sensor zones
const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];

// Device IDs (static list)
const DEVICE_IDS = {
  temperature: ['TEMP-001', 'TEMP-002', 'TEMP-003', 'TEMP-004'],
  humidity: ['HUM-001', 'HUM-002', 'HUM-003', 'HUM-004'],
  pressure: ['PRESS-001', 'PRESS-002', 'PRESS-003', 'PRESS-004'],
  co2: ['CO2-001', 'CO2-002', 'CO2-003', 'CO2-004']
};

// Store for generating trending data
let trendDataStore = {
  temperature: {},
  humidity: {},
  pressure: {},
  co2: {}
};

// Initialize trend data
function initializeTrendData() {
  Object.keys(DEVICE_IDS).forEach(type => {
    DEVICE_IDS[type].forEach(id => {
      trendDataStore[type][id] = {
        baseValue: getBaseValue(type),
        trend: 0
      };
    });
  });
}

function getBaseValue(type) {
  switch (type) {
    case 'temperature': return randomInRange(20, 25);
    case 'humidity': return randomInRange(50, 60);
    case 'pressure': return randomInRange(1010, 1020);
    case 'co2': return randomInRange(400, 600);
    default: return 0;
  }
}

function getUnit(type) {
  switch (type) {
    case 'temperature': return '°C';
    case 'humidity': return '%';
    case 'pressure': return 'hPa';
    case 'co2': return 'ppm';
    default: return '';
  }
}

function getThreshold(type) {
  switch (type) {
    case 'temperature': return { warning: 28, critical: 35 };
    case 'humidity': return { warning: 70, critical: 80 };
    case 'pressure': return { warning: 1030, critical: 1040 };
    case 'co2': return { warning: 800, critical: 1000 };
    default: return { warning: 0, critical: 0 };
  }
}

function getStatus(type, value) {
  const threshold = getThreshold(type);
  if (value >= threshold.critical) return 'critical';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
}

// Generate current sensor reading
function generateSensorReading(type, id, zoneIndex) {
  const stored = trendDataStore[type][id];

  // Add small random variation
  const variation = randomInRange(-1, 1);
  stored.trend = stored.trend * 0.7 + variation * 0.3; // Smooth trending

  let value = stored.baseValue + stored.trend + randomInRange(-0.5, 0.5);

  // Clamp values to reasonable ranges
  if (type === 'temperature') value = Math.max(15, Math.min(40, value));
  if (type === 'humidity') value = Math.max(30, Math.min(90, value));
  if (type === 'pressure') value = Math.max(990, Math.min(1050, value));
  if (type === 'co2') value = Math.max(350, Math.min(1200, value));

  return {
    id,
    zone: ZONES[zoneIndex],
    type,
    value: Math.round(value * 10) / 10,
    unit: getUnit(type),
    status: getStatus(type, value)
  };
}

// Generate all current sensors
function generateCurrentSensors() {
  const sensors = [];

  Object.keys(DEVICE_IDS).forEach(type => {
    DEVICE_IDS[type].forEach((id, index) => {
      sensors.push(generateSensorReading(type, id, index % ZONES.length));
    });
  });

  return {
    timestamp: new Date().toISOString(),
    sensors
  };
}

// Generate active alerts
function generateActiveAlerts() {
  const currentSensors = generateCurrentSensors().sensors;
  const alerts = [];

  currentSensors.forEach(sensor => {
    if (sensor.status === 'critical' || (sensor.status === 'warning' && Math.random() > 0.5)) {
      alerts.push({
        id: `ALERT-${Date.now()}-${randomInt(1000, 9999)}`,
        sensorId: sensor.id,
        zone: sensor.zone,
        type: sensor.status,
        message: `${sensor.type} ${sensor.status === 'critical' ? 'exceeded' : 'approaching'} threshold: ${sensor.value}${sensor.unit}`,
        timestamp: new Date(Date.now() - randomInt(0, 300000)).toISOString() // Within last 5 min
      });
    }
  });

  return { alerts };
}

// Generate device status
function generateDeviceStatus() {
  const devices = [];

  Object.keys(DEVICE_IDS).forEach(type => {
    DEVICE_IDS[type].forEach((id, index) => {
      const isOnline = Math.random() > 0.1; // 90% online
      devices.push({
        id,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${index + 1}`,
        type,
        zone: ZONES[index % ZONES.length],
        online: isOnline,
        battery: isOnline ? randomInt(20, 100) : 0,
        signalStrength: isOnline ? randomInt(-70, -30) : null,
        lastSeen: isOnline ? new Date().toISOString() : new Date(Date.now() - randomInt(300000, 3600000)).toISOString()
      });
    });
  });

  return { devices };
}

// Generate recent events
function generateRecentEvents() {
  const events = [];
  const eventTypes = ['sensor_reading', 'threshold_exceeded', 'device_online', 'device_offline', 'battery_low'];
  const count = randomInt(10, 20);

  for (let i = 0; i < count; i++) {
    const eventType = randomItem(eventTypes);
    const device = randomItem(Object.values(DEVICE_IDS).flat());

    events.push({
      id: `EVENT-${Date.now()}-${randomInt(1000, 9999)}`,
      type: eventType,
      deviceId: device,
      message: generateEventMessage(eventType, device),
      timestamp: new Date(Date.now() - randomInt(0, 1800000)).toISOString() // Within last 30 min
    });
  }

  return { events: events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) };
}

function generateEventMessage(type, deviceId) {
  switch (type) {
    case 'sensor_reading': return `${deviceId} sent new reading`;
    case 'threshold_exceeded': return `${deviceId} exceeded threshold`;
    case 'device_online': return `${deviceId} came online`;
    case 'device_offline': return `${deviceId} went offline`;
    case 'battery_low': return `${deviceId} battery below 20%`;
    default: return `${deviceId} event`;
  }
}

// Generate 24h trend data
function generateTrend24h() {
  const trends = {};
  const hours = 24;

  Object.keys(DEVICE_IDS).forEach(type => {
    trends[type] = [];

    DEVICE_IDS[type].forEach(id => {
      const dataPoints = [];
      let baseValue = getBaseValue(type);

      for (let i = 0; i < hours; i++) {
        baseValue += randomInRange(-2, 2);
        dataPoints.push({
          timestamp: new Date(Date.now() - (hours - i) * 3600000).toISOString(),
          value: Math.round(baseValue * 10) / 10
        });
      }

      trends[type].push({
        deviceId: id,
        data: dataPoints
      });
    });
  });

  return { trends };
}

// Generate zone statistics
function generateZoneStatistics() {
  const statistics = [];

  ZONES.forEach(zone => {
    const zoneStats = {
      zone,
      sensors: {}
    };

    Object.keys(DEVICE_IDS).forEach(type => {
      const values = DEVICE_IDS[type]
        .filter((_, index) => ZONES[index % ZONES.length] === zone)
        .map(() => randomInRange(getBaseValue(type) - 5, getBaseValue(type) + 5));

      zoneStats.sensors[type] = {
        average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
        min: Math.round(Math.min(...values) * 10) / 10,
        max: Math.round(Math.max(...values) * 10) / 10,
        unit: getUnit(type)
      };
    });

    statistics.push(zoneStats);
  });

  return { statistics };
}

// Generate static device list
function generateDeviceList() {
  const devices = [];

  Object.keys(DEVICE_IDS).forEach(type => {
    DEVICE_IDS[type].forEach((id, index) => {
      devices.push({
        id,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sensor ${index + 1}`,
        type,
        zone: ZONES[index % ZONES.length],
        model: `${type.toUpperCase()}-X${randomInt(100, 999)}`,
        installedDate: new Date(2024, randomInt(0, 11), randomInt(1, 28)).toISOString(),
        status: 'active'
      });
    });
  });

  return { devices };
}

// Generate threshold settings
function generateThresholdSettings() {
  const thresholds = {};

  Object.keys(DEVICE_IDS).forEach(type => {
    const threshold = getThreshold(type);
    thresholds[type] = {
      warning: threshold.warning,
      critical: threshold.critical,
      unit: getUnit(type)
    };
  });

  return { thresholds };
}

// Initialize on load
initializeTrendData();

module.exports = {
  generateCurrentSensors,
  generateActiveAlerts,
  generateDeviceStatus,
  generateRecentEvents,
  generateTrend24h,
  generateZoneStatistics,
  generateDeviceList,
  generateThresholdSettings
};
