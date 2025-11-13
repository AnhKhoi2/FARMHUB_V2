import { Router } from "express";
import { diseaseCategoryController } from "../controllers/diseaseCategoryController.js";

const router = Router();

// Public read-only endpoints for users (no auth required)
router.get("/", diseaseCategoryController.publicList);
router.get("/:slug", diseaseCategoryController.publicGetBySlug);

export default router;
