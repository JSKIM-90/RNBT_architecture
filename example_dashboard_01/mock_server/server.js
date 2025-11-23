const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ===========================
// MIDDLEWARE
// ===========================
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ===========================
// MOCK DATA GENERATORS
// ===========================

// Generate random sales data for chart (last 24 hours)
function generateSalesData(period = '24h') {
  const now = Date.now();
  const dataPoints = period === '24h' ? 24 : period === '7d' ? 7 : 30;
  const interval = period === '24h' ? 3600000 : period === '7d' ? 86400000 : 86400000;

  return Array.from({ length: dataPoints }, (_, i) => {
    const timestamp = now - (dataPoints - 1 - i) * interval;
    return {
      timestamp: new Date(timestamp).toISOString(),
      date: new Date(timestamp).toLocaleDateString('ko-KR'),
      time: new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      sales: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 10
    };
  });
}

// Generate sales statistics by category
function generateSalesStats(period = '24h') {
  const categories = ['전자기기', '의류', '식품', '가구', '도서', '스포츠'];

  return {
    period,
    timestamp: new Date().toISOString(),
    categories: categories.map(category => ({
      name: category,
      sales: Math.floor(Math.random() * 100000) + 20000,
      orders: Math.floor(Math.random() * 500) + 50,
      growth: (Math.random() * 40 - 10).toFixed(1) // -10% ~ +30%
    })),
    totalSales: 0, // Will be calculated
    totalOrders: 0  // Will be calculated
  };
}

