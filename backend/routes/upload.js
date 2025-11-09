import express from "express";
import upload from "../utils/upload.js";
import {
  uploadImage,
  uploadMultipleImages,
} from "../controllers/uploadController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Single image upload
router.post("/", verifyToken, upload.single("image"), uploadImage);

// Multiple images upload
router.post(
  "/multiple",
  verifyToken,
  upload.array("images", 10),
  uploadMultipleImages
);

export default router;
