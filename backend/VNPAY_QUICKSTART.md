# 💳 VNPay Payment Integration - Quick Start

## ✅ Đã hoàn thành

1. ✅ Model `Order` - Lưu trữ thông tin đơn hàng
2. ✅ Route `/api/vnpay/*` - API endpoints đầy đủ
3. ✅ Cấu hình `.env` - VNPay credentials
4. ✅ Test files - `test_vnpay.js` và Postman collection
5. ✅ Tài liệu - `VNPAY_INTEGRATION_GUIDE.md`

## 🚀 Cách sử dụng nhanh

### 1. Test với file Node.js

```bash
cd backend
node test_vnpay.js
```

Mở link payment URL trong console để thanh toán test.

### 2. Test với Postman

Import file: `backend/postman/vnpay.postman_collection.json`

### 3. Test từ Frontend

```javascript
// Tạo thanh toán
const response = await fetch(
  "http://localhost:5000/api/vnpay/create_payment_url",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: 50000,
      orderDescription: "Thanh toán gói Pro",
      userId: "your_user_id",
      items: [{ name: "Gói Pro", quantity: 1, price: 50000 }],
    }),
  }
);

const data = await response.json();
window.location.href = data.paymentUrl; // Redirect đến VNPay
```

## 💳 Thông tin test VNPay

- **Ngân hàng:** NCB
- **Số thẻ:** 9704198526191432198
- **Tên:** NGUYEN VAN A
- **Ngày:** 07/15
- **OTP:** 123456

## 📡 API Endpoints

| Endpoint                         | Method | Mô tả                       |
| -------------------------------- | ------ | --------------------------- |
| `/api/vnpay/create_payment_url`  | POST   | Tạo URL thanh toán          |
| `/api/vnpay/return`              | GET    | Callback từ VNPay           |
| `/api/vnpay/ipn`                 | GET    | IPN webhook                 |
| `/api/vnpay/order/:orderId`      | GET    | Query thông tin đơn hàng    |
| `/api/vnpay/orders/user/:userId` | GET    | Danh sách đơn hàng của user |

## 📚 Tài liệu đầy đủ

Xem file `VNPAY_INTEGRATION_GUIDE.md` để biết chi tiết.

## 🔧 Cấu hình Production

Khi deploy production, cần thay đổi:

```env
# Production settings
VNP_TMN_CODE=YOUR_PRODUCTION_TMN_CODE
VNP_HASH_SECRET=YOUR_PRODUCTION_HASH_SECRET
VNP_PAYMENT_URL=https://vnpayment.vn/paymentv2/vpcpay.html
BASE_URL=https://your-domain.com
CLIENT_URL=https://your-frontend-domain.com
```

⚠️ **Lưu ý:** Phải dùng HTTPS cho production!

## 🎉 Done!

Server đang chạy tại `http://localhost:5000`

Test ngay bằng cách chạy: `node test_vnpay.js`
