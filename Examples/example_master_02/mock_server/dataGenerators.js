/**
 * Card Company Dashboard - Mock Data Generators
 */

// ======================
// HELPER FUNCTIONS
// ======================

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTimestamp(minutesAgo = 0) {
  return new Date(Date.now() - minutesAgo * 60000).toISOString();
}

// ======================
// MASTER - Card Info (Header)
// ======================

function generateCardInfo() {
  return {
    data: {
      cardNumber: '**** **** **** 4582',
      cardType: 'Platinum',
      cardHolder: 'John Smith',
      expiryDate: '12/27',
      status: 'active'
    }
  };
}

// ======================
// MASTER - Alerts (Sidebar)
// ======================

const alertTypes = [
  { type: 'payment', message: 'Payment due in 3 days', icon: '💳' },
  { type: 'security', message: 'New login from iPhone', icon: '🔐' },
  { type: 'reward', message: 'You earned 500 bonus points', icon: '🎁' },
  { type: 'limit', message: 'Approaching 80% of credit limit', icon: '⚠️' },
  { type: 'transaction', message: 'Large transaction detected', icon: '📊' },
  { type: 'promo', message: 'New cashback offer available', icon: '🏷️' }
];

function generateAlerts(limit = 5) {
  const alerts = [];
  const count = Math.min(limit, randomInt(2, 6));

  for (let i = 0; i < count; i++) {
    const alertType = randomItem(alertTypes);
    alerts.push({
      id: `alert-${Date.now()}-${i}`,
      type: alertType.type,
      message: alertType.message,
      icon: alertType.icon,
      timestamp: generateTimestamp(randomInt(1, 120)),
      read: Math.random() > 0.7
    });
  }

  return { data: alerts };
}

// ======================
// PAGE - Summary (SummaryPanel)
// ======================

function generateSummary() {
  const balance = randomFloat(8000, 15000);
  const spending = randomFloat(2000, 5000);
  const rewards = randomInt(15000, 35000);
  const limit = 25000;

  return {
    data: {
      balance: {
        value: balance,
        trend: randomFloat(-5, 10)
      },
      spending: {
        value: spending,
        trend: randomFloat(-20, 5)
      },
      rewards: {
        value: rewards,
        trend: randomFloat(0, 15)
      },
      limit: {
        value: limit,
        trend: 0
      }
    }
  };
}

// ======================
// PAGE - Transactions (TransactionTable)
// ======================

const merchants = [
  { name: 'Amazon.com', category: 'shopping' },
  { name: 'Starbucks', category: 'food' },
  { name: 'Uber', category: 'transport' },
  { name: 'Netflix', category: 'entertainment' },
  { name: 'Apple Store', category: 'shopping' },
  { name: 'Whole Foods', category: 'food' },
  { name: 'Shell Gas', category: 'transport' },
  { name: 'Target', category: 'shopping' },
  { name: 'Spotify', category: 'entertainment' },
  { name: 'Costco', category: 'shopping' },
  { name: 'McDonald\'s', category: 'food' },
  { name: 'Lyft', category: 'transport' },
  { name: 'Best Buy', category: 'shopping' },
  { name: 'Chipotle', category: 'food' },
  { name: 'Disney+', category: 'entertainment' }
];

// 전체 트랜잭션 데이터 (시뮬레이션용 캐시)
let cachedTransactions = null;
let cacheTimestamp = null;
const CACHE_DURATION = 60000; // 1분

function getAllTransactions() {
  const now = Date.now();
  if (cachedTransactions && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedTransactions;
  }

  // 총 53개 트랜잭션 생성 (페이지네이션 테스트용)
  const total = 53;
  const transactions = [];

  for (let i = 0; i < total; i++) {
    const merchant = randomItem(merchants);
    const isRefund = Math.random() > 0.9;
    const amount = isRefund
      ? randomFloat(10, 200)
      : -randomFloat(5, 300);

    const daysAgo = Math.floor(i / 3);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    transactions.push({
      id: `txn-${now}-${i}`,
      date: date.toISOString().split('T')[0],
      merchant: merchant.name,
      category: merchant.category,
      amount: parseFloat(amount.toFixed(2))
    });
  }

  cachedTransactions = transactions;
  cacheTimestamp = now;
  return transactions;
}

function generateTransactions(page = 1, pageSize = 10, category = 'all') {
  const allTransactions = getAllTransactions();

  // 카테고리 필터링
  const filtered = category === 'all'
    ? allTransactions
    : allTransactions.filter(t => t.category === category);

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = filtered.slice(startIndex, endIndex);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

// ======================
// PAGE - Spending (SpendingChart)
// ======================

function generateSpending() {
  const categories = [
    { name: 'Shopping', baseAmount: 1200 },
    { name: 'Food & Dining', baseAmount: 800 },
    { name: 'Transport', baseAmount: 400 },
    { name: 'Entertainment', baseAmount: 300 },
    { name: 'Utilities', baseAmount: 250 },
    { name: 'Other', baseAmount: 100 }
  ];

  const data = categories.map(cat => ({
    name: cat.name,
    amount: Math.round(cat.baseAmount * randomFloat(0.7, 1.3))
  }));

  return {
    data: {
      categories: data
    }
  };
}

// ======================
// EXPORTS
// ======================

module.exports = {
  generateCardInfo,
  generateAlerts,
  generateSummary,
  generateTransactions,
  generateSpending
};
