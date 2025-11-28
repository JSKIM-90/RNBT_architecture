const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// MOCK DATA GENERATORS
// ===========================

// User info (for Header)
function generateUserInfo() {
  return {
    id: 'USER-001',
    name: 'Kim Developer',
    email: 'kim@example.com',
    role: 'Admin',
    avatar: 'https://ui-avatars.com/api/?name=Kim+Dev&background=4f46e5&color=fff'
  };
}

// Notifications (for Sidebar)
function generateNotifications(limit = 5) {
  const types = ['info', 'warning', 'success'];
  const messages = [
    'New user registered',
    'System update available',
    'Task completed',
    'Report generated',
    'Backup finished'
  ];

  const items = Array.from({ length: limit }, (_, i) => ({
    id: `NOTIF-${i + 1}`,
    type: types[i % types.length],
    message: messages[i % messages.length],
    time: new Date(Date.now() - i * 600000).toISOString(),
    read: Math.random() > 0.5
  }));

  return {
    items,
    unreadCount: items.filter(n => !n.read).length
  };
}

// Stats (for Page - StatsPanel)
function generateStats(period = '24h') {
  return {
    period,
    timestamp: new Date().toISOString(),
    visitors: Math.floor(Math.random() * 1000) + 500,
    pageViews: Math.floor(Math.random() * 5000) + 2000,
    sessions: Math.floor(Math.random() * 800) + 300,
    bounceRate: (Math.random() * 30 + 20).toFixed(1)
  };
}

// Menu (for Header navigation)
function generateMenu() {
  return [
    { id: 'menu-home', label: 'Home', icon: '🏠', href: '#home', active: true },
    { id: 'menu-dashboard', label: 'Dashboard', icon: '📊', href: '#dashboard', active: false },
    { id: 'menu-reports', label: 'Reports', icon: '📈', href: '#reports', active: false },
    { id: 'menu-settings', label: 'Settings', icon: '⚙️', href: '#settings', active: false }
  ];
}

// ===========================
// API ENDPOINTS
// ===========================

// Master - Header: User info
app.get('/api/user', (req, res) => {
  res.json({
    success: true,
    data: generateUserInfo()
  });
});

// Master - Sidebar: Notifications
app.get('/api/notifications', (req, res) => {
  const { limit = 5 } = req.query;
  res.json({
    success: true,
    ...generateNotifications(parseInt(limit))
  });
});

// Page - StatsPanel: Statistics
app.get('/api/stats', (req, res) => {
  const { period = '24h' } = req.query;
  res.json({
    success: true,
    data: generateStats(period)
  });
});

// Master - Header: Navigation menu
app.get('/api/menu', (req, res) => {
  res.json({
    success: true,
    items: generateMenu()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ===========================
// START SERVER
// ===========================

function getNetworkIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

app.listen(PORT, HOST, () => {
  const ips = getNetworkIPs();
  console.log(`
╔════════════════════════════════════════════╗
║   Master Example Mock Server               ║
║   Port: ${PORT}                                 ║
╚════════════════════════════════════════════╝

Endpoints:
  GET /api/user              - User info (Master/Header)
  GET /api/menu              - Navigation menu (Master/Header)
  GET /api/notifications     - Notifications (Master/Sidebar)
  GET /api/stats?period=24h  - Stats (Page/StatsPanel)

URLs:
  Local:   http://localhost:${PORT}
  ${ips.map(ip => `Network: http://${ip}:${PORT}`).join('\n  ')}
  `);
});
