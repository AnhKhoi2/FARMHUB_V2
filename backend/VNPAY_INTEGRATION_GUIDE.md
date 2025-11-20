# 🎯 Hướng dẫn tích hợp VNPay

## 📋 Tổng quan

Hệ thống thanh toán VNPay đã được tích hợp hoàn chỉnh với các tính năng:

- ✅ Tạo URL thanh toán VNPay
- ✅ Xử lý callback return từ VNPay
- ✅ Xử lý IPN (Instant Payment Notification)
- ✅ Query thông tin đơn hàng
- ✅ Lấy danh sách đơn hàng theo user

## 🗂️ Cấu trúc Files

```
backend/
├── models/
│   └── Order.js              # Schema đơn hàng
├── routes/
│   └── vnpay.js              # API routes VNPay
├── test_vnpay.js             # File test API
└── .env                      # Cấu hình VNPay
```

## ⚙️ Cấu hình môi trường (.env)

```env
# VNPay configuration
VNP_TMN_CODE=XEDZ32MY                              # Terminal/Merchant Code
VNP_HASH_SECRET=Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK   # Hash Secret Key
VNP_PAYMENT_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
BASE_URL=http://localhost:5000                     # Backend URL
RETURN_URL_PATH=/api/vnpay/return                  # Return callback path
IPN_URL_PATH=/api/vnpay/ipn                        # IPN webhook path
CLIENT_URL=http://localhost:3000                   # Frontend URL (để redirect)
```

## 🚀 Cài đặt

```bash
cd backend
npm install request-ip
npm run dev
```

## 📡 API Endpoints

### 1. Tạo URL thanh toán

**POST** `/api/vnpay/create_payment_url`

**Request Body:**

```json
{
  "amount": 50000,
  "orderDescription": "Thanh toán gói Pro 1 tháng",
  "userId": "673900d8ee2bcbc1cd3a9999",
  "items": [
    {
      "name": "Gói Pro 1 tháng",
      "quantity": 1,
      "price": 50000
    }
  ]
}
```

**Response:**

```json
{
  "code": "00",
  "message": "success",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "orderId": "673abc123def456789",
  "orderRef": "ORD20241117123456"
}
```

### 2. Callback Return (tự động)

**GET** `/api/vnpay/return?vnp_Amount=...&vnp_SecureHash=...`

- VNPay sẽ redirect user về URL này sau khi thanh toán
- Hệ thống tự động xử lý và redirect về frontend
- Success: `{CLIENT_URL}/payment/success?orderId=...`
- Failed: `{CLIENT_URL}/payment/failed?orderId=...&code=...`

### 3. IPN Webhook (tự động)

**GET** `/api/vnpay/ipn?vnp_Amount=...&vnp_SecureHash=...`

- VNPay gọi webhook này để xác nhận thanh toán
- Response theo chuẩn VNPay:

```json
{
  "RspCode": "00",
  "Message": "Success"
}
```

### 4. Query thông tin đơn hàng

**GET** `/api/vnpay/order/:orderId`

**Response:**

```json
{
  "success": true,
  "order": {
    "_id": "673abc123def456789",
    "orderRef": "ORD20241117123456",
    "userId": {...},
    "totalAmount": 50000,
    "status": "confirmed",
    "paymentStatus": "paid",
    "paidAt": "2024-11-17T10:30:00.000Z",
    "items": [...],
    "createdAt": "2024-11-17T10:25:00.000Z"
  }
}
```

### 5. Lấy danh sách đơn hàng của user

**GET** `/api/vnpay/orders/user/:userId?page=1&limit=20&status=confirmed&paymentStatus=paid`

**Query params:**

- `page`: Trang hiện tại (default: 1)
- `limit`: Số đơn hàng mỗi trang (default: 20)
- `status`: Lọc theo trạng thái đơn hàng (optional)
- `paymentStatus`: Lọc theo trạng thái thanh toán (optional)

**Response:**

```json
{
  "success": true,
  "orders": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

## 🧪 Test API

### Cách 1: Dùng file test

```bash
cd backend
node test_vnpay.js
```

File này sẽ:

1. Tạo payment URL
2. Hiển thị link thanh toán
3. Query thông tin order vừa tạo

### Cách 2: Dùng Postman/curl

**Tạo payment:**

```bash
curl -X POST http://localhost:5000/api/vnpay/create_payment_url \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "orderDescription": "Test payment",
    "userId": "673900d8ee2bcbc1cd3a9999",
    "items": [{"name": "Test Item", "quantity": 1, "price": 50000}]
  }'
