// controllers/airController.js
import AirSnapshot from '../models/AirSnapshot.js';
import { isFresh } from '../lib/cache.js';
import { getAirQuality } from '../services/openweatherAir.js';

export const getAirQualityController = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Thiếu lat/lon' });
    }

    const cache = await AirSnapshot.findOne({
      lat: Number(lat),
      lon: Number(lon),
    }).sort({ createdAt: -1 });

    if (isFresh(cache, 30)) {
      return res.json({ cached: true, data: cache.payload });
    }

    const data = await getAirQuality(lat, lon, process.env.OW_API_KEY);
    await AirSnapshot.create({ lat, lon, payload: data });

    res.json({ cached: false, data });
  } catch (e) {
    next(e);
  }
};
