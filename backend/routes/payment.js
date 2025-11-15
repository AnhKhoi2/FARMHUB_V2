import express from "express";
import { createPaymentUrl, vnpIpn } from "../controllers/payment.controller.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
const router = express.Router();
router.post("/create-payment", verifyToken, createPaymentUrl); // tạo url chuyển sang VNPAY (yêu cầu đăng nhập)
router.get("/vnpay_ipn", vnpIpn); // VNPAY gọi IPN (GET)

export default router;
