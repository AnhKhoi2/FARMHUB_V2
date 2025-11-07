// backend/routes/expertApplicationRoutes.js
import { Router } from "express";
// ⛔ Đừng dùng default import nếu controller dùng named export
import { list, getById, approve, reject } from "../controllers/expertApplicationController.js";
// Nếu bạn muốn dùng namespace thì: import * as ctrl from "..."; và đổi bên dưới thành ctrl.approve, ctrl.reject,...

const router = Router();

// Nếu có auth:
// import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";
// router.use(verifyToken, requireAdmin);

router.get("/", list);
router.get("/:id", getById);

// ✅ Quan trọng: phải truyền **chính hàm** (approve/reject), KHÔNG được approve()
router.patch("/:id/approve", approve);
router.patch("/:id/reject", reject);

export default router;
