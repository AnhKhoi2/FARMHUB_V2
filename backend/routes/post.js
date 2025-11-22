import { Router } from "express";
import { postController } from "../controllers/postController.js";
import { verifyToken, requireAdmin, requireModeratorOrAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// Public listing (no auth)
router.get("/public", postController.listPublic);
// Public single post detail
router.get("/public/:id", postController.detailPublic);

// Management endpoints: allow moderators OR admins for most actions
router.get("/", verifyToken, requireModeratorOrAdmin, postController.list);
router.get("/trash", verifyToken, requireModeratorOrAdmin, postController.trash);
// reported posts (list)
router.get("/reported", verifyToken, requireModeratorOrAdmin, postController.reported);
// view reports for a post
router.get("/:id/reports", verifyToken, requireModeratorOrAdmin, postController.reportsForPost);
// view single post detail (management)
router.get("/:id", verifyToken, requireModeratorOrAdmin, postController.detail);
// moderation actions
router.patch("/:id/hide", verifyToken, requireModeratorOrAdmin, postController.softDelete);
router.patch("/:id/restore", verifyToken, requireModeratorOrAdmin, postController.restore);
router.patch("/:id/status", verifyToken, requireModeratorOrAdmin, postController.updateStatus);
// ban user remains admin-only
router.patch("/:id/ban-user", verifyToken, requireAdmin, postController.banUserForPost);

// Public (simple) creation endpoint: allow authenticated users to create a post
router.post("/", verifyToken, postController.create);
// Authenticated users can report a post
router.post("/:id/report", verifyToken, postController.report);

export default router;
