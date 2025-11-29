import express from "express";
import crypto from "crypto";
import qs from "qs";
import moment from "moment";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendSubscriptionUpgradeNotification } from "../controllers/notificationController.js";
import requestIp from "request-ip";
import "dotenv/config";

const router = express.Router();

// ENV cấu hình
const vnp_TmnCode = (
  process.env.VNP_TMNCODE ||
  process.env.VNP_TMN_CODE ||
  ""
).trim();
const vnp_HashSecret = (
  process.env.VNP_HASHSECRET ||
  process.env.VNP_HASH_SECRET ||
  ""
).trim();
const vnp_Url = (
  process.env.VNP_PAYMENT_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
).trim();
const baseUrl = (process.env.BASE_URL || "http://localhost:5000").trim();
const vnp_ReturnUrl = `${baseUrl}${
  process.env.RETURN_URL_PATH || "/api/vnpay/return"
}`;
const frontendUrl = (process.env.CLIENT_URL || "http://localhost:3000").trim();

// Kiểm tra cấu hình
if (!vnp_TmnCode || !vnp_HashSecret) {
  console.error(
    "⚠️ CẢNH BÁO: Thiếu VNP_TMN_CODE hoặc VNP_HASH_SECRET trong file .env"
  );
}

// 🟢 TẠO URL THANH TOÁN
router.post("/create_payment_url", async (req, res) => {
  try {
    const { amount, orderDescription, orderId, userId, items } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        code: "01",
        message: "Số tiền không hợp lệ",
      });
    }

    if (!userId) {
      return res.status(400).json({
        code: "02",
        message: "Thiếu thông tin người dùng",
      });
    }

    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const orderRef = orderId || `ORD${moment(date).format("YYYYMMDDHHmmss")}`;

    // Chuẩn hóa IP
    const clientIp = requestIp.getClientIp(req) || "127.0.0.1";
    const vnp_IpAddr =
      clientIp.includes("::1") || clientIp.includes("::ffff:127.0.0.1")
        ? "127.0.0.1"
        : clientIp.replace("::ffff:", "");

    // Tạo order trong database
    const newOrder = new Order({
      userId,
      orderRef,
      items: items || [],
      totalAmount: amount,
      orderDescription: orderDescription || `Thanh toán đơn hàng ${orderRef}`,
      paymentMethod: "vnpay",
      status: "pending",
      paymentStatus: "pending",
    });

    await newOrder.save();

    // B1: Tạo params
    let vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode,
      vnp_Locale: "vn",
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderRef,
      vnp_OrderInfo: orderDescription || `Thanh toan don hang ${orderRef}`,
      vnp_OrderType: "other",
      vnp_Amount: Math.round(amount * 100), // ⚠️ VNPay yêu cầu nhân 100
      vnp_ReturnUrl,
      vnp_IpAddr,
      vnp_CreateDate: createDate,
    };

    // B2: Sort & encode chuẩn
    vnp_Params = sortObject(vnp_Params);

    // B3: Tạo chuỗi để ký
    const signData = qs.stringify(vnp_Params, { encode: false });

    // B4: Hash SHA512
    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    // B5: Gắn hash
    vnp_Params["vnp_SecureHash"] = signed;

    // B6: Tạo URL thanh toán
    const paymentUrl =
      vnp_Url + "?" + qs.stringify(vnp_Params, { encode: false });

    console.log("----- VNPay DEBUG START -----");
    console.log("Order ID:", newOrder._id);
    console.log("Order Ref:", orderRef);
    console.log("Amount:", amount, "VND");
    console.log("vnp_Amount:", vnp_Params.vnp_Amount);
    console.log("signData:", signData);
    console.log("vnp_SecureHash:", signed);
    console.log("----- VNPay DEBUG END -----");

    return res.json({
      code: "00",
      message: "success",
      paymentUrl,
      orderId: newOrder._id,
      orderRef,
    });
  } catch (err) {
    console.error("VNPay create_payment_url error:", err);
    return res.status(500).json({
      code: "99",
      message: "error",
      error: err.message,
    });
  }
});

// 🟢 CALLBACK VNPay RETURN
router.get("/return", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };

    const receivedHash = vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("----- VNPay RETURN DEBUG -----");
    console.log("Order Ref:", vnp_Params.vnp_TxnRef);
    console.log("Response Code:", vnp_Params.vnp_ResponseCode);
    console.log("signData:", signData);
    console.log("computed hash:", checkHash);
    console.log("received hash:", receivedHash);
    console.log("-----------------------------");

    if (checkHash !== receivedHash) {
      console.error("❌ Sai chữ ký VNPay");
      return res.redirect(`${frontendUrl}/payment?status=invalid_signature`);
    }

    // Tìm order theo orderRef
    const order = await Order.findOne({ orderRef: vnp_Params.vnp_TxnRef });

    if (!order) {
      console.error("❌ Order không tồn tại:", vnp_Params.vnp_TxnRef);
      return res.redirect(`${frontendUrl}/payment?status=order_not_found`);
    }

    // Cập nhật thông tin thanh toán
    order.paymentInfo = vnp_Params;
    order.paymentStatus =
      vnp_Params.vnp_ResponseCode === "00" ? "paid" : "failed";

    if (order.paymentStatus === "paid") {
      order.paidAt = new Date();
      order.status = "confirmed";
      console.log("✅ Thanh toán thành công:", order.orderRef);
    } else {
      order.status = "failed";
      console.log(
        "❌ Thanh toán thất bại:",
        order.orderRef,
        "Code:",
        vnp_Params.vnp_ResponseCode
      );
    }

    await order.save();

    // Cập nhật subscription nếu thanh toán thành công
    await updateSubscriptionForOrder(order);

    // 🔥 Redirect về frontend sau khi thanh toán xong
    if (vnp_Params.vnp_ResponseCode === "00") {
      return res.redirect(
        `${frontendUrl}/payment/success?orderId=${order._id}&orderRef=${order.orderRef}`
      );
    } else {
      return res.redirect(
        `${frontendUrl}/payment/failed?orderId=${order._id}&code=${vnp_Params.vnp_ResponseCode}`
      );
    }
  } catch (err) {
    console.error("Error /vnpay/return:", err);
    return res.redirect(`${frontendUrl}/payment?status=error`);
  }
});

