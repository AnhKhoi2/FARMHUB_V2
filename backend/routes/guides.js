import express from "express";
import { getGuides, createGuide, getGuideById, deleteGuide, updateGuide, getTrashedGuides, restoreGuide, permanentDeleteGuide } from "../controllers/guidesController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const router = express.Router();

// configure multer storage for guides
// compute __dirname reliably in ESM and store uploads under backend/uploads/guides
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		try {
			const dest = path.join(__dirname, '..', 'uploads', 'guides');
			// ensure directory exists
			fs.mkdirSync(dest, { recursive: true });
			cb(null, dest);
		} catch (err) {
			cb(err);
		}
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
		cb(null, name);
	}
});

const upload = multer({ storage });

// Public list endpoint with pagination/search/filter
router.get("/", getGuides);

// Trash endpoints (admin) - register BEFORE any param route like '/:id' so '/trash' is not treated as an id
router.get('/trash', getTrashedGuides);
router.post('/:id/restore', restoreGuide);
router.delete('/:id/permanent', permanentDeleteGuide);

// Create guide (for dev/testing) - in production protect with auth
// accept multipart/form-data for main image and per-step images
router.post("/", upload.any(), createGuide);

// Single guide
router.get("/:id", getGuideById);

// Update guide (with optional main image upload and multiple step images)
// accept 'image' (single) and 'stepImages' (multiple files for steps)
// use upload.any() so frontend can send per-step files with field names like 'stepImage_0'
router.put('/:id', upload.any(), updateGuide);

// Delete guide (dev) - protect in production
router.delete("/:id", deleteGuide);

export default router;
