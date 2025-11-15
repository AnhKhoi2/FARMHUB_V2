import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import User from "../models/User.js";

const tmnCode = process.env.VNP_TMN_CODE;
const secretKey = process.env.VNP_HASH_SECRET;
const vnpUrl =
  process.env.VNP_PAYMENT_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

const PLAN_PRICES = { vip: 99000, pro: 199000 };
const PLAN_DURATIONS = { vip: 30, pro: 30 };
// frontend uses 'smart' for mid-tier — map it to internal 'vip'
const PLAN_ALIASES = { smart: "vip" };

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
export const createPaymentUrl = async (req, res) => {
  try {
    const ipAddr =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

    // Prefer user id from authenticated token; fallback to body for compatibility
    const {
      amount: rawAmount,
      bankCode,
      plan: rawPlan,
      baseUrl,
      returnUrl,
    } = req.body;
    const userId = req.user?.id || req.user?._id || req.body.userId;

    if (!userId)
      return res
        .status(401)
        .json({ code: 1, message: "Unauthorized: user not found" });

    // normalize plan (support frontend names like 'smart')
    const plan = PLAN_ALIASES[rawPlan] || rawPlan;

    if (!plan || !Object.keys(PLAN_PRICES).includes(plan))
      return res.status(400).json({
        code: 1,
        message: `plan is required (${Object.keys(PLAN_PRICES).join("|")})`,
      });

    const amount = Number(rawAmount) || PLAN_PRICES[plan] || 10000;

    const createDate = moment().format("YYYYMMDDHHmmss");

    // Use a stable txnRef (objectId string) so we can lookup later
    const txnRef = new mongoose.Types.ObjectId().toString();

    // Persist a pending payment record
    const payment = await Payment.create({
      userId,
      plan,
      amount,
      vnpTxnRef: txnRef,
      status: "pending",
    });

    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: `Thanh toan ${plan} cho user ${userId}`,
      vnp_OrderType: "other",
      vnp_Amount: amount * 100, // VNPAY yêu cầu *100
      vnp_ReturnUrl:
        returnUrl ||
        `${baseUrl || ""}${process.env.RETURN_URL_PATH || "/vnpay_return"}`,
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
    return res.json({
      code: 0,
      message: "OK",
      data: { paymentId: payment._id, paymentUrl },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ code: 1, message: "Internal error" });
  }
};

// IPN (VNPAY gọi tới)
export const vnpIpn = async (req, res) => {
  try {
    let vnp_Params = { ...req.query };

    const secureHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // Compare signatures case-insensitively to tolerate VNPay uppercase/lowercase differences
    if (secureHash && secureHash.toLowerCase() === signed.toLowerCase()) {
      const rspCode = vnp_Params.vnp_ResponseCode;
      const orderId = vnp_Params.vnp_TxnRef;

      const payment = await Payment.findOne({ vnpTxnRef: orderId });
      if (!payment) {
        console.warn("Payment not found for txn", orderId);
        return res.json({ RspCode: "00", Message: "No such order" });
      }

      payment.vnpResponseCode = rspCode;
      payment.vnpTransactionNo = vnp_Params.vnp_TransactionNo;
      payment.vnpBankCode = vnp_Params.vnp_BankCode;
      payment.vnpPayDate = vnp_Params.vnp_PayDate;

      if (rspCode === "00") {
        payment.status = "success";
        await payment.save();

        // Grant subscription if applicable
        try {
          const user = await User.findById(payment.userId);
          if (user) {
            const now = new Date();
            const base =
              user.subscriptionExpires && user.subscriptionExpires > now
                ? new Date(user.subscriptionExpires)
                : now;
            base.setDate(base.getDate() + (PLAN_DURATIONS[payment.plan] || 30));
            user.subscriptionPlan = payment.plan;
            user.subscriptionExpires = base;
            await user.save();
          }
        } catch (e) {
          console.warn("Failed to update user subscription", e);
        }

        console.log("VNPAY IPN success for order", orderId);
        return res.json({ RspCode: "00", Message: "Success" });
      } else {
        payment.status = "failed";
        await payment.save();
        console.log("VNPAY IPN failed", vnp_Params);
        return res.json({ RspCode: "00", Message: "Payment failed" });
      }
    } else {
      // Debug info to help diagnose signature mismatch (only in non-production)
      if (process.env.NODE_ENV !== "production") {
        console.warn("Invalid VNPAY signature", {
          receivedSecureHash: secureHash,
          computedSecureHash: signed,
          signData,
          params: vnp_Params,
        });
      } else {
        console.warn("Invalid VNPAY signature");
      }
      return res.json({ RspCode: "97", Message: "Invalid signature" });
    }
  } catch (err) {
    console.error(err);
    return res.json({ RspCode: "99", Message: "Internal error" });
  }
};