// 🟢 IPN - Instant Payment Notification (webhook từ VNPay)
router.get("/ipn", async (req, res) => {
  try {
    let vnp_Params = { ...req.query };

    const receivedHash = vnp_Params.vnp_SecureHash;
    const orderRef = vnp_Params.vnp_TxnRef;
    const rspCode = vnp_Params.vnp_ResponseCode;

    delete vnp_Params.vnp_SecureHash;
    delete vnp_Params.vnp_SecureHashType;

    vnp_Params = sortObject(vnp_Params);
    const signData = qs.stringify(vnp_Params, { encode: false });

    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const checkHash = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

    console.log("----- VNPay IPN DEBUG -----");
    console.log("Order Ref:", orderRef);
    console.log("Response Code:", rspCode);
    console.log("Hash valid:", checkHash === receivedHash);
    console.log("---------------------------");

    if (checkHash !== receivedHash) {
      return res
        .status(200)
        .json({ RspCode: "97", Message: "Invalid Signature" });
    }

    const order = await Order.findOne({ orderRef });

    if (!order) {
      return res
        .status(200)
        .json({ RspCode: "01", Message: "Order Not Found" });
    }

    // Kiểm tra trạng thái đơn hàng
    if (order.paymentStatus === "paid") {
      // Đã thanh toán rồi
      return res
        .status(200)
        .json({ RspCode: "02", Message: "Order Already Confirmed" });
    }

    // Cập nhật trạng thái
    if (rspCode === "00") {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paidAt = new Date();
      order.paymentInfo = vnp_Params;
      await order.save();

      // Cập nhật subscription nếu thanh toán thành công
      await updateSubscriptionForOrder(order);

      console.log("✅ IPN: Thanh toán thành công:", orderRef);
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    } else {
      order.paymentStatus = "failed";
      order.status = "failed";
      order.paymentInfo = vnp_Params;
      await order.save();

      console.log("❌ IPN: Thanh toán thất bại:", orderRef);
      return res.status(200).json({ RspCode: "00", Message: "Success" });
    }
  } catch (err) {
    console.error("Error /vnpay/ipn:", err);
    return res.status(200).json({ RspCode: "99", Message: "Unknown error" });
  }
});

// 🟢 QUERY ORDER STATUS
router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("userId", "username email")
      .select("-__v");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (err) {
    console.error("Error get order:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
});

// 🟢 GET USER ORDERS
router.get("/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, paymentStatus, limit = 20, page = 1 } = req.query;

    const query = { userId };
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select("-paymentInfo -__v");

    const total = await Order.countDocuments(query);

    return res.json({
      success: true,
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Error get user orders:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: err.message,
    });
  }
});

// 🟢 Hàm cập nhật subscription cho user sau thanh toán thành công
async function updateSubscriptionForOrder(order) {
  if (order.paymentStatus !== "paid") return;

  // Kiểm tra nếu order có item subscription
  const subscriptionItem = order.items.find(
    (item) => item.itemType === "Subscription"
  );
  if (!subscriptionItem) return;

  // Mapping tên gói sang plan
  const planMapping = {
    "Gói Thông Minh": "smart",
    "Gói VIP": "vip",
    "Gói Pro": "pro",
  };

  const plan = planMapping[subscriptionItem.name];
  if (!plan) {
    console.warn("⚠️ Không tìm thấy mapping cho gói:", subscriptionItem.name);
    return;
  }

  // Tính expires: giả sử 30 ngày từ paidAt
  const expires = new Date(order.paidAt);
  expires.setMonth(expires.getMonth() + 1); // +1 tháng

  // Cập nhật user
  await User.findByIdAndUpdate(order.userId, {
    subscriptionPlan: plan,
    subscriptionExpires: expires,
  });

  console.log(
    `✅ Cập nhật subscription cho user ${
      order.userId
    }: plan=${plan}, expires=${expires.toISOString()}`
  );

  // Gửi thông báo cho user
  try {
    await sendSubscriptionUpgradeNotification({
      userId: order.userId,
      plan,
      planName: subscriptionItem.name,
      expires,
      orderRef: order.orderRef,
      amount: order.totalAmount,
    });
  } catch (err) {
    console.error("Lỗi khi gửi notification subscription_upgrade:", err);
  }
}

// 🧩 Hàm sort object chuẩn VNPay
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }
  return sorted;
}

export default router;
