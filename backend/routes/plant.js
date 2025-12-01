// backend/routes/plant.js
import express from "express";
import {
  diagnosePlantController,
  diagnosePlantByTextController,
} from "../controllers/plantController.js";
import { uploadImage } from "../middlewares/uploadImage.js";

const router = express.Router();

/**
 * POST /api/plant/diagnose
 * - Nhận ảnh dạng multipart/form-data (field: image)
 * - Hoặc vẫn hỗ trợ base64 trong body JSON cũ (fallback)
 */
router.post(
  "/diagnose",
  uploadImage.single("image"), // nếu FE gửi file -> req.file
  diagnosePlantController
);

/**
 * POST /api/plant/ai-text-diagnose
 * Giữ nguyên như cũ
 */
router.post("/ai-text-diagnose", diagnosePlantByTextController);

export default router;
