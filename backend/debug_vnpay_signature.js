/**
 * DEBUG SCRIPT - Kiểm tra lỗi "Sai chữ ký" VNPay
 * Chạy: node backend/debug_vnpay_signature.js
 */

import crypto from "crypto";

console.log("╔════════════════════════════════════════════════╗");
console.log("║   DEBUG VNPAY SIGNATURE ERROR                  ║");
console.log("╚════════════════════════════════════════════════╝\n");

// Config từ .env
const VNP_TMN_CODE = "XEDZ32MY";
const VNP_HASH_SECRET = "Z8O3ARTA2AVK1H5HR5I60FRLMGSMF8MK";
const VNP_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL = "http://localhost:5000/api/payment/vnpay/return";

console.log("========== CONFIG CHECK ==========");
console.log("VNP_TMN_CODE:", VNP_TMN_CODE);
console.log("VNP_HASH_SECRET:", VNP_HASH_SECRET);
console.log("VNP_HASH_SECRET length:", VNP_HASH_SECRET.length);
console.log("VNP_URL:", VNP_URL);
console.log("VNP_RETURN_URL:", VNP_RETURN_URL);

// Kiểm tra có khoảng trắng thừa không
if (VNP_TMN_CODE !== VNP_TMN_CODE.trim()) {
  console.log("⚠️ WARNING: VNP_TMN_CODE có khoảng trắng thừa!");
}
if (VNP_HASH_SECRET !== VNP_HASH_SECRET.trim()) {
  console.log("⚠️ WARNING: VNP_HASH_SECRET có khoảng trắng thừa!");
}

console.log("\n========== TEST BUILD URL ==========");

// Tạo params giống như production
const date = new Date();
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, "0");
const d = String(date.getDate()).padStart(2, "0");
const hh = String(date.getHours()).padStart(2, "0");
const mm = String(date.getMinutes()).padStart(2, "0");
const ss = String(date.getSeconds()).padStart(2, "0");
const createDate = `${y}${m}${d}${hh}${mm}${ss}`;

let vnp_Params = {
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_TmnCode: VNP_TMN_CODE,
  vnp_Locale: "vn",
  vnp_CurrCode: "VND",
  vnp_TxnRef: "TEST" + Date.now(),
  vnp_OrderInfo: "Thanh toan goi vip cho user test",
  vnp_OrderType: "other",
  vnp_Amount: 9900000, // 99000 * 100
  vnp_ReturnUrl: VNP_RETURN_URL,
  vnp_IpAddr: "127.0.0.1",
  vnp_CreateDate: createDate,
  vnp_BankCode: "VNPAYQR",
};

console.log("\n1. PARAMS (chưa sort):");
console.log(JSON.stringify(vnp_Params, null, 2));

// Sort params
const sortedKeys = Object.keys(vnp_Params).sort();
const sortedParams = {};
sortedKeys.forEach((key) => {
  sortedParams[key] = vnp_Params[key];
});

console.log("\n2. PARAMS (đã sort theo alphabet):");
console.log(JSON.stringify(sortedParams, null, 2));

// Build signData
const signData = sortedKeys.map((k) => `${k}=${sortedParams[k]}`).join("&");

console.log("\n3. SIGN DATA (chuỗi dùng để hash):");
console.log(signData);
console.log("\nLength:", signData.length);

// Hash SHA512
const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
const vnp_SecureHash = hmac
  .update(Buffer.from(signData, "utf-8"))
  .digest("hex");

console.log("\n4. SECURE HASH (SHA512):");
console.log(vnp_SecureHash);
console.log("Length:", vnp_SecureHash.length);

// Build final URL
sortedParams.vnp_SecureHash = vnp_SecureHash;

const urlParams = Object.keys(sortedParams)
  .map(
    (key) =>
      `${key}=${encodeURIComponent(sortedParams[key]).replace(/%20/g, "+")}`
  )
  .join("&");

const paymentUrl = VNP_URL + "?" + urlParams;

console.log("\n5. FINAL PAYMENT URL:");
console.log(paymentUrl);

console.log("\n========== CHECK THEO DOCS VNPAY ==========");

// Theo docs VNPay, các param BẮT BUỘC:
const requiredParams = [
  "vnp_Version",
  "vnp_Command",
  "vnp_TmnCode",
  "vnp_Amount",
  "vnp_CurrCode",
  "vnp_TxnRef",
  "vnp_OrderInfo",
  "vnp_OrderType",
  "vnp_Locale",
  "vnp_ReturnUrl",
  "vnp_IpAddr",
  "vnp_CreateDate",
];

console.log("\nKiểm tra params bắt buộc:");
requiredParams.forEach((param) => {
  const exists = sortedParams.hasOwnProperty(param);
  console.log(`  ${param}: ${exists ? "✅" : "❌ THIẾU"}`);
});

console.log("\n========== CÁCH FIX ==========");
console.log(`
1. Kiểm tra VNP_TMN_CODE và VNP_HASH_SECRET có đúng không
   - Đăng nhập VNPay sandbox: https://sandbox.vnpayment.vn/
   - Vào Cấu hình > Thông tin merchant
   - Copy CHÍNH XÁC TMN_CODE và HASH_SECRET

2. Nếu vẫn lỗi, có thể do:
   - VNP_HASH_SECRET đang dùng sai (SHA256 vs SHA512)
   - Params bị encode sai
   - Thứ tự sort sai

3. Test với URL này trên browser xem có lỗi gì:
`);
console.log(paymentUrl);

console.log("\n========== SO SÁNH VỚI DOCS VNPAY ==========");
console.log(`
Theo docs VNPay, signData PHẢI có format:
key1=value1&key2=value2&key3=value3

VÍ DỤ từ docs:
vnp_Amount=1000000&vnp_BankCode=NCB&vnp_Command=pay&...

So sánh với signData của bạn:
${signData.substring(0, 100)}...

Nếu format đúng → lỗi ở HASH_SECRET
Nếu format sai → lỗi ở cách build signData
`);

console.log("\n╔════════════════════════════════════════════════╗");
console.log("║   DEBUG HOÀN TẤT - Kiểm tra output trên      ║");
console.log("╚════════════════════════════════════════════════╝\n");
