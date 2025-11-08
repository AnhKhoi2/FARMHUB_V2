import { Router } from "express";
import { postController } from "../controllers/postController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Public listing (no auth)
router.get("/public", postController.listPublic);

// Admin management endpoints
router.get("/", verifyToken, requireAdmin, postController.list);
router.get("/trash", verifyToken, requireAdmin, postController.trash);
// reported posts
router.get("/reported", verifyToken, requireAdmin, postController.reported);
router.get("/:id/reports", verifyToken, requireAdmin, postController.reportsForPost);
router.get("/:id", verifyToken, requireAdmin, postController.detail);
router.patch("/:id/hide", verifyToken, requireAdmin, postController.softDelete);
router.patch("/:id/restore", verifyToken, requireAdmin, postController.restore);
router.patch("/:id/status", verifyToken, requireAdmin, postController.updateStatus);
router.patch("/:id/ban-user", verifyToken, requireAdmin, postController.banUserForPost);

// Public (simple) creation endpoint: allow authenticated users to create a post
router.post("/", verifyToken, postController.create);
// Authenticated users can report a post
router.post("/:id/report", verifyToken, postController.report);

export default router;
