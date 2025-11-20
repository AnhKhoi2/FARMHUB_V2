# 💳 VNPay Integration - Complete Setup

## ✅ Tổng quan

Hệ thống thanh toán VNPay đã được tích hợp hoàn chỉnh vào giao diện **Plant Care Pricing**!

## 📦 Files đã tạo/cập nhật

### Backend

```
backend/
├── models/
│   └── Order.js                          ✅ Model đơn hàng
├── routes/
│   └── vnpay.js                          ✅ API routes VNPay
├── server.js                             ✅ Đã thêm route /api/vnpay
├── .env                                  ✅ Cấu hình VNPay
├── test_vnpay.js                         ✅ Test script
├── postman/
│   └── vnpay.postman_collection.json    ✅ Postman collection
└── Docs:
    ├── VNPAY_INTEGRATION_GUIDE.md       ✅ Hướng dẫn chi tiết
    ├── VNPAY_QUICKSTART.md              ✅ Quick start
    └── VNPAY_SUMMARY.md                 ✅ Tổng kết
```

### Frontend

```
frontend/web/
├── src/
│   ├── api/
│   │   └── vnpayService.js              ✅ Service call API
│   ├── pages/Subscription/
│   │   ├── PlantCarePricing.jsx         ✅ Trang pricing (đã tích hợp VNPay)
│   │   ├── PaymentSuccess.jsx           ✅ Trang thành công
│   │   ├── PaymentFailed.jsx            ✅ Trang thất bại
│   │   ├── PlantCarePricing.css         ✅ CSS pricing
│   │   └── PaymentResult.css            ✅ CSS success/failed
│   └── routes/
│       └── index.jsx                    ✅ Đã thêm routes payment
├── .env                                 ✅ Cấu hình API URL
└── VNPAY_FRONTEND_GUIDE.md              ✅ Hướng dẫn frontend
```

## 🚀 Quick Start

### 1. Khởi động Backend

```bash
cd backend
npm run dev
```

Server chạy tại: `http://localhost:5000`

### 2. Khởi động Frontend

```bash
cd frontend/web
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

### 3. Test Payment Flow

1. Truy cập: `http://localhost:5173/pricing`
2. Đăng nhập (nếu chưa)
3. Chọn gói "Thông Minh" (99,000 VND) hoặc "Chuyên Gia" (199,000 VND)
4. Click nút "Nâng cấp"
5. Bạn sẽ được redirect đến VNPay sandbox
6. Nhập thông tin test:
   - **Ngân hàng**: NCB
   - **Số thẻ**: 9704198526191432198
   - **Tên**: NGUYEN VAN A
   - **Ngày phát hành**: 07/15
   - **OTP**: 123456
7. Xác nhận thanh toán
8. Bạn sẽ được redirect về:
   - Thành công: `/payment/success`
   - Thất bại: `/payment/failed`

## 🎯 API Endpoints

| Endpoint                         | Method | Chức năng          |
| -------------------------------- | ------ | ------------------ |
| `/api/vnpay/create_payment_url`  | POST   | Tạo URL thanh toán |
| `/api/vnpay/return`              | GET    | Callback từ VNPay  |
| `/api/vnpay/ipn`                 | GET    | IPN webhook        |
| `/api/vnpay/order/:orderId`      | GET    | Query đơn hàng     |
| `/api/vnpay/orders/user/:userId` | GET    | Danh sách đơn hàng |

## 🎨 Frontend Routes

| Route              | Component        | Chức năng        |
| ------------------ | ---------------- | ---------------- |
| `/pricing`         | PlantCarePricing | Trang chọn gói   |
| `/payment/success` | PaymentSuccess   | Trang thành công |
| `/payment/failed`  | PaymentFailed    | Trang thất bại   |

## 💡 Features

### Plant Care Pricing Page

- ✅ Hiển thị 3 gói: Cơ Bản (Free), Thông Minh (99k), Chuyên Gia (199k)
- ✅ Tích hợp button thanh toán VNPay
- ✅ Loading state khi xử lý
- ✅ Error handling
- ✅ Kiểm tra user đăng nhập
- ✅ Responsive design

### Payment Success Page

- ✅ Hiển thị thông tin đơn hàng
- ✅ Query order details từ backend
- ✅ Animation đẹp mắt
- ✅ Nút về trang chủ / xem gói
- ✅ Responsive

