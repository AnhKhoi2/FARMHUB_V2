// Test VNPay Payment Integration
// Chạy file này để test API thanh toán VNPay

const axios = require("axios");

const API_URL = "http://localhost:5000/api/vnpay";

// 1️⃣ Test tạo payment URL
async function testCreatePayment() {
  try {
    console.log("\n🧪 Testing Create Payment URL...\n");

    const response = await axios.post(`${API_URL}/create_payment_url`, {
      amount: 50000, // 50,000 VND
      orderDescription: "Test thanh toan VNPay",
      userId: "673900d8ee2bcbc1cd3a9999", // Thay bằng userId thật từ DB
      items: [
        {
          name: "Gói Pro 1 tháng",
          quantity: 1,
          price: 50000,
        },
      ],
    });

    console.log("✅ Response:", response.data);
    console.log("\n🔗 Payment URL:");
    console.log(response.data.paymentUrl);
    console.log("\n📋 Mở link trên để thanh toán test");
    console.log("\n💳 Thông tin test VNPay:");
    console.log("   - Ngân hàng: NCB");
    console.log("   - Số thẻ: 9704198526191432198");
    console.log("   - Tên: NGUYEN VAN A");
    console.log("   - Ngày phát hành: 07/15");
    console.log("   - OTP: 123456");

    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// 2️⃣ Test query order status
async function testGetOrder(orderId) {
  try {
    console.log("\n🧪 Testing Get Order Status...\n");

    const response = await axios.get(`${API_URL}/order/${orderId}`);

    console.log("✅ Order Details:");
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// 3️⃣ Test get user orders
async function testGetUserOrders(userId) {
  try {
    console.log("\n🧪 Testing Get User Orders...\n");

    const response = await axios.get(`${API_URL}/orders/user/${userId}`, {
      params: {
        limit: 10,
        page: 1,
      },
    });

    console.log("✅ User Orders:");
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
  }
}

// 🚀 Chạy tests
async function runTests() {
  console.log("========================================");
  console.log("   VNPay Payment Integration Test");
  console.log("========================================");

  // Test 1: Tạo payment URL
  const paymentData = await testCreatePayment();

  if (paymentData && paymentData.orderId) {
    // Đợi một chút trước khi test
    console.log("\n⏳ Đợi 2 giây...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 2: Query order
    await testGetOrder(paymentData.orderId);

    // Test 3: Get user orders (dùng userId từ test create payment)
    // await testGetUserOrders("673900d8ee2bcbc1cd3a9999");
  }

  console.log("\n========================================");
  console.log("   Test Completed!");
  console.log("========================================\n");
}

// Chạy tests
runTests();
