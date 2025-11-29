# 🎨 VNPay Frontend Integration Guide

## ✅ Files đã tạo

### 1. API Service

- **`src/api/vnpayService.js`** - Service để gọi API VNPay

### 2. Components

- **`src/pages/Subscription/PlantCarePricing.jsx`** - Trang chọn gói và thanh toán
- **`src/pages/Subscription/PaymentSuccess.jsx`** - Trang thành công
- **`src/pages/Subscription/PaymentFailed.jsx`** - Trang thất bại
- **`src/pages/Subscription/PaymentResult.css`** - CSS cho success/failed pages

### 3. Routes

- `/pricing` - Trang chọn gói
- `/payment/success` - Callback thành công
- `/payment/failed` - Callback thất bại

## 🔄 Flow thanh toán

```
User → /pricing (chọn gói)
  ↓
Click "Nâng cấp"
  ↓
Frontend gọi API createPaymentUrl
  ↓
Nhận paymentUrl từ backend
  ↓
Redirect đến VNPay
  ↓
User thanh toán trên VNPay
  ↓
VNPay redirect về:
  - /payment/success?orderId=xxx (thành công)
  - /payment/failed?orderId=xxx&code=xxx (thất bại)
```

## 🎯 Cách sử dụng

### 1. Cấu hình environment

Tạo/cập nhật file `.env` trong `frontend/web`:

```env
VITE_API_URL=http://localhost:5000
```

### 2. Test payment flow

1. Khởi động backend:

```bash
cd backend
npm run dev
```

2. Khởi động frontend:

```bash
cd frontend/web
npm run dev
```

3. Truy cập: `http://localhost:5173/pricing`

4. Đăng nhập (nếu chưa)

5. Click "Nâng cấp lên Thông Minh" hoặc "Nâng cấp lên Chuyên Gia"

6. Bạn sẽ được redirect đến VNPay sandbox

7. Nhập thông tin test:

   - **Ngân hàng**: NCB
   - **Số thẻ**: 9704198526191432198
   - **Tên**: NGUYEN VAN A
   - **Ngày**: 07/15
   - **OTP**: 123456

8. Sau khi thanh toán, bạn sẽ được redirect về:
   - Success: `/payment/success?orderId=xxx&orderRef=xxx`
   - Failed: `/payment/failed?orderId=xxx&code=xxx`

## 📝 Code Examples

### Sử dụng VNPay Service

```javascript
import vnpayService from "../api/vnpayService";

// Tạo thanh toán
const handlePayment = async () => {
  try {
    const response = await vnpayService.createPaymentUrl({
      amount: 9900,
      orderDescription: "Nâng cấp gói Thông Minh",
      userId: user._id,
      items: [
        {
          itemType: "Subscription",
          name: "Gói Thông Minh",
          quantity: 1,
          price: 9900,
        },
      ],
    });

    if (response.code === "00") {
      window.location.href = response.paymentUrl;
    }
  } catch (error) {
    console.error("Payment error:", error);
  }
};

// Lấy thông tin order
const getOrderDetails = async (orderId) => {
  try {
    const response = await vnpayService.getOrderById(orderId);
    console.log("Order:", response.order);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Lấy danh sách orders của user
const getUserOrders = async (userId) => {
  try {
    const response = await vnpayService.getUserOrders(userId, {
      page: 1,
      limit: 10,
      paymentStatus: "paid",
    });
    console.log("Orders:", response.orders);
  } catch (error) {
    console.error("Error:", error);
  }
};
```

### Tích hợp vào component khác

```javascript
import React from "react";
import { useNavigate } from "react-router-dom";
import vnpayService from "../api/vnpayService";

const MyComponent = () => {
  const navigate = useNavigate();

  const handleBuyPremium = async () => {
    try {
      const response = await vnpayService.createPaymentUrl({
        amount: 199000,
        orderDescription: "Mua gói Chuyên Gia",
        userId: currentUser._id,
        items: [
          {
            itemType: "Subscription",
            name: "Gói Chuyên Gia",
            quantity: 1,
            price: 199000,
          },
        ],
      });

      if (response.code === "00") {
        // Lưu thông tin để xử lý sau
        localStorage.setItem("pendingPlan", "pro");
        localStorage.setItem("orderId", response.orderId);

        // Redirect đến VNPay
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  return <button onClick={handleBuyPremium}>Mua gói Chuyên Gia</button>;
};
```

## 🎨 Customization

### Thay đổi gói dịch vụ

Chỉnh sửa file `PlantCarePricing.jsx`, mảng `plans`:

```javascript
const plans = [
  {
    key: "basic",
    name: "Cơ Bản",
    price: 0,
    // ... các thuộc tính khác
  },
  {
    key: "premium",
    name: "Premium",
    price: 149000, // Thay đổi giá
    // ... thêm/bớt features
  },
];
```

### Thay đổi style

Chỉnh sửa các file CSS:

- `PlantCarePricing.css` - Style cho trang pricing
- `PaymentResult.css` - Style cho success/failed pages

### Thêm xử lý sau thanh toán

Trong `PaymentSuccess.jsx`:

```javascript
useEffect(() => {
  const fetchOrderDetails = async () => {
    if (orderId) {
      const response = await vnpayService.getOrderById(orderId);

      if (response.order.paymentStatus === "paid") {
        // TODO: Cập nhật user plan
        dispatch(updateUserPlan(pendingPlan));

        // TODO: Gọi API update user subscription
        await updateUserSubscription(user._id, pendingPlan);

        // Xóa pending
        localStorage.removeItem("pendingPlan");
      }
    }
  };

  fetchOrderDetails();
}, [orderId]);
```

## 🔧 Backend Configuration

Backend phải có các endpoint:

- `POST /api/vnpay/create_payment_url` - Tạo payment URL
- `GET /api/vnpay/return` - Return callback
- `GET /api/vnpay/ipn` - IPN webhook
- `GET /api/vnpay/order/:orderId` - Query order
- `GET /api/vnpay/orders/user/:userId` - User orders

Backend `.env`:

```env
VNP_TMN_CODE=XEDZ32MY
VNP_HASH_SECRET=Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
RETURN_URL_PATH=/api/vnpay/return
IPN_URL_PATH=/api/vnpay/ipn
```

## 🐛 Troubleshooting

### CORS Error

- Kiểm tra backend có enable CORS cho frontend URL không
- Kiểm tra `CLIENT_URL` trong backend `.env`

### Payment URL không hoạt động

- Kiểm tra backend có chạy không
- Kiểm tra `VITE_API_URL` trong frontend `.env`
- Check console log để xem error message

### Redirect không hoạt động

- Kiểm tra `BASE_URL` và `CLIENT_URL` trong backend `.env`
- Kiểm tra routes trong `frontend/web/src/routes/index.jsx`

### Order not found

- Kiểm tra orderId có được truyền đúng không
- Check database có order với ID đó không

## 📱 Mobile Responsive

Tất cả các trang đã responsive:

- PlantCarePricing: Tối ưu cho mobile
- PaymentSuccess/Failed: Responsive design với breakpoint 768px

## 🚀 Production Deployment

### Frontend

```bash
cd frontend/web
npm run build
```

### Environment Variables Production

```env
VITE_API_URL=https://api.yourdomain.com
```

### Backend

Xem `backend/VNPAY_INTEGRATION_GUIDE.md` để cấu hình production.

## 🎉 Done!

Tích hợp VNPay đã hoàn tất!

Test ngay tại: `http://localhost:5173/pricing`
