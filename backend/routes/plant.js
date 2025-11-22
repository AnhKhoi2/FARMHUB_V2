// routes/plant.js
import { Router } from 'express';
import { diagnosePlantController } from '../controllers/plantController.js';

const r = Router();

// POST /api/plant/diagnose
r.post('/diagnose', diagnosePlantController);

export default r;
