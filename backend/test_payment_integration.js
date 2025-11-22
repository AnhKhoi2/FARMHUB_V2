/**
 * Test script cho payment flow integration
 * Chạy: node backend/test_payment_integration.js
 *
 * Script này test toàn bộ flow:
 * 1. Tạo payment request
 * 2. Build VNPay URL
 * 3. Verify params đúng format
 */

import { buildVNPayUrl, verifyVNPayReturn } from "./utils/vnpay.js";

console.log("╔════════════════════════════════════════════════╗");
console.log("║   TEST PAYMENT FLOW INTEGRATION                ║");
console.log("╚════════════════════════════════════════════════╝\n");

// Simulate payment creation for "smart" plan (vip)
console.log("========== TEST 1: SMART PLAN (VIP) ==========");
const smartPayment = {
  plan: "vip",
  amount: 99000,
  userId: "test_user_123",
  txnRef: "TXN" + Date.now(),
};

console.log("Plan:", smartPayment.plan);
console.log("Amount:", smartPayment.amount, "VNĐ");
console.log("Amount for VNPay:", smartPayment.amount * 100, "(* 100)");

const smartUrl = buildVNPayUrl({
  amount: smartPayment.amount,
  orderInfo: `Thanh toan goi ${smartPayment.plan} cho user ${smartPayment.userId}`,
  txnRef: smartPayment.txnRef,
  ipAddr: "127.0.0.1",
  bankCode: "VNPAYQR",
});

console.log("\nPayment URL created:");
console.log(smartUrl);
console.log("\n✅ SMART PLAN URL - OK\n");

// Simulate payment creation for "pro" plan
console.log("\n========== TEST 2: PRO PLAN ==========");
const proPayment = {
  plan: "pro",
  amount: 199000,
  userId: "test_user_456",
  txnRef: "TXN" + (Date.now() + 1000),
};

console.log("Plan:", proPayment.plan);
console.log("Amount:", proPayment.amount, "VNĐ");
console.log("Amount for VNPay:", proPayment.amount * 100, "(* 100)");

const proUrl = buildVNPayUrl({
  amount: proPayment.amount,
  orderInfo: `Thanh toan goi ${proPayment.plan} cho user ${proPayment.userId}`,
  txnRef: proPayment.txnRef,
  ipAddr: "127.0.0.1",
  bankCode: "VNPAYQR",
});

console.log("\nPayment URL created:");
console.log(proUrl);
console.log("\n✅ PRO PLAN URL - OK\n");

// Verify URL format
console.log("\n========== TEST 3: VERIFY URL FORMAT ==========");

function validateVNPayUrl(url) {
  const requiredParams = [
    "vnp_Amount",
    "vnp_Command",
    "vnp_TmnCode",
    "vnp_TxnRef",
    "vnp_OrderInfo",
    "vnp_ReturnUrl",
    "vnp_SecureHash",
  ];

  const urlObj = new URL(url);
  const params = Object.fromEntries(urlObj.searchParams);

  console.log("Checking required params...");
  let allPresent = true;

  requiredParams.forEach((param) => {
    const present = params.hasOwnProperty(param);
    console.log(`  ${param}: ${present ? "✅" : "❌"}`);
    if (!present) allPresent = false;
  });

  console.log("\nParams values:");
  console.log("  vnp_Amount:", params.vnp_Amount);
  console.log("  vnp_TxnRef:", params.vnp_TxnRef);
  console.log("  vnp_OrderInfo:", decodeURIComponent(params.vnp_OrderInfo));
  console.log("  vnp_SecureHash length:", params.vnp_SecureHash?.length);

  return allPresent;
}

const smartValid = validateVNPayUrl(smartUrl);
console.log("\nSmart plan URL validation:", smartValid ? "✅ PASS" : "❌ FAIL");

console.log("\n---\n");

const proValid = validateVNPayUrl(proUrl);
console.log("\nPro plan URL validation:", proValid ? "✅ PASS" : "❌ FAIL");

// Test plan aliases
console.log("\n\n========== TEST 4: PLAN ALIASES ==========");

const PLAN_ALIASES = { smart: "vip" };
const PLAN_PRICES = { vip: 99000, pro: 199000 };

const testPlans = ["smart", "vip", "pro", "basic"];

testPlans.forEach((planKey) => {
  const normalizedPlan = PLAN_ALIASES[planKey] || planKey;
  const price = PLAN_PRICES[normalizedPlan];

  console.log(
    `Plan "${planKey}" → "${normalizedPlan}" → ${
      price ? price + " VNĐ" : "NOT FOUND"
    } ${price ? "✅" : "❌"}`
  );
});

// Summary
console.log("\n\n╔════════════════════════════════════════════════╗");
if (smartValid && proValid) {
  console.log("║   ✅ ALL INTEGRATION TESTS PASSED              ║");
} else {
  console.log("║   ❌ SOME TESTS FAILED                         ║");
}
console.log("╚════════════════════════════════════════════════╝\n");

console.log("📝 NEXT STEPS:");
console.log("1. Start backend: cd backend && npm start");
console.log("2. Start frontend: cd frontend/web && npm run dev");
console.log("3. Navigate to: http://localhost:5173/pricing");
console.log('4. Click "Nâng cấp lên Thông Minh" or "Nâng cấp lên Chuyên Gia"');
console.log("5. Check console logs and verify redirect to VNPay\n");
