import qs from "qs";
import crypto from "crypto";
import moment from "moment";

const tmnCode = process.env.VNP_TMN_CODE;
const secretKey = process.env.VNP_HASH_SECRET;
const vnpUrl =
  process.env.VNP_PAYMENT_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

// Create payment URL
export const createPaymentUrl = (req, res) => {
  try {
    const ipAddr =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;
    const amount = Number(req.body.amount) || 10000; // VND
    const bankCode = req.body.bankCode || null;

    const createDate = moment().format("YYYYMMDDHHmmss");
    const orderId = moment().format("DDHHmmss"); // simple txn ref; replace with DB id if needed

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // VNPAY yêu cầu *100
      vnp_ReturnUrl:
        req.body.returnUrl ||
        `${req.body.baseUrl || ""}${
          process.env.RETURN_URL_PATH || "/vnpay_return"
        }`,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params.vnp_BankCode = bankCode;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnp_Params.vnp_SecureHash = signed;

    const paymentUrl =
      vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });
    return res.json({ code: 0, message: "OK", data: { paymentUrl } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ code: 1, message: "Internal error" });
  }
};

// IPN (VNPAY gọi tới)
export const vnpIpn = (req, res) => {
  try {
    let vnp_Params = { ...req.query };

    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    if (secureHash === signed) {
      const rspCode = vnp_Params.vnp_ResponseCode;
      const orderId = vnp_Params.vnp_TxnRef;
      if (rspCode === "00") {
        // TODO: cập nhật DB: orderId = PAID
        console.log("VNPAY IPN success for order", orderId);
        return res.json({ RspCode: "00", Message: "Success" });
      } else {
        console.log("VNPAY IPN failed", vnp_Params);
        return res.json({ RspCode: "00", Message: "Payment failed" });
      }
    } else {
      console.warn("Invalid VNPAY signature");
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }
  } catch (err) {
    console.error(err);
    return res.json({ RspCode: "99", Message: "Internal error" });
  }
};
