import * as service from '../services/weatherService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';

export const weatherController = {
  getCurrent: asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.location || '';
    if (!q) return res.status(400).json({ success: false, message: 'q (location) is required' });

    const data = await service.fetchWeather(q);
    return ok(res, data);
  }),
};

export default weatherController;