### Payment Failed Page

- ✅ Hiển thị lỗi cụ thể từ VNPay
- ✅ Map error code sang tiếng Việt
- ✅ Gợi ý giải quyết
- ✅ Nút thử lại / về trang chủ
- ✅ Responsive

## 🔄 Payment Flow

```
┌─────────────────────────────────────────────────┐
│  User vào /pricing                              │
│  → Chọn gói                                     │
│  → Click "Nâng cấp"                             │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  Frontend gọi API createPaymentUrl              │
│  → Backend tạo Order (status: pending)          │
│  → Backend tạo VNPay payment URL                │
│  → Response: paymentUrl + orderId               │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  Frontend redirect user đến VNPay               │
│  → User nhập thông tin thẻ                      │
│  → User xác nhận OTP                            │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  VNPay xử lý thanh toán                         │
│  → Gọi IPN webhook (background)                 │
│  → Backend update Order                         │
│  → Redirect user về frontend                    │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  Backend /api/vnpay/return                      │
│  → Verify signature                             │
│  → Update Order status                          │
│  → Redirect về frontend success/failed          │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│  Frontend /payment/success hoặc /failed         │
│  → Query order details                          │
│  → Hiển thị kết quả                             │
│  → Update user plan (nếu thành công)           │
└─────────────────────────────────────────────────┘
```

## 🧪 Testing

### Test với Node.js

```bash
cd backend
node test_vnpay.js
```

### Test với Postman

Import: `backend/postman/vnpay.postman_collection.json`

### Test trên giao diện

1. Vào `http://localhost:5173/pricing`
2. Click nút nâng cấp
3. Thanh toán test

## 📝 Environment Variables

### Backend (.env)

```env
VNP_TMN_CODE=XEDZ32MY
VNP_HASH_SECRET=Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
RETURN_URL_PATH=/api/vnpay/return
IPN_URL_PATH=/api/vnpay/ipn
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

## 🎨 Screenshots

### Pricing Page

- 3 gói dịch vụ với giá rõ ràng
- Button nâng cấp tích hợp VNPay
- Hiển thị gói hiện tại

### Payment Success

- Icon check xanh lá
- Thông tin đơn hàng chi tiết
- Nút action rõ ràng

### Payment Failed

- Icon X đỏ
- Thông báo lỗi cụ thể
- Gợi ý giải quyết

## 🔐 Security

- ✅ Verify `vnp_SecureHash` từ VNPay
- ✅ Validate user đăng nhập trước khi thanh toán
- ✅ Check order status trước khi update
- ✅ Error handling đầy đủ
- ⚠️ Production phải dùng HTTPS

## 🚀 Production Checklist

### Backend

- [ ] Thay VNP credentials production
- [ ] Đổi `VNP_PAYMENT_URL` sang production URL
- [ ] Update `BASE_URL` và `CLIENT_URL`
- [ ] Enable HTTPS
- [ ] Config IP whitelist trên VNPay dashboard

### Frontend

- [ ] Update `VITE_API_URL` production
- [ ] Build production: `npm run build`
- [ ] Deploy static files
- [ ] Test payment flow trên production

## 📚 Documentation

- **Backend**: `backend/VNPAY_INTEGRATION_GUIDE.md`
- **Frontend**: `frontend/web/VNPAY_FRONTEND_GUIDE.md`
- **Quick Start**: `backend/VNPAY_QUICKSTART.md`

## 🐛 Troubleshooting

### "Cannot create payment URL"

→ Kiểm tra backend có chạy không
→ Check `VITE_API_URL` trong frontend

### CORS Error

→ Backend phải enable CORS cho frontend URL
→ Check `CLIENT_URL` trong backend .env

### Redirect không hoạt động

→ Kiểm tra `BASE_URL` và `CLIENT_URL`
→ Check routes trong frontend

### Order not found

→ Check database connection
→ Verify orderId đúng

## 🎉 Success!

Tích hợp VNPay vào Plant Care Pricing hoàn tất!

**Test ngay**:

1. Backend: `http://localhost:5000`
2. Frontend: `http://localhost:5173/pricing`

**Thông tin test VNPay**:

- Ngân hàng: NCB
- Số thẻ: 9704198526191432198
- OTP: 123456

Happy coding! 🚀