```

**Query order:**

```bash
curl http://localhost:5000/api/vnpay/order/673abc123def456789
```

## 💳 Thông tin test VNPay Sandbox

Để test thanh toán trên sandbox:

**Ngân hàng:** NCB  
**Số thẻ:** 9704198526191432198  
**Tên chủ thẻ:** NGUYEN VAN A  
**Ngày phát hành:** 07/15  
**Mật khẩu OTP:** 123456

## 🔄 Flow thanh toán

```
1. Frontend → POST /api/vnpay/create_payment_url
   ↓ Order được tạo với status="pending"

2. Frontend nhận paymentUrl và redirect user
   ↓

3. User thanh toán trên VNPay
   ↓

4. VNPay gọi IPN webhook (background)
   → Cập nhật order status
   ↓

5. VNPay redirect user về /api/vnpay/return
   → Verify signature
   → Cập nhật order (nếu chưa được IPN cập nhật)
   → Redirect về frontend
   ↓

6. Frontend hiển thị kết quả thanh toán
   → Query order details để hiển thị
```

## 📊 Order Schema

```javascript
{
  userId: ObjectId,           // User thực hiện thanh toán
  orderRef: String,           // Mã đơn hàng unique
  items: Array,               // Danh sách sản phẩm
  totalAmount: Number,        // Tổng tiền (VND)
  currency: String,           // Default: "VND"
  orderDescription: String,   // Mô tả đơn hàng

  status: String,             // pending | confirmed | processing | completed | cancelled | failed
  paymentMethod: String,      // vnpay | momo | cod | bank_transfer
  paymentStatus: String,      // pending | paid | failed | refunded
  paidAt: Date,              // Thời điểm thanh toán

  paymentInfo: Object,        // Thông tin từ VNPay (vnp_ResponseCode, vnp_TransactionNo, ...)

  shippingAddress: Object,    // Địa chỉ giao hàng (optional)
  notes: String,             // Ghi chú

  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Frontend Integration

### React Example

```javascript
// Tạo thanh toán
const handlePayment = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/vnpay/create_payment_url",
      {
        amount: 50000,
        orderDescription: "Gói Pro 1 tháng",
        userId: currentUser._id,
        items: [{ name: "Gói Pro", quantity: 1, price: 50000 }],
      }
    );

    // Redirect đến VNPay
    window.location.href = response.data.paymentUrl;
  } catch (error) {
    console.error("Payment error:", error);
  }
};

// Page success/failed
// URL: /payment/success?orderId=xxx
const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");

  useEffect(() => {
    // Query order details
    axios
      .get(`http://localhost:5000/api/vnpay/order/${orderId}`)
      .then((res) => {
        console.log("Order:", res.data.order);
      });
  }, [orderId]);

  return <div>✅ Thanh toán thành công!</div>;
};
```

## 🔐 Security Notes

1. **Hash Secret**: Không được commit VNP_HASH_SECRET vào git
2. **Signature Verification**: Luôn verify vnp_SecureHash từ VNPay
3. **IP Whitelist**: Production nên config IP whitelist trên VNPay dashboard
4. **HTTPS**: Production phải dùng HTTPS cho return_url và ipn_url

## 🐛 Troubleshooting

### Lỗi "97 - Invalid Signature"

- Kiểm tra VNP_HASH_SECRET
- Kiểm tra thứ tự sort params
- Kiểm tra encoding (dùng `+` thay vì `%20`)

### Lỗi "Order not found"

- Kiểm tra orderRef có khớp không
- Kiểm tra database connection

### IPN không được gọi

- Kiểm tra IPN_URL_PATH có đúng không
- Kiểm tra server có public access không (localhost không được)
- Test trên sandbox có thể không gọi IPN

## 📚 Tài liệu tham khảo

- [VNPay API Documentation](https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/)
- [VNPay Sandbox](https://sandbox.vnpayment.vn/)

## 🎉 Done!

Hệ thống VNPay đã sẵn sàng. Test và deploy!
