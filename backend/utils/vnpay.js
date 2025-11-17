import crypto from "crypto";
import qs from "querystring";
import fs from "fs";
import path from "path";

// VNPay config via env
const VNP_TMN_CODE = (process.env.VNP_TMN_CODE || "").trim();
const VNP_HASH_SECRET = (process.env.VNP_HASH_SECRET || "").trim();
const VNP_URL =
  process.env.VNP_PAYMENT_URL ||
  process.env.VNP_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const VNP_RETURN_URL = (
  process.env.VNP_RETURN_URL ||
  `http://localhost:${process.env.PORT || 5000}/api/payment/vnpay/return`
).trim();

// Helper: sort và encode params chuẩn VNPay
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

export function hasVNPayConfig() {
  return Boolean(VNP_TMN_CODE && VNP_HASH_SECRET && VNP_URL);
}

export function getReturnUrl() {
  return VNP_RETURN_URL;
}

export function buildVNPayUrl({
  amount,
  orderInfo,
  orderType = "other",
  bankCode = null,
  locale = "vn",
  ipAddr = "127.0.0.1",
  txnRef,
}) {
  const date = new Date();
  const createDate = date
    .toISOString()
    .replace(/[-:TZ]/g, "")
    .replace(/\.\d+/, "")
    .slice(0, 14);

  // Chuẩn hóa IP address (xử lý ::1 -> 127.0.0.1)
  let vnp_IpAddr = ipAddr || "127.0.0.1";
  if (vnp_IpAddr.includes("::1") || vnp_IpAddr.includes("::ffff:")) {
    vnp_IpAddr = "127.0.0.1";
  }

  // B1: Tạo params (chưa encode)
  let vnp_Params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: Math.round(amount * 100), // ⚠️ VNPay yêu cầu nhân 100
    vnp_ReturnUrl: VNP_RETURN_URL,
    vnp_IpAddr: vnp_IpAddr,
    vnp_CreateDate: createDate,
  };

  if (bankCode) vnp_Params.vnp_BankCode = bankCode;

  // B2: Sort & encode chuẩn
  vnp_Params = sortObject(vnp_Params);

  // B3: Tạo chuỗi để ký (RAW values sau khi encode)
  const signData = qs.stringify(vnp_Params, { encode: false });

  // B4: Hash SHA512
  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // B5: Gắn hash type và hash
  vnp_Params["vnp_SecureHashType"] = "SHA512";
  vnp_Params["vnp_SecureHash"] = signed;

  // B6: Tạo URL thanh toán
  const paymentUrl =
    VNP_URL + "?" + qs.stringify(vnp_Params, { encode: false });

  // Debug log in non-production
  if (process.env.NODE_ENV !== "production") {
    console.log("----- VNPay BUILD URL DEBUG START -----");
    console.log("vnp_Params (sorted & encoded):", vnp_Params);
    console.log("signData (to hash):", signData);
    console.log("computed vnp_SecureHash:", signed);
    console.log("paymentUrl:", paymentUrl);
    console.log("VNP_TMN_CODE:", VNP_TMN_CODE);
    console.log("VNP_HASH_SECRET length:", VNP_HASH_SECRET.length);
    console.log("----- VNPay BUILD URL DEBUG END -----");
  }

  return paymentUrl;
}

export function verifyVNPayReturn(params) {
  let vnp_Params = { ...params };

  const receivedHash = vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  // Sort & encode params chuẩn VNPay
  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });

  const hmac = crypto.createHmac("sha512", VNP_HASH_SECRET);
  const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const received = String(receivedHash || "").toLowerCase();
  const computed = String(checkHash || "").toLowerCase();

  const ok = received === computed;

  // Debug log
  if (process.env.NODE_ENV !== "production") {
    console.log("----- VNPay RETURN VERIFY DEBUG -----");
    console.log("signData (from VNPay):", signData);
    console.log("computed hash:", checkHash);
    console.log("received hash:", receivedHash);
    console.log("Match:", ok);
    console.log("-----------------------------");
  }

  if (!ok) {
    const info = {
      time: new Date().toISOString(),
      received: receivedHash,
      computed: checkHash,
      signData,
      params: vnp_Params,
      env: {
        VNP_TMN_CODE,
        VNP_URL,
        VNP_HASH_SECRET_LENGTH: VNP_HASH_SECRET.length,
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
