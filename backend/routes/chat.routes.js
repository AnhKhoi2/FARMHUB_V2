import { Router } from "express";
import * as chat from "../controllers/chatController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/open", verifyToken, chat.open);
router.get("/has-talked/:expertId", verifyToken, chat.hasTalked);
router.get("/", verifyToken, chat.listMy);
router.get("/:id/messages", verifyToken, chat.messages);
router.post("/:id/messages", verifyToken, chat.send);
router.get("/unread", verifyToken, chat.listUnread);
export default router;
