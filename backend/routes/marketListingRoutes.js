import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import ctrl from "../controllers/marketListingController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = Router();

// ===== Multer setup (local uploads) =====
const UPLOAD_DIR = path.join(process.cwd(), "uploads", "market");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const fileFilter = (req, file, cb) => {
  const ok = ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype);
  cb(ok ? null : new Error("Unsupported file type"), ok);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// ===== Helpers =====
const maybeAuth = (req, res, next) => {
  const hasAuth = req.headers.authorization?.startsWith("Bearer ");
  if (!hasAuth) return next();
  return verifyToken(req, res, next);
};

const requireAdmin = (req, res, next) => {
  if (req?.user?.role === "admin") return next();
  return res.status(403).json({ ok: false, message: "Admin only" });
};

// ===== Routes =====

// Public
router.get("/categories", ctrl.categories);
router.get("/listings", maybeAuth, ctrl.list);
router.get("/listings/:id", maybeAuth, ctrl.detail);

// User (authenticated)
router.post("/listings", verifyToken, upload.array("images", 6), ctrl.create);
router.patch("/listings/:id", verifyToken, upload.array("images", 6), ctrl.update);
router.delete("/listings/:id", verifyToken, ctrl.remove);

// Admin approve/reject
router.patch("/listings/:id/status", verifyToken, requireAdmin, ctrl.changeStatus);

// Error handler (multer + general)
router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ ok: false, message: err.message });
  if (err?.message === "Unsupported file type")
    return res.status(400).json({ ok: false, message: "Unsupported file type" });
  return res.status(500).json({ ok: false, message: err?.message || "Server error" });
});

export default router;
