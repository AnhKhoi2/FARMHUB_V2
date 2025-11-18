# 🚀 VNPay Quick Reference

## 📞 API Quick Reference

### Create Payment

```javascript
import vnpayService from "./api/vnpayService";

const response = await vnpayService.createPaymentUrl({
  amount: 99000,
  orderDescription: "Nâng cấp gói Thông Minh",
  userId: user._id,
  items: [
    {
      itemType: "Subscription",
      name: "Gói Thông Minh",
      quantity: 1,
      price: 99000,
    },
  ],
});

// Redirect to VNPay
window.location.href = response.paymentUrl;
```

### Get Order Details

```javascript
const order = await vnpayService.getOrderById(orderId);
console.log(order);
```

### Get User Orders

```javascript
const orders = await vnpayService.getUserOrders(userId, {
  page: 1,
  limit: 10,
  paymentStatus: "paid",
});
```

## 🔗 Routes

| Route              | Component        | Public |
| ------------------ | ---------------- | ------ |
| `/pricing`         | PlantCarePricing | ✅ Yes |
| `/payment/success` | PaymentSuccess   | ✅ Yes |
| `/payment/failed`  | PaymentFailed    | ✅ Yes |

## 💳 Test Credentials (VNPay Sandbox)

```
Ngân hàng: NCB
Số thẻ: 9704198526191432198
Tên: NGUYEN VAN A
Ngày phát hành: 07/15
OTP: 123456
```

## 📋 Pricing Plans

```javascript
const plans = [
  { key: "basic", name: "Cơ Bản", price: 0 },
  { key: "smart", name: "Thông Minh", price: 99000 },
  { key: "pro", name: "Chuyên Gia", price: 199000 },
];
```

## 🔧 Environment Variables

### Backend

```env
VNP_TMN_CODE=XEDZ32MY
VNP_HASH_SECRET=Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK
BASE_URL=http://localhost:5000
CLIENT_URL=http://localhost:5173
```

### Frontend

```env
VITE_API_URL=http://localhost:5000
```

## 🧪 Test Commands

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend/web && npm run dev

# Test API
cd backend && node test_vnpay.js
```

## 🔄 Payment Flow (Simple)

```
User clicks "Nâng cấp"
  ↓
API creates payment URL
  ↓
Redirect to VNPay
  ↓
User pays
  ↓
Redirect back to /payment/success or /failed
```

## 📊 Order Status

```javascript
status: "pending" |
  "confirmed" |
  "processing" |
  "completed" |
  "cancelled" |
  "failed";
paymentStatus: "pending" | "paid" | "failed" | "refunded";
```

## 🐛 Common Errors

| Error                 | Solution                         |
| --------------------- | -------------------------------- |
| CORS                  | Check CLIENT_URL in backend .env |
| Order not found       | Check orderId is valid           |
| Invalid signature     | Check VNP_HASH_SECRET            |
| Cannot create payment | Check backend is running         |

## 📝 Order Schema (Quick)

```javascript
{
  userId: ObjectId,
  orderRef: String,        // "ORD20241117123456"
  totalAmount: Number,     // 99000
  paymentStatus: String,   // "paid"
  status: String,          // "confirmed"
  items: Array,
  paymentInfo: Object      // VNPay response
}
```

## 🎨 Component Usage

```jsx
import { useNavigate } from 'react-router-dom';
import vnpayService from '../api/vnpayService';

function MyComponent() {
  const handlePayment = async () => {
    try {
      const res = await vnpayService.createPaymentUrl({
        amount: 99000,
        orderDescription: "Test",
        userId: user._id,
        items: [...]
      });
      window.location.href = res.paymentUrl;
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return <button onClick={handlePayment}>Pay Now</button>;
}
```

## 📍 Important URLs

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Pricing: `http://localhost:5173/pricing`
- VNPay Sandbox: `https://sandbox.vnpayment.vn`

## 🎯 Key Files

```
backend/routes/vnpay.js          - API endpoints
backend/models/Order.js          - Order schema
frontend/src/api/vnpayService.js - API service
frontend/src/pages/Subscription/ - UI components
```

## ✅ Checklist Before Deploy

- [ ] Test payment flow
- [ ] Check all routes working
- [ ] Verify order creation
- [ ] Test success/failed callbacks
- [ ] Update .env for production
- [ ] Enable HTTPS
- [ ] Test on mobile

---

**Need Help?** Check full documentation:

- Backend: `backend/VNPAY_INTEGRATION_GUIDE.md`
- Frontend: `frontend/web/VNPAY_FRONTEND_GUIDE.md`
- Complete: `VNPAY_COMPLETE_GUIDE.md`
