import crypto from "crypto";
import qs from "querystring";
import fs from "fs";
import path from "path";

// VNPay config via env
const VNP_TMN_CODE = process.env.VNP_TMN_CODE || "";
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || "";
const VNP_URL =
  process.env.VNP_PAYMENT_URL ||
  process.env.VNP_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL =
  process.env.VNP_RETURN_URL ||
  `http://localhost:${process.env.PORT || 5000}/api/payment/vnpay/return`;

export function hasVNPayConfig() {
  return Boolean(VNP_TMN_CODE && VNP_HASH_SECRET && VNP_URL);
}

export function getReturnUrl() {
  return VNP_RETURN_URL;
}

export function buildVNPayUrl({
  amount,
  orderInfo,
  orderType = "billpayment",
  bankCode = null,
  locale = "vn",
  ipAddr = "127.0.0.1",
  txnRef,
}) {
  const createDate = new Date();
  const y = createDate.getFullYear();
  const m = String(createDate.getMonth() + 1).padStart(2, "0");
  const d = String(createDate.getDate()).padStart(2, "0");
  const hh = String(createDate.getHours()).padStart(2, "0");
  const mm = String(createDate.getMinutes()).padStart(2, "0");
  const ss = String(createDate.getSeconds()).padStart(2, "0");
  const vnp_CreateDate = `${y}${m}${d}${hh}${mm}${ss}`;

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: amount * 100, // per VNPay spec: amount in VND * 100
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate,
  };

  if (bankCode) params.vnp_BankCode = bankCode;

  // Sort params alphabetically
  const sortedKeys = Object.keys(params).sort();
  // Use raw (un-encoded) values when building signData to match VNPay signing examples
  const signData = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");

  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const vnp_SecureHash = hmac
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  // Build query using encodeURIComponent for URL
  const query =
    sortedKeys.map((k) => `${k}=${encodeURIComponent(params[k])}`).join("&") +
    `&vnp_SecureHash=${vnp_SecureHash}`;
  return `${VNP_URL}?${query}`;
}

export function verifyVNPayReturn(params) {
  const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;
  const sortedKeys = Object.keys(rest).sort();

  // Build sign data using raw (unencoded) values for signature computation
  const signDataRaw = sortedKeys.map((k) => `${k}=${rest[k]}`).join("&");
  const signedRaw = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(Buffer.from(signDataRaw, "utf-8"))
    .digest("hex");

  // Also support encoded variant if needed
  const signDataEncoded = sortedKeys
    .map((k) => `${k}=${encodeURIComponent(rest[k])}`)
    .join("&");
  const signedEncoded = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(Buffer.from(signDataEncoded, "utf-8"))
    .digest("hex");

  const received = String(vnp_SecureHash || "").toLowerCase();
  const s1 = String(signedRaw || "").toLowerCase();
  const s2 = String(signedEncoded || "").toLowerCase();

  const ok = received === s1 || received === s2;

  if (!ok && process.env.NODE_ENV !== "production") {
    const info = {
      time: new Date().toISOString(),
      received: vnp_SecureHash,
      computed_raw: signedRaw,
      computed_encoded: signedEncoded,
      signDataRaw,
      signDataEncoded,
      env: {
        VNP_TMN_CODE,
        VNP_URL,
      },
    };
    console.error(
      "\n=== VNPAY Signature MISMATCH ===\n",
      JSON.stringify(info, null, 2),
      "\n=== END ===\n"
    );
    try {
      const logDir = path.join(process.cwd(), "backend", "logs");
      fs.mkdirSync(logDir, { recursive: true });
      const logPath = path.join(logDir, "vnpay-signature.log");
      fs.appendFileSync(logPath, JSON.stringify(info) + "\n");
    } catch (e) {
      console.error("Failed to write VNPAY signature log", e);
    }
  }

  return ok;
}
