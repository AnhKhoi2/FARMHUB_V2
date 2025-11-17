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

// VNPay environment is read from `backend/utils/vnpay.js` (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_PAYMENT_URL)
// Removed local duplicates to avoid conflicting/unsynchronized sources of truth.

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

// Helper: grant subscription to user based on payment
async function grantUserSubscription(payment) {
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
      return true;
    }
  } catch (e) {
    console.error("Grant subscription error:", e);
  }
  return false;
}

export const paymentController = {
  // POST /payments/vnpay/create { plan, bankCode }
  createVNPay: asyncHandler(async (req, res) => {
    const { plan: rawPlan, bankCode } = req.body;
    // Normalize plan alias (e.g. "smart" -> "vip")
    const plan = PLAN_ALIASES[rawPlan] || rawPlan;
    if (!["vip", "pro"].includes(plan)) throw BadRequest("Plan không hợp lệ");

    const userId = req.user?.id;
    const amount = PLAN_PRICES[plan];

    const txnRef = makeTxnRef();
    const orderInfo = `Thanh toan goi ${plan.toUpperCase()} cho user ${userId}`;

    // Chuẩn hóa IP address (xử lý ::1, ::ffff:)
    let clientIp = req.ip || req.connection?.remoteAddress || "127.0.0.1";
    if (clientIp.includes("::1") || clientIp.includes("::ffff:")) {
      clientIp = "127.0.0.1";
    }

    let payUrl;
    if (hasVNPayConfig()) {
      // Force VNPay QR unless explicitly overridden
      payUrl = buildVNPayUrl({
        amount,
        orderInfo,
        txnRef,
        ipAddr: clientIp,
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
    // Return format matching frontend expectation: {code: 0, data: {paymentUrl}}
    return res.json({
      code: 0,
      message: "OK",
      data: { paymentId: payment._id, paymentUrl: payUrl },
    });
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

      // Log signature mismatch details to file for debugging
      try {
        const fs = await import("fs");
        const path = await import("path");
        const logDir = path.join(process.cwd(), "backend", "logs");
        fs.mkdirSync(logDir, { recursive: true });
        const logPath = path.join(logDir, "vnpay-signature.log");
        const info = {
          time: new Date().toISOString(),
          endpoint: "vnpayReturn",
          params,
        };
        fs.appendFileSync(logPath, JSON.stringify(info) + "\n");
      } catch (e) {
        console.error("Failed to write vnpay return log", e);
      }

      console.error("VNPAY vnpayReturn signature invalid", params);
      return ok(res, { success: false, message: "Signature invalid" });
    }

    if (rspCode === "00") {
      payment.status = "success";
      await payment.save();

      // Grant subscription via helper
      await grantUserSubscription(payment);

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
    // Rewritten to use `buildVNPayUrl` in `utils/vnpay.js` for consistent signing logic
    try {
      // Chuẩn hóa IP address
      let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection?.remoteAddress ||
        req.ip ||
        "127.0.0.1";

      if (ipAddr.includes("::1") || ipAddr.includes("::ffff:")) {
        ipAddr = "127.0.0.1";
      }

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
        return res.status(400).json({
          code: 1,
          message: `plan is required (${Object.keys(PLAN_PRICES).join("|")})`,
        });

      // Always use server-side price for security (ignore amount from FE)
      const amount = PLAN_PRICES[plan];
      if (!amount) {
        return res.status(500).json({
          code: 1,
          message: "Plan price not configured",
        });
      }

      const txnRef = new mongoose.Types.ObjectId().toString();

      const payment = await Payment.create({
        userId,
        plan,
        amount,
        vnpTxnRef: txnRef,
        status: "pending",
      });

      let payUrl;
      if (hasVNPayConfig()) {
        payUrl = buildVNPayUrl({
          amount,
          orderInfo: `Thanh toan ${plan} cho user ${userId}`,
          txnRef,
          ipAddr,
          bankCode: bankCode || null,
        });
      } else {
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

      return res.json({
        code: 0,
        message: "OK",
        data: { paymentId: payment._id, paymentUrl: payUrl },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ code: 1, message: "Internal error" });
    }
  }),

  // VNPAY IPN handler
  vnpIpn: asyncHandler(async (req, res) => {
    try {
      // Accept either query (GET) or body (POST)
      const params = Object.keys(req.query).length ? req.query : req.body || {};

      const verified = verifyVNPayReturn(params);
      if (!verified) {
        // Write signature mismatch details to log file for debugging
        try {
          const fs = await import("fs");
          const path = await import("path");
          const logDir = path.join(process.cwd(), "backend", "logs");
          fs.mkdirSync(logDir, { recursive: true });
          const logPath = path.join(logDir, "vnpay-signature.log");
          const info = {
            time: new Date().toISOString(),
            endpoint: "vnpIpn",
            params,
          };
          fs.appendFileSync(logPath, JSON.stringify(info) + "\n");
        } catch (e) {
          console.error("Failed to write vnpay ipn log", e);
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("Invalid VNPAY signature", { params });
        } else {
          console.warn("Invalid VNPAY signature");
        }
        return res.json({ RspCode: "97", Message: "Invalid signature" });
      }

      const rspCode = params.vnp_ResponseCode;
      const orderId = params.vnp_TxnRef;

      const payment = await Payment.findOne({ vnpTxnRef: orderId });
      if (!payment) {
        console.warn("Payment not found for txn", orderId);
        return res.json({ RspCode: "00", Message: "No such order" });
      }

      // Update payment info
      payment.vnpResponseCode = rspCode;
      payment.vnpTransactionNo = params.vnp_TransactionNo;
      payment.vnpBankCode = params.vnp_BankCode;
      payment.vnpPayDate = params.vnp_PayDate;

      if (rspCode === "00") {
        payment.status = "success";
        await payment.save();
        await grantUserSubscription(payment);
        console.log("VNPAY IPN success for order", orderId);
        return res.json({ RspCode: "00", Message: "Success" });
      } else {
        payment.status = "failed";
        await payment.save();
        console.log("VNPAY IPN failed", params);
        return res.json({ RspCode: "00", Message: "Payment failed" });
      }
    } catch (err) {
      console.error(err);
      return res.json({ RspCode: "99", Message: "Internal error" });
    }
  }),
};
