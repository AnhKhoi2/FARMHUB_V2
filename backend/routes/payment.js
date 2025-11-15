import express from "express";
import { paymentController } from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.post("/create-payment", verifyToken, paymentController.createPaymentUrl); // tạo url chuyển sang VNPAY (yêu cầu đăng nhập)
router.get("/vnpay_ipn", paymentController.vnpIpn); // VNPAY gọi IPN (GET)

export default router;
