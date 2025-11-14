import { Router } from "express";
import * as ctrl from "../controllers/expertController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// ✅ Lấy thông tin cơ bản của chuyên gia hiện tại (ExpertHome sử dụng)
router.get("/me/basic", verifyToken, ctrl.getMyBasic);

// Các API hiện có
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.delete("/:id", ctrl.remove);

export default router;
