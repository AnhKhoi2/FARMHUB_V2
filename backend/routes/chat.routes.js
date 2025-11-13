import { Router } from "express";
import * as chat from "../controllers/chatController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// mở (hoặc lấy) cuộc trò chuyện giữa "me" và expert/user
router.post("/open", verifyToken, chat.open);

// danh sách các cuộc trò chuyện của tôi
router.get("/", verifyToken, chat.listMy);

// lấy lịch sử tin nhắn của 1 conversation
router.get("/:id/messages", verifyToken, chat.messages);

// ✅ gửi tin nhắn vào 1 conversation (chính route bạn đang 404)
router.post("/:id/messages", verifyToken, chat.send);

export default router;
