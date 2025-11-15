import express from "express";
import { createPaymentUrl, vnpIpn } from "../controllers/payment.controller.js";
const router = express.Router();

router.post("/create-payment", createPaymentUrl); // tạo url chuyển sang VNPAY
router.get("/vnpay_ipn", vnpIpn); // VNPAY gọi IPN (GET)

export default router;
