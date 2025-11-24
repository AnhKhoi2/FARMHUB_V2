import { Router } from "express";
import * as expertCtrl from "../controllers/expertController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// =========================
// API CHO EXPERT TỰ CHỈNH HỒ SƠ
// =========================
router.get("/me/basic", verifyToken, expertCtrl.getMyBasic);
router.put("/me/basic", verifyToken, expertCtrl.updateMyBasic);

// =========================
// API LIST / GET DETAIL / DELETE
// =========================
router.get("/", expertCtrl.list);
router.get("/:id", expertCtrl.getById);
router.delete("/:id", expertCtrl.remove);

export default router;
