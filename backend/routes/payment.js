import express from "express";
import { paymentController } from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
// Single create endpoint (canonical)
router.post("/create", verifyToken, paymentController.createVNPay);
router.get("/vnpay_ipn", paymentController.vnpIpn);
router.get("/vnpay/return", paymentController.vnpayReturn);
router.get("/history", verifyToken, paymentController.history);

export default router;
