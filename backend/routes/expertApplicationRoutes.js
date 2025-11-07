// backend/routes/expertApplicationRoutes.js
import { Router } from "express";
// ⛔ Đừng dùng default import nếu controller dùng named export
import { list, getById, approve, reject, create, getMine } from "../controllers/expertApplicationController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";
// Nếu bạn muốn dùng namespace thì: import * as ctrl from "..."; và đổi bên dưới thành ctrl.approve, ctrl.reject,...

const router = Router();

// Public admin management endpoints (require admin)
router.get("/", verifyToken, requireAdmin, list);
router.get("/:id", verifyToken, requireAdmin, getById);
router.patch("/:id/approve", verifyToken, requireAdmin, approve);
router.patch("/:id/reject", verifyToken, requireAdmin, reject);
// User self-service endpoints (auth required, no admin)
router.post("/", verifyToken, create);
router.get("/me", verifyToken, getMine);

export default router;