// Generate product list
function generateProductList(limit = 50) {
  const categories = ['전자기기', '의류', '식품', '가구', '도서', '스포츠'];
  const products = [];

  for (let i = 1; i <= limit; i++) {
    products.push({
      id: `PROD-${String(i).padStart(4, '0')}`,
      name: `상품 ${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 500000) + 10000,
      stock: Math.floor(Math.random() * 200),
      status: Math.random() > 0.2 ? 'available' : 'out_of_stock',
      rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 ~ 5.0
      soldCount: Math.floor(Math.random() * 1000)
    });
  }

  return products;
}

// Generate user info
function generateUserInfo() {
  return {
    id: 'USER-001',
    name: '홍길동',
    email: 'hong@example.com',
    role: 'Admin',
    department: '영업팀',
    avatar: 'https://ui-avatars.com/api/?name=Hong+Gildong&background=random',
    lastLogin: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    permissions: ['read', 'write', 'admin']
  };
}

// Generate notifications
function generateNotifications() {
  const types = ['info', 'warning', 'success', 'error'];
  const messages = [
    { title: '신규 주문', message: '새로운 주문이 접수되었습니다.' },
    { title: '재고 부족', message: '일부 상품의 재고가 부족합니다.' },
    { title: '시스템 업데이트', message: '시스템 업데이트가 완료되었습니다.' },
    { title: '매출 목표 달성', message: '이번 달 매출 목표를 달성했습니다!' },
    { title: '리뷰 등록', message: '새로운 상품 리뷰가 등록되었습니다.' }
  ];

  const notificationCount = Math.floor(Math.random() * 5) + 3;
  const items = Array.from({ length: notificationCount }, (_, i) => {
    const msg = messages[Math.floor(Math.random() * messages.length)];
    return {
      id: `NOTIF-${String(i + 1).padStart(3, '0')}`,
      type: types[Math.floor(Math.random() * types.length)],
      title: msg.title,
      message: msg.message,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      read: Math.random() > 0.5
    };
  });

  return {
    items,
    unreadCount: items.filter(n => !n.read).length
  };
}

// Generate navigation menu
function generateNavigationMenu() {
  return {
    items: [
      {
        id: 'nav-dashboard',
        page: 'dashboard',
        label: '대시보드',
        icon: '📊',
        badge: 0,
        eventName: '@navDashboardClicked'
      },
      {
        id: 'nav-products',
        page: 'products',
        label: '상품 관리',
        icon: '📦',
        badge: 5,
        eventName: '@navProductsClicked'
      },
      {
        id: 'nav-orders',
        page: 'orders',
        label: '주문 관리',
        icon: '🛒',
        badge: 12,
        eventName: '@navOrdersClicked'
      },
      {
        id: 'nav-customers',
        page: 'customers',
        label: '고객 관리',
        icon: '👥',
        badge: 0,
        eventName: '@navCustomersClicked'
      },
      {
        id: 'nav-analytics',
        page: 'analytics',
        label: '분석',
        icon: '📈',
        badge: 0,
        eventName: '@navAnalyticsClicked'
      },
      {
        id: 'nav-settings',
        page: 'settings',
        label: '설정',
        icon: '⚙️',
        badge: 0,
        eventName: '@navSettingsClicked'
      }
    ]
  };
}

// Generate product details
function generateProductDetails(productId) {
  if (!productId) {
    return { error: 'Product ID is required' };
  }

  return {
    id: productId,
    name: `상품 ${productId}`,
    description: '이것은 상품에 대한 상세 설명입니다. 고품질의 제품으로 고객 만족도가 높습니다.',
    category: '전자기기',
    price: Math.floor(Math.random() * 500000) + 10000,
    stock: Math.floor(Math.random() * 200),
    images: [
      'https://via.placeholder.com/400x400?text=Product+Image+1',
      'https://via.placeholder.com/400x400?text=Product+Image+2',
      'https://via.placeholder.com/400x400?text=Product+Image+3'
    ],
    specifications: {
      brand: '샘플 브랜드',
      model: 'MODEL-2024',
      weight: '1.2kg',
      dimensions: '30cm x 20cm x 10cm',
      warranty: '1년'
    },
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviewCount: Math.floor(Math.random() * 500),
    soldCount: Math.floor(Math.random() * 1000),
    tags: ['인기', '추천', '신상품']
  };
}

// ===========================
// API ENDPOINTS
// ===========================

// 1. Real-time sales data
app.get('/api/sales/realtime', (req, res) => {
  const { period = '24h' } = req.query;
  const data = generateSalesData(period);

  res.json({
    success: true,
    period,
    timestamp: new Date().toISOString(),
    data
  });
});

// 2. Sales statistics
app.get('/api/sales/stats', (req, res) => {
  const { period = '24h' } = req.query;
  const stats = generateSalesStats(period);

  // Calculate totals
  stats.totalSales = stats.categories.reduce((sum, cat) => sum + cat.sales, 0);
  stats.totalOrders = stats.categories.reduce((sum, cat) => sum + cat.orders, 0);

  res.json({
    success: true,
    ...stats
  });
});

// 3. Product list
app.get('/api/products/list', (req, res) => {
  const { limit = 50, category, status } = req.query;
  let products = generateProductList(parseInt(limit));

  // Filter by category
  if (category) {
    products = products.filter(p => p.category === category);
  }

  // Filter by status
  if (status) {
    products = products.filter(p => p.status === status);
  }

  res.json({
    success: true,
    total: products.length,
    data: products
  });
});

// 4. User information
app.get('/api/user/info', (req, res) => {
  const user = generateUserInfo();

  res.json({
    success: true,
    data: user
  });
});

// 5. Notifications
app.get('/api/notifications', (req, res) => {
  const notifications = generateNotifications();

  res.json({
    success: true,
    ...notifications
  });
});

// 6. Navigation menu
app.get('/api/navigation/menu', (req, res) => {
  const menu = generateNavigationMenu();

  res.json({
    success: true,
    ...menu
  });
});

// 7. Product details
app.get('/api/products/details', (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Product ID is required'
    });
  }

  const details = generateProductDetails(id);

  res.json({
    success: true,
    data: details
  });
});

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ===========================
// START SERVER
// ===========================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Dashboard Mock API Server                ║
║   Running on http://localhost:${PORT}       ║
╚════════════════════════════════════════════╝

Available Endpoints:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GET /api/sales/realtime       - Real-time sales data
  GET /api/sales/stats          - Sales statistics
  GET /api/products/list        - Product list
  GET /api/user/info            - User information
  GET /api/notifications        - Notifications
  GET /api/navigation/menu      - Navigation menu
  GET /api/products/details     - Product details (requires ?id=xxx)

Query Parameters:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  /api/sales/realtime?period=24h|7d|30d
  /api/sales/stats?period=24h|7d|30d
  /api/products/list?limit=50&category=전자기기&status=available
  /api/products/details?id=PROD-0001

Press Ctrl+C to stop
  `);
});
