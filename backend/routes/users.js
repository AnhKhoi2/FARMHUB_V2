import { Router } from "express";
import { userController } from "../controllers/userController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/", verifyToken, requireAdmin, userController.list);
router.get("/:id", verifyToken, requireAdmin, userController.detail);
router.patch("/:id/role", verifyToken, requireAdmin, userController.updateRole);
router.delete("/:id", verifyToken, requireAdmin, userController.softDelete);
router.patch("/:id/restore", verifyToken, requireAdmin, userController.restore);

export default router;
