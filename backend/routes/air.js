// routes/air.js
import { Router } from 'express';
import { getAirQualityController } from '../controllers/airController.js';

const r = Router();

// GET /api/air?lat=&lon=
r.get('/', getAirQualityController);

export default r;
