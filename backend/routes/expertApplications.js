import express from "express";
import * as ctrl from "../controllers/expertApplicationController.js";
import { verifyToken, requireAdmin } from "../middlewares/authMiddleware.js";

import { validateBody } from "../middlewares/validate.js";
import { createExpertApplicationSchema } from "../validations/expertApplication.validate.js";

const router = express.Router();

// User nộp đơn
router.post("/", verifyToken, validateBody(createExpertApplicationSchema), ctrl.create);

// User xem đơn của chính mình
router.get("/me", verifyToken, ctrl.getMine);

// Admin list & duyệt
router.get("/", verifyToken, requireAdmin, ctrl.list);
router.patch("/:id/approve", verifyToken, requireAdmin, ctrl.approve);
router.patch("/:id/reject", verifyToken, requireAdmin, ctrl.reject);

export default router;
