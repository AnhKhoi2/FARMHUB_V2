import { Router } from "express";
import { diseaseCategoryController } from "../controllers/diseaseCategoryController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Admin-protected routes for managing categories
router.post("/", verifyToken, requireAdmin, diseaseCategoryController.create);
router.get("/", verifyToken, requireAdmin, diseaseCategoryController.list);
// Public endpoints for categories (available to regular users)
router.get("/public", diseaseCategoryController.publicList);
router.get("/public/:slug", diseaseCategoryController.publicGetBySlug);
router.get("/:slug", verifyToken, requireAdmin, diseaseCategoryController.getBySlug);
router.put("/:id", verifyToken, requireAdmin, diseaseCategoryController.update);
router.delete("/:id", verifyToken, requireAdmin, diseaseCategoryController.softDelete);
router.patch("/:id/restore", verifyToken, requireAdmin, diseaseCategoryController.restore);

export default router;
