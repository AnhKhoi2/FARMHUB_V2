import { Router } from "express";
import { diseaseController } from "../controllers/diseaseController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireAdmin, diseaseController.create);
router.get("/", verifyToken, requireAdmin, diseaseController.list);
// Public endpoints for non-admin users
router.get("/public", diseaseController.publicList);
router.get("/public/:slug", diseaseController.publicGetBySlug);
router.get("/:slug", verifyToken, requireAdmin, diseaseController.getBySlug);
router.put("/:id", verifyToken, requireAdmin, diseaseController.update);
router.delete("/:id", verifyToken, requireAdmin, diseaseController.softDelete);
router.patch("/:id/restore", verifyToken, requireAdmin, diseaseController.restore);

export default router;
