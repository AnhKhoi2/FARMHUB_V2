# 📦 VNPay Integration - Summary

## ✅ Đã triển khai thành công

### 📁 Files được tạo/cập nhật

1. **Models**

   - `backend/models/Order.js` - Schema đơn hàng với đầy đủ trường thông tin

2. **Routes**

   - `backend/routes/vnpay.js` - API endpoints VNPay (create, return, ipn, query)

3. **Server**

   - `backend/server.js` - Đã thêm route `/api/vnpay`

4. **Configuration**

   - `backend/.env` - Đã cấu hình VNPay credentials

5. **Testing**

   - `backend/test_vnpay.js` - Test script Node.js
   - `backend/postman/vnpay.postman_collection.json` - Postman collection

6. **Documentation**
   - `backend/VNPAY_INTEGRATION_GUIDE.md` - Hướng dẫn chi tiết
   - `backend/VNPAY_QUICKSTART.md` - Quick start guide
   - `backend/VNPAY_SUMMARY.md` - File này

### 🔧 Dependencies đã cài

- ✅ `request-ip` - Lấy IP client
- ✅ `axios` (dev) - Cho test scripts

### 🎯 API Endpoints hoạt động

| Endpoint                         | Method | Status     |
| -------------------------------- | ------ | ---------- |
| `/api/vnpay/create_payment_url`  | POST   | ✅ Working |
| `/api/vnpay/return`              | GET    | ✅ Working |
| `/api/vnpay/ipn`                 | GET    | ✅ Working |
| `/api/vnpay/order/:orderId`      | GET    | ✅ Working |
| `/api/vnpay/orders/user/:userId` | GET    | ✅ Working |

## 🧪 Cách test

### Option 1: Node.js script (Recommended)

```bash
cd backend
node test_vnpay.js
```

### Option 2: Postman

Import file: `backend/postman/vnpay.postman_collection.json`

### Option 3: curl

```bash
curl -X POST http://localhost:5000/api/vnpay/create_payment_url \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "orderDescription": "Test payment",
    "userId": "YOUR_USER_ID",
    "items": [{"name": "Test", "quantity": 1, "price": 50000}]
  }'
```

## 💡 Flow hoàn chỉnh

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ 1. POST /create_payment_url
       ↓
┌─────────────┐
│   Backend   │ → Tạo Order (status: pending)
└──────┬──────┘
       │ 2. Return paymentUrl
       ↓
┌─────────────┐
│  Frontend   │ → Redirect user
└──────┬──────┘
       │ 3. User thanh toán
       ↓
┌─────────────┐
│    VNPay    │
└──────┬──────┘
       │ 4a. IPN (background)
       ↓
┌─────────────┐
│   Backend   │ → Update Order (status: paid/failed)
└─────────────┘
       │ 4b. Return callback
       ↓
┌─────────────┐
│   Backend   │ → Verify & Update Order
└──────┬──────┘
       │ 5. Redirect về Frontend
       ↓
┌─────────────┐
│  Frontend   │ → Show success/failed page
└─────────────┘
```

## 🎨 Frontend Integration Example

```javascript
// React/Next.js example
const handlePayment = async (userId, amount, items) => {
  try {
    // 1. Create payment URL
    const response = await fetch(
      "http://localhost:5000/api/vnpay/create_payment_url",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          orderDescription: `Thanh toán ${items[0].name}`,
          userId,
          items,
        }),
      }
    );

    const data = await response.json();

    if (data.code === "00") {
      // 2. Redirect to VNPay
      window.location.href = data.paymentUrl;
    } else {
      alert("Lỗi tạo thanh toán");
    }
  } catch (error) {
    console.error("Payment error:", error);
  }
};

// Success page: /payment/success?orderId=xxx&orderRef=yyy
const PaymentSuccess = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Query order details
    fetch(`http://localhost:5000/api/vnpay/order/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Order:", data.order);
        // Display order info
      });
  }, [orderId]);

  return <div>✅ Thanh toán thành công!</div>;
};
```

## 🔐 Security Checklist

- ✅ Verify `vnp_SecureHash` từ VNPay
- ✅ Không expose `VNP_HASH_SECRET`
- ✅ Validate `userId` trước khi tạo order
- ✅ Check order status trước khi update
- ⚠️ Production phải dùng HTTPS
- ⚠️ Production nên config IP whitelist

## 🚀 Production Deployment

1. **Update .env**

```env
VNP_TMN_CODE=YOUR_PRODUCTION_CODE
VNP_HASH_SECRET=YOUR_PRODUCTION_SECRET
VNP_PAYMENT_URL=https://vnpayment.vn/paymentv2/vpcpay.html
BASE_URL=https://api.yourdomain.com
CLIENT_URL=https://yourdomain.com
```

2. **VNPay Dashboard**

   - Thêm Return URL: `https://api.yourdomain.com/api/vnpay/return`
   - Thêm IPN URL: `https://api.yourdomain.com/api/vnpay/ipn`
   - Config IP whitelist (optional)

3. **Frontend Routes**
   - Create: `/payment/checkout`
   - Success: `/payment/success`
   - Failed: `/payment/failed`

## 📊 Order Status Flow

```
pending → (user pays) → paid → confirmed → processing → completed
                     ↘ (fail) → failed
```

## 📝 Environment Variables Reference

| Variable          | Description            | Example                         |
| ----------------- | ---------------------- | ------------------------------- |
| `VNP_TMN_CODE`    | Terminal/Merchant Code | XEDZ32MY                        |
| `VNP_HASH_SECRET` | Secret key để hash     | Z8O3ARTA...                     |
| `VNP_PAYMENT_URL` | VNPay payment URL      | https://sandbox.vnpayment.vn... |
| `BASE_URL`        | Backend base URL       | http://localhost:5000           |
| `CLIENT_URL`      | Frontend URL           | http://localhost:3000           |
| `RETURN_URL_PATH` | Return callback path   | /api/vnpay/return               |
| `IPN_URL_PATH`    | IPN webhook path       | /api/vnpay/ipn                  |

## 🐛 Troubleshooting

### "Invalid Signature"

→ Kiểm tra `VNP_HASH_SECRET`, đảm bảo không có space

### "Order not found"

→ Kiểm tra `orderRef` có match không

### Server không nhận IPN

→ Localhost không thể nhận IPN. Deploy lên server public hoặc dùng ngrok

### Payment URL expired

→ URL chỉ valid 15 phút. Tạo lại nếu hết hạn

## 📞 Support

- VNPay Docs: https://sandbox.vnpayment.vn/apis/docs/
- VNPay Support: support@vnpay.vn

## 🎉 Ready to Go!

Server đã sẵn sàng tại `http://localhost:5000`

Chạy test: `node test_vnpay.js`
