const express = require('express');
const cors = require('cors');
const {
  generateCardInfo,
  generateAlerts,
  generateSummary,
  generateTransactions,
  generateSpending
} = require('./dataGenerators');

const app = express();
const PORT = process.env.PORT || 3002;

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
// MASTER ENDPOINTS
// ======================

// GET /api/card/info - Card information (static, 1회)
app.get('/api/card/info', (req, res) => {
  try {
    const data = generateCardInfo();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate card info' });
  }
});

// GET /api/card/alerts - Card alerts (10s interval)
app.get('/api/card/alerts', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const data = generateAlerts(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate alerts' });
  }
});

// ======================
// PAGE ENDPOINTS
// ======================

// GET /api/card/summary - Usage summary (30s interval)
app.get('/api/card/summary', (req, res) => {
  try {
    const data = generateSummary();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// GET /api/card/transactions - Transaction list (30s interval)
app.get('/api/card/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = generateTransactions(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate transactions' });
  }
});

// GET /api/card/spending - Spending analysis (60s interval)
app.get('/api/card/spending', (req, res) => {
  try {
    const data = generateSpending();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate spending data' });
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
    message: 'Card Company Dashboard API Server',
    version: '1.0.0',
    endpoints: {
      master: {
        'GET /api/card/info': 'Card information (static)',
        'GET /api/card/alerts?limit=5': 'Card alerts (refresh: 10s)'
      },
      page: {
        'GET /api/card/summary': 'Usage summary (refresh: 30s)',
        'GET /api/card/transactions?limit=20': 'Transaction list (refresh: 30s)',
        'GET /api/card/spending': 'Spending analysis (refresh: 60s)'
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
  console.log('Card Company Dashboard API Server');
  console.log('='.repeat(60));
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log('  Master (Header, Sidebar):');
  console.log(`    - GET http://localhost:${PORT}/api/card/info`);
  console.log(`    - GET http://localhost:${PORT}/api/card/alerts?limit=5`);
  console.log('  Page (SummaryPanel, TransactionTable, SpendingChart):');
  console.log(`    - GET http://localhost:${PORT}/api/card/summary`);
  console.log(`    - GET http://localhost:${PORT}/api/card/transactions?limit=20`);
  console.log(`    - GET http://localhost:${PORT}/api/card/spending`);
  console.log('='.repeat(60));
});
