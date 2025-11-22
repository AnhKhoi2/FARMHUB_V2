// controllers/geocodeController.js
import Place from '../models/Place.js';
import { geocodeByName } from '../services/openmeteo.js';

export const searchPlaceController = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Thiếu q' });
    }

    const cached = await Place.findOne({ query: q }).sort({ createdAt: -1 });
    if (cached) {
      return res.json({ cached: true, place: cached });
    }

    const place = await geocodeByName(q);
    if (!place) {
      return res.status(404).json({ error: 'Không tìm thấy địa điểm' });
    }

    const doc = await Place.create({ query: q, ...place });
    res.json({ cached: false, place: doc });
  } catch (e) {
    next(e);
  }
};
