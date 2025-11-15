import express from "express";
import { userStreakController } from "../controllers/userStreakController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Record streak for current user (called after login or by client)
router.post("/record", verifyToken, userStreakController.recordForUser);

// User tự lấy streak của mình
router.get("/me", verifyToken, userStreakController.getMyStreak);
// Admin routes
router.get("/", verifyToken, requireAdmin, userStreakController.list);
router.get("/top", verifyToken, requireAdmin, userStreakController.top);
router.get("/:id", verifyToken, requireAdmin, userStreakController.getById);

export default router;
