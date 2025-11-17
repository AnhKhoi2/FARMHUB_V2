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

// Helper: sort params theo thứ tự alphabet (KHÔNG encode - VNPay yêu cầu hash RAW values)
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key]; // GIỮ NGUYÊN giá trị, KHÔNG encode
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

  // B3: Tạo chuỗi để ký (key=value&key=value... - RAW values)
  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");

  // B4: Hash (VNPay hỗ trợ cả SHA512 và SHA256 - thử SHA256 nếu SHA512 lỗi)
  // Một số merchant sandbox chỉ dùng SHA256
  const hashType = process.env.VNP_HASH_TYPE || "SHA512";
  const hmac = crypto.createHmac(
    hashType.toLowerCase() === "sha256" ? "sha256" : "sha512",
    VNP_HASH_SECRET
  );
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // B5: Gắn hash type và hash
  vnp_Params["vnp_SecureHashType"] = hashType;
  vnp_Params["vnp_SecureHash"] = signed;

  // B6: Tạo URL thanh toán (encode URL-safe)
  const paymentUrl =
    VNP_URL +
    "?" +
    Object.keys(vnp_Params)
      .map(
        (key) =>
          `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+")}`
      )
      .join("&");

  // Debug log in non-production
  if (process.env.NODE_ENV !== "production") {
    console.log("\n----- VNPay BUILD URL DEBUG START -----");
    console.log("Hash Type:", hashType);
    console.log("VNP_TMN_CODE:", VNP_TMN_CODE);
    console.log(
      "VNP_HASH_SECRET:",
      VNP_HASH_SECRET
        ? `${VNP_HASH_SECRET.substring(0, 4)}...${VNP_HASH_SECRET.substring(
            VNP_HASH_SECRET.length - 4
          )}`
        : "EMPTY"
    );
    console.log("VNP_HASH_SECRET length:", VNP_HASH_SECRET.length);
    console.log("\nParams to sign:");
    console.log(JSON.stringify(vnp_Params, null, 2));
    console.log("\nSignData (RAW):");
    console.log(signData);
    console.log("\nComputed Hash:");
    console.log(signed);
    console.log("\nFull Payment URL:");
    console.log(paymentUrl);
    console.log("----- VNPay BUILD URL DEBUG END -----\n");
  }

  return paymentUrl;
}

export function verifyVNPayReturn(params) {
  let vnp_Params = { ...params };

  const receivedHash = vnp_Params.vnp_SecureHash;
  // Capture hash type sent by VNPay (if any) - prefer that, otherwise fall back to env
  const receivedHashType = vnp_Params.vnp_SecureHashType;
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  // Sort params (RAW values) per VNPay spec
  vnp_Params = sortObject(vnp_Params);
  const signData = Object.keys(vnp_Params)
    .map((key) => `${key}=${vnp_Params[key]}`)
    .join("&");

  // Use hash type from VNPay response when available, else environment default
  const hashType = (
    receivedHashType ||
    process.env.VNP_HASH_TYPE ||
    "SHA512"
  ).toUpperCase();
  const algo = hashType === "SHA256" ? "sha256" : "sha512";
  const hmac = crypto.createHmac(algo, VNP_HASH_SECRET);
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
