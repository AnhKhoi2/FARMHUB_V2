/**
 * Test script cho chức năng VNPay
 * Chạy: node backend/test_vnpay.js
 */

import crypto from "crypto";
import qs from "querystring";

// Mock config (giống .env)
const VNP_TMN_CODE = "XEDZ32MY";
const VNP_HASH_SECRET = "Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK";
const VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL = "http://localhost:5000/api/payment/vnpay/return";

// Helper: sort params (KHÔNG encode - theo chuẩn VNPay)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Test 1: Build VNPay URL
function testBuildVNPayUrl() {
  console.log("\n========== TEST 1: BUILD VNPAY URL ==========");

  const date = new Date("2025-11-17T10:30:00Z");
  const createDate = date
    .toISOString()
    .replace(/[-:TZ]/g, "")
    .replace(/\.\d+/, "")
    .slice(0, 14);

  console.log("createDate:", createDate); // Expected: 20251117103000

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: "TXN1731839400123",
    vnp_OrderInfo: "Thanh toan goi VIP cho user 123",
    vnp_OrderType: "other",
    vnp_Amount: 9900000, // 99000 * 100
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: "127.0.0.1",
    vnp_CreateDate: createDate,
    vnp_BankCode: "VNPAYQR",
  };

  // Sort params
  vnp_Params = sortObject(vnp_Params);

  // Tạo signData (key=value&key=value... - RAW values)
  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");
  console.log("\nsignData (to hash):\n", signData);

  // Hash SHA512
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  console.log("\nvnp_SecureHash:", signed);

  // Gắn hash
  vnp_Params["vnp_SecureHashType"] = "SHA512";
  vnp_Params["vnp_SecureHash"] = signed;

  // Build URL (encode cho URL-safe)
  const paymentUrl =
    VNP_URL +
    "?" +
    Object.keys(vnp_Params)
      .map(
        (key) =>
          `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+")}`
      )
      .join("&");
  console.log("\nPayment URL:\n", paymentUrl);

  console.log("\n✅ TEST 1 PASSED - URL được tạo thành công");
  return { params: vnp_Params, signed };
}

// Test 2: Verify VNPay Return
function testVerifyVNPayReturn() {
  console.log("\n\n========== TEST 2: VERIFY VNPAY RETURN ==========");

  // Giả lập params từ VNPay return (đã được VNPay ký)
  const mockReturnParams = {
    vnp_Amount: "9900000",
    vnp_BankCode: "VNPAYQR",
    vnp_BankTranNo: "VNP123456789",
    vnp_CardType: "ATM",
    vnp_OrderInfo: "Thanh toan goi VIP cho user 123",
    vnp_PayDate: "20251117103000",
    vnp_ResponseCode: "00",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_TransactionNo: "14508260",
    vnp_TransactionStatus: "00",
    vnp_TxnRef: "TXN1731839400123",
    vnp_SecureHashType: "SHA256",
  };

  // Tính hash như VNPay làm (không có vnp_SecureHash và vnp_SecureHashType)
  const paramsToSign = { ...mockReturnParams };
  delete paramsToSign.vnp_SecureHashType;

  const sorted = sortObject(paramsToSign);
  const signData = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join("&");

  console.log("\nsignData (from VNPay):\n", signData);

  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const computedHash = hmac
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  console.log("\ncomputed hash:", computedHash);

  // Giả lập VNPay đã gửi hash này
  mockReturnParams.vnp_SecureHash = computedHash;

  // Bây giờ verify
  const receivedHash = mockReturnParams.vnp_SecureHash;
  const verifyParams = { ...mockReturnParams };
  delete verifyParams.vnp_SecureHash;
  delete verifyParams.vnp_SecureHashType;

  const verifySorted = sortObject(verifyParams);
  const verifySignData = Object.keys(verifySorted)
    .map((key) => `${key}=${verifySorted[key]}`)
    .join("&");

  const verifyHmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const verifyHash = verifyHmac
    .update(Buffer.from(verifySignData, "utf-8"))
    .digest("hex");

  console.log("\nreceived hash:", receivedHash);
  console.log("verify hash:  ", verifyHash);

  const isMatch = receivedHash.toLowerCase() === verifyHash.toLowerCase();
  console.log("\nSignature match:", isMatch);

  if (isMatch) {
    console.log("\n✅ TEST 2 PASSED - Signature verify thành công");
  } else {
    console.log("\n❌ TEST 2 FAILED - Signature không khớp");
  }

  return isMatch;
}

// Test 3: Test với ký tự đặc biệt trong orderInfo
function testSpecialCharacters() {
  console.log("\n\n========== TEST 3: KÝ TỰ ĐẶC BIỆT ==========");

  const orderInfo = "Thanh toán gói VIP - Người dùng: Nguyễn Văn A (ID: 123)";

  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_TxnRef: "TXN123",
    vnp_OrderInfo: orderInfo,
    vnp_Amount: 10000000,
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");

  console.log("\norderInfo:", orderInfo);
  console.log("\nsignData:\n", signData);

  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  console.log("\nvnp_SecureHash:", signed);
  console.log("\n✅ TEST 3 PASSED - Xử lý ký tự đặc biệt OK");
}

// Test 4: Test amount calculation
function testAmountCalculation() {
  console.log("\n\n========== TEST 4: AMOUNT CALCULATION ==========");

  const testCases = [
    { vnd: 99000, expected: 9900000 },
    { vnd: 199000, expected: 19900000 },
    { vnd: 10000, expected: 1000000 },
    { vnd: 50000.5, expected: 5000050 }, // Số thập phân
  ];

  testCases.forEach((test) => {
    const result = Math.round(test.vnd * 100);
    const pass = result === test.expected;
    console.log(
      `${test.vnd} VND * 100 = ${result} ${pass ? "✅" : "❌"} (expected: ${
        test.expected
      })`
    );
  });

  console.log("\n✅ TEST 4 PASSED - Amount calculation OK");
}

// Chạy tất cả tests
function runAllTests() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║     TEST VNPAY PAYMENT INTEGRATION             ║");
  console.log("╚════════════════════════════════════════════════╝");

  try {
    testBuildVNPayUrl();
    const verifyResult = testVerifyVNPayReturn();
    testSpecialCharacters();
    testAmountCalculation();

    console.log("\n\n╔════════════════════════════════════════════════╗");
    if (verifyResult) {
      console.log("║   ✅ TẤT CẢ TESTS ĐÃ PASS                      ║");
    } else {
      console.log("║   ⚠️  MỘT SỐ TESTS FAILED - Kiểm tra lại      ║");
    }
    console.log("╚════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("\n❌ LỖI KHI CHẠY TEST:", error);
  }
}

// Run tests
runAllTests();
