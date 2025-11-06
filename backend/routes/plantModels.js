import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  getPlantModels,
  getPlantModelById,
  createPlantModel,
  updatePlantModel,
  deletePlantModel,
  getTrashedPlantModels,
  restorePlantModel,
  permanentDeletePlantModel,
} from "../controllers/plantModelsController.js";

const router = express.Router();

// configure multer storage under backend/uploads/plantmodels
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const dest = path.join(__dirname, '..', 'uploads', 'plantmodels');
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    } catch (err) { cb(err); }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Trash endpoints registered before param routes
router.get('/trash', getTrashedPlantModels);
router.post('/:id/restore', restorePlantModel);
router.delete('/:id/permanent', permanentDeletePlantModel);

router.get('/', getPlantModels);
router.post('/', upload.any(), createPlantModel);
router.get('/:id', getPlantModelById);
router.put('/:id', upload.any(), updatePlantModel);
router.delete('/:id', deletePlantModel);

export default router;
