// routes/weather_v2.js
import { Router } from 'express';
import {
  getWeatherController,
  getWeatherHistoryController,
} from '../controllers/weatherController_v2.js';

const r = Router();

/**
 * GET /api/weather
 */
r.get('/', getWeatherController);

/**
 * GET /api/weather/history
 */
r.get('/history', getWeatherHistoryController);

export default r;
