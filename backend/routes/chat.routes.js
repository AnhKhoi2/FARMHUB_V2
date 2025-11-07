import { Router } from "express";
import * as chatController from "../controllers/chatController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/open", verifyToken, chatController.open);
router.get("/", verifyToken, chatController.listMy);
router.get("/:id/messages", verifyToken, chatController.messages);

export default router;
