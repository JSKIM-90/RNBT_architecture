# Dashboard Mock API Server

example_dashboard_01 대시보드를 위한 Mock API 서버입니다.

---

## 설치 및 실행

### 1. 의존성 설치
```bash
cd mock_server
npm install
```

### 2. 서버 실행
```bash
# 프로덕션 모드
npm start

# 개발 모드 (파일 변경 시 자동 재시작)
npm run dev
```

서버는 **http://localhost:3000**에서 실행됩니다.

---

## API 엔드포인트

### 1. Real-time Sales Data
**실시간 판매 데이터** (SalesChart 컴포넌트용)

```http
GET /api/sales/realtime?period=24h
```

**Query Parameters**:
- `period` (optional): `24h` | `7d` | `30d` (기본값: `24h`)

**Response**:
```json
{
  "success": true,
  "period": "24h",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "data": [
    {
      "timestamp": "2025-11-24T09:00:00.000Z",
      "date": "2025. 11. 24.",
      "time": "09:00",
      "sales": 3245,
      "orders": 42
    },
    ...
  ]
}
```

---

### 2. Sales Statistics
**판매 통계** (SalesStats 컴포넌트용)

```http
GET /api/sales/stats?period=24h
```

**Query Parameters**:
- `period` (optional): `24h` | `7d` | `30d` (기본값: `24h`)

**Response**:
```json
{
  "success": true,
  "period": "24h",
  "timestamp": "2025-11-24T10:00:00.000Z",
  "categories": [
    {
      "name": "전자기기",
      "sales": 85432,
      "orders": 234,
      "growth": "12.5"
    },
    ...
  ],
  "totalSales": 456789,
  "totalOrders": 1234
}
```

---

### 3. Product List
**제품 목록** (ProductList, Product3DViewer 컴포넌트용)

```http
GET /api/products/list?limit=50&category=전자기기&status=available
```

**Query Parameters**:
- `limit` (optional): 반환할 제품 수 (기본값: `50`)
- `category` (optional): 카테고리 필터 (`전자기기`, `의류`, `식품`, `가구`, `도서`, `스포츠`)
- `status` (optional): 상태 필터 (`available`, `out_of_stock`)

**Response**:
```json
{
  "success": true,
  "total": 50,
  "data": [
    {
      "id": "PROD-0001",
      "name": "상품 1",
      "category": "전자기기",
      "price": 125000,
      "stock": 87,
      "status": "available",
      "rating": "4.5",
      "soldCount": 523
    },
    ...
  ]
}
```

---

### 4. User Information
**사용자 정보** (Header 컴포넌트용)

```http
GET /api/user/info
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "USER-001",
    "name": "홍길동",
    "email": "hong@example.com",
    "role": "Admin",
    "department": "영업팀",
    "avatar": "https://ui-avatars.com/api/?name=Hong+Gildong&background=random",
    "lastLogin": "2025-11-24T09:30:00.000Z",
    "permissions": ["read", "write", "admin"]
  }
}
```

---

### 5. Notifications
**알림 목록** (Header 컴포넌트용)

```http
GET /api/notifications
```

**Response**:
```json
{
  "success": true,
  "items": [
    {
      "id": "NOTIF-001",
      "type": "info",
      "title": "신규 주문",
      "message": "새로운 주문이 접수되었습니다.",
      "timestamp": "2025-11-24T09:45:00.000Z",
      "read": false
    },
    ...
  ],
  "unreadCount": 3
}
```

**Notification Types**:
- `info` - 정보
- `warning` - 경고
- `success` - 성공
- `error` - 에러

---

### 6. Navigation Menu
**네비게이션 메뉴** (Sidebar 컴포넌트용)

```http
GET /api/navigation/menu
```

**Response**:
```json
{
  "success": true,
  "items": [
    {
      "id": "nav-dashboard",
      "page": "dashboard",
      "label": "대시보드",
      "icon": "📊",
      "badge": 0,
      "eventName": "@navDashboardClicked"
    },
    {
      "id": "nav-products",
      "page": "products",
      "label": "상품 관리",
      "icon": "📦",
      "badge": 5,
      "eventName": "@navProductsClicked"
    },
    ...
  ]
}
```

---

### 7. Product Details
**제품 상세 정보** (이벤트 핸들러용)

```http
GET /api/products/details?id=PROD-0001
```

