import { Router } from "express";
import { diseaseController } from "../controllers/diseaseController.js";

const router = Router();

// Public read-only endpoints for users (no auth required)
router.get("/", diseaseController.publicList);
router.get("/:slug", diseaseController.publicGetBySlug);

export default router;
