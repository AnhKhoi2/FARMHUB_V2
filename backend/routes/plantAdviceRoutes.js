// routes/plantAdviceRoutes.js
import express from "express";
import { getPlantCareAdviceByWeather } from '../controllers/plantAdviceController.js';

const router = express.Router();

router.get('/plant-advice', getPlantCareAdviceByWeather);

export default router;
