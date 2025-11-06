import Payment from '../models/Payment.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { BadRequest, Forbidden } from '../utils/ApiError.js';
import { buildVNPayUrl, verifyVNPayReturn, hasVNPayConfig, getReturnUrl } from '../utils/vnpay.js';

const PLAN_PRICES = { vip: 99000, pro: 199000 }; // VND per month (example)
const PLAN_DURATIONS = { vip: 30, pro: 30 }; // days

function makeTxnRef() {
  return 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
}

export const paymentController = {
  // POST /payments/vnpay/create { plan, bankCode }
  createVNPay: asyncHandler(async (req, res) => {
    const { plan, bankCode } = req.body;
    if (!['vip','pro'].includes(plan)) throw BadRequest('Plan không hợp lệ');

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
        bankCode: bankCode || 'VNPAYQR',
      });
    } else {
      // Mock payUrl: immediately redirect to return endpoint with success codes
      const baseReturn = getReturnUrl();
      const mockParams = new URLSearchParams({
        mock: '1',
        vnp_TxnRef: txnRef,
        vnp_ResponseCode: '00',
        vnp_TransactionNo: 'MOCKTXN' + Date.now(),
        vnp_BankCode: bankCode || 'VNPAYQR',
        vnp_PayDate: new Date().toISOString().replace(/[-:TZ]/g,'').slice(0,14),
      }).toString();
      payUrl = `${baseReturn}?${mockParams}`;
    }

    const payment = await Payment.create({ userId, plan, amount, vnpTxnRef: txnRef, status: 'pending' });
    return created(res, { paymentId: payment._id, payUrl });
  }),

  // GET /payments/vnpay/return (VNPay will redirect here with query params)
  vnpayReturn: asyncHandler(async (req, res) => {
  const params = req.query || {};
  const isMock = params.mock === '1';
  const verified = isMock ? true : verifyVNPayReturn(params);
    const txnRef = params.vnp_TxnRef;
    const rspCode = params.vnp_ResponseCode;

    const payment = await Payment.findOne({ vnpTxnRef: txnRef });
    if (!payment) throw BadRequest('Transaction not found');

    payment.vnpResponseCode = rspCode;
    payment.vnpTransactionNo = params.vnp_TransactionNo;
    payment.vnpBankCode = params.vnp_BankCode;
    payment.vnpPayDate = params.vnp_PayDate;

    if (!verified) {
      payment.status = 'failed';
      await payment.save();
      return ok(res, { success: false, message: 'Signature invalid' });
    }

    if (rspCode === '00') {
      payment.status = 'success';
      await payment.save();

      // Grant subscription
      const user = await User.findById(payment.userId);
      if (user) {
        const now = new Date();
        const base = user.subscriptionExpires && user.subscriptionExpires > now ? new Date(user.subscriptionExpires) : now;
        base.setDate(base.getDate() + (PLAN_DURATIONS[payment.plan] || 30));
        user.subscriptionPlan = payment.plan;
        user.subscriptionExpires = base;
        await user.save();
      }

      return ok(res, { success: true, message: isMock ? 'Thanh toán mô phỏng thành công' : 'Thanh toán thành công', mock: isMock });
    } else {
      payment.status = 'failed';
      await payment.save();
      return ok(res, { success: false, message: 'Thanh toán thất bại', code: rspCode });
    }
  }),

  // GET /payments/history - list user payments
  history: asyncHandler(async (req, res) => {
    const items = await Payment.find({ userId: req.user?.id }).sort({ createdAt: -1 }).lean();
    return ok(res, { items, total: items.length });
  }),
};
