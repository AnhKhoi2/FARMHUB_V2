import qs from "qs";
import crypto from "crypto";
import moment from "moment";
import mongoose from "mongoose";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";
import { BadRequest, Forbidden } from "../utils/ApiError.js";
import {
  buildVNPayUrl,
  verifyVNPayReturn,
  hasVNPayConfig,
  getReturnUrl,
} from "../utils/vnpay.js";

const PLAN_PRICES = { vip: 99000, pro: 199000 }; // VND per month (example)
const PLAN_DURATIONS = { vip: 30, pro: 30 }; // days
const PLAN_ALIASES = { smart: "vip" };

const tmnCode = process.env.VNP_TMN_CODE;
const secretKey = process.env.VNP_HASH_SECRET;
const vnpUrl =
  process.env.VNP_PAYMENT_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function makeTxnRef() {
  return "TXN" + Date.now() + Math.floor(Math.random() * 1000);
}

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
}

export const paymentController = {
  // POST /payments/vnpay/create { plan, bankCode }
  createVNPay: asyncHandler(async (req, res) => {
    const { plan, bankCode } = req.body;
    if (!["vip", "pro"].includes(plan)) throw BadRequest("Plan không hợp lệ");

    const userId = req.user?.id;
    const amount = PLAN_PRICES[plan];

    const txnRef = makeTxnRef();
    const orderInfo = `Thanh toan goi ${plan.toUpperCase()} cho user ${userId}`;

    let payUrl;
    if (hasVNPayConfig()) {
      // Force VNPay QR unless explicitly overridden
      payUrl = buildVNPayUrl({
        amount,
        orderInfo,
        txnRef,
        ipAddr: req.ip || req.connection?.remoteAddress,
        bankCode: bankCode || "VNPAYQR",
      });
    } else {
      // Mock payUrl: immediately redirect to return endpoint with success codes
      const baseReturn = getReturnUrl();
      const mockParams = new URLSearchParams({
        mock: "1",
        vnp_TxnRef: txnRef,
        vnp_ResponseCode: "00",
        vnp_TransactionNo: "MOCKTXN" + Date.now(),
        vnp_BankCode: bankCode || "VNPAYQR",
        vnp_PayDate: new Date()
          .toISOString()
          .replace(/[-:TZ]/g, "")
          .slice(0, 14),
      }).toString();
      payUrl = `${baseReturn}?${mockParams}`;
    }

    const payment = await Payment.create({
      userId,
      plan,
      amount,
      vnpTxnRef: txnRef,
      status: "pending",
    });
    return created(res, { paymentId: payment._id, payUrl });
  }),

  // GET /payments/vnpay/return (VNPay will redirect here with query params)
  vnpayReturn: asyncHandler(async (req, res) => {
    const params = req.query || {};
    const isMock = params.mock === "1";
    const verified = isMock ? true : verifyVNPayReturn(params);
    const txnRef = params.vnp_TxnRef;
    const rspCode = params.vnp_ResponseCode;

    const payment = await Payment.findOne({ vnpTxnRef: txnRef });
    if (!payment) throw BadRequest("Transaction not found");

    payment.vnpResponseCode = rspCode;
    payment.vnpTransactionNo = params.vnp_TransactionNo;
    payment.vnpBankCode = params.vnp_BankCode;
    payment.vnpPayDate = params.vnp_PayDate;

    if (!verified) {
      payment.status = "failed";
      await payment.save();
      return ok(res, { success: false, message: "Signature invalid" });
    }

    if (rspCode === "00") {
      payment.status = "success";
      await payment.save();

      // Grant subscription
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

      return ok(res, {
        success: true,
        message: isMock
          ? "Thanh toán mô phỏng thành công"
          : "Thanh toán thành công",
        mock: isMock,
      });
    } else {
      payment.status = "failed";
      await payment.save();
      return ok(res, {
        success: false,
        message: "Thanh toán thất bại",
        code: rspCode,
      });
    }
  }),

  // GET /payments/history - list user payments
  history: asyncHandler(async (req, res) => {
    const items = await Payment.find({ userId: req.user?.id })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, { items, total: items.length });
  }),

  // Legacy / alternate create payment URL (from payment.controller.js)
  createPaymentUrl: asyncHandler(async (req, res) => {
    try {
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.ip;

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

      const plan = PLAN_ALIASES[rawPlan] || rawPlan;

      if (!plan || !Object.keys(PLAN_PRICES).includes(plan))
        return res
          .status(400)
          .json({
            code: 1,
            message: `plan is required (${Object.keys(PLAN_PRICES).join("|")})`,
          });

      const amount = Number(rawAmount) || PLAN_PRICES[plan] || 10000;

      const createDate = moment().format("YYYYMMDDHHmmss");
      const txnRef = new mongoose.Types.ObjectId().toString();

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
        vnp_Amount: amount * 100,
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
  }),

  // VNPAY IPN handler
  vnpIpn: asyncHandler(async (req, res) => {
    try {
      let vnp_Params = { ...req.query };

      const secureHash = vnp_Params.vnp_SecureHash;
      delete vnp_Params.vnp_SecureHash;
      delete vnp_Params.vnp_SecureHashType;

      vnp_Params = sortObject(vnp_Params);
      const signData = qs.stringify(vnp_Params, { encode: false });
      const hmac = crypto.createHmac("sha512", secretKey);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

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

          try {
            const user = await User.findById(payment.userId);
            if (user) {
              const now = new Date();
              const base =
                user.subscriptionExpires && user.subscriptionExpires > now
                  ? new Date(user.subscriptionExpires)
                  : now;
              base.setDate(
                base.getDate() + (PLAN_DURATIONS[payment.plan] || 30)
              );
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
  }),
};