**Query Parameters**:
- `id` (required): 제품 ID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "PROD-0001",
    "name": "상품 PROD-0001",
    "description": "이것은 상품에 대한 상세 설명입니다...",
    "category": "전자기기",
    "price": 125000,
    "stock": 87,
    "images": [
      "https://via.placeholder.com/400x400?text=Product+Image+1",
      "https://via.placeholder.com/400x400?text=Product+Image+2",
      "https://via.placeholder.com/400x400?text=Product+Image+3"
    ],
    "specifications": {
      "brand": "샘플 브랜드",
      "model": "MODEL-2024",
      "weight": "1.2kg",
      "dimensions": "30cm x 20cm x 10cm",
      "warranty": "1년"
    },
    "rating": "4.5",
    "reviewCount": 234,
    "soldCount": 523,
    "tags": ["인기", "추천", "신상품"]
  }
}
```

**Error Response** (ID 누락):
```json
{
  "success": false,
  "error": "Product ID is required"
}
```

---

## 기능

### ✅ 구현된 기능

1. **7개 API 엔드포인트** - dashboard에 필요한 모든 데이터 제공
2. **CORS 설정** - 모든 origin 허용
3. **Request Logging** - 모든 요청을 콘솔에 로깅
4. **Error Handling** - 404, 500 에러 처리
5. **Query Parameters** - 동적 필터링 지원
6. **Mock Data Generator** - 랜덤 데이터 생성

### 🎲 Mock Data 특징

- **Real-time Sales**: 시간대별 판매 데이터 (24시간/7일/30일)
- **Sales Stats**: 카테고리별 통계 + 성장률
- **Products**: 50개 제품 (ID, 이름, 가격, 재고, 평점)
- **User Info**: 사용자 프로필 + 권한
- **Notifications**: 랜덤 알림 (읽음/안읽음 상태)
- **Navigation**: 6개 메뉴 아이템 + 배지 카운트
- **Product Details**: 상세 정보 + 이미지 + 스펙

---

## 테스트

### cURL 테스트
```bash
# Real-time sales
curl "http://localhost:3000/api/sales/realtime?period=24h"

# Sales stats
curl "http://localhost:3000/api/sales/stats?period=7d"

# Product list
curl "http://localhost:3000/api/products/list?limit=10"

# User info
curl "http://localhost:3000/api/user/info"

# Notifications
curl "http://localhost:3000/api/notifications"

# Navigation menu
curl "http://localhost:3000/api/navigation/menu"

# Product details
curl "http://localhost:3000/api/products/details?id=PROD-0001"
```

### 브라우저 테스트
서버 실행 후 브라우저에서 직접 접속:
```
http://localhost:3000/api/sales/realtime
http://localhost:3000/api/products/list
http://localhost:3000/api/user/info
```

---

## 트러블슈팅

### Port 3000 already in use
다른 프로세스가 3000 포트를 사용 중일 경우:

**Windows**:
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac**:
```bash
lsof -i :3000
kill -9 <PID>
```

또는 `server.js`에서 PORT 변경:
```javascript
const PORT = 3001; // 다른 포트 사용
```

### CORS 에러
이미 모든 origin이 허용되어 있지만, 특정 origin만 허용하려면:

```javascript
app.use(cors({
  origin: 'http://localhost:8080'  // 특정 origin만 허용
}));
```

---

## 개발 모드

### 파일 변경 시 자동 재시작
```bash
npm run dev
```

`nodemon`이 파일 변경을 감지하여 자동으로 서버를 재시작합니다.

---

## 프로젝트 구조

```
mock_server/
├── package.json          # 의존성 및 스크립트
├── server.js             # Express 서버 메인 파일
└── README.md             # 사용 가이드 (현재 문서)
```

---

## 의존성

| Package | Version | 용도 |
|---------|---------|------|
| `express` | ^4.18.2 | 웹 서버 프레임워크 |
| `cors` | ^2.8.5 | CORS 설정 |
| `nodemon` | ^3.0.1 | 개발 모드 자동 재시작 (dev) |

---

## 다음 단계

1. ✅ **서버 실행** - `npm install && npm start`
2. ✅ **API 테스트** - cURL 또는 브라우저에서 테스트
3. ✅ **Dashboard 연결** - example_dashboard_01과 연동
4. 🔧 **커스터마이징** - Mock 데이터 수정 및 비즈니스 로직 추가

---

**버전**: 1.0.0
**작성일**: 2025-11-24
**작성자**: Claude Code
