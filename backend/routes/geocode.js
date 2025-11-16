// routes/geocode.js
import { Router } from 'express';
import { searchPlaceController } from '../controllers/geocodeController.js';

const r = Router();

// GET /api/geocode/search?q=
r.get('/search', searchPlaceController);

export default r;
