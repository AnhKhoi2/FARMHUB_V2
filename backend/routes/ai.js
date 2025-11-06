import express from "express";
import { aiController } from "../controllers/aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /ai/diagnose
router.post("/diagnose", verifyToken, aiController.diagnose);
// POST /ai/chat - conversational chat with AI
router.post("/chat", verifyToken, aiController.chat);

export default router;
