// backend/routes/expertRating.routes.js
import { Router } from "express";
import { rateOnce, myRating } from "../controllers/expertRatingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// Mỗi user chỉ đánh giá 1 lần
router.post("/:id/rate", verifyToken, rateOnce);
// Xem điểm mình đã chấm
router.get("/:id/rate/me", verifyToken, myRating);

export default router;
