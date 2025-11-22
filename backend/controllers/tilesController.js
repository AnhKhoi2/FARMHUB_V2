// controllers/tilesController.js
import { http, ApiError } from '../lib/http.js';

const allowedLayers = [
  'clouds_new',
  'clouds_cls',
  'precipitation_new',
  'precipitation_cls',
  'rain_new',
  'snow',
  'temp_new',
  'wind_new',
  'pressure_new',
  'wind_speed',
  'visibility',
  'dewpoint',
  'uvi',
  'sea_level_pressure',
  'temperature',
];

export const getTileController = async (req, res, next) => {
  try {
    const { layer, z, x, y } = req.params;
    const apiKey = process.env.OW_API_KEY;
    if (!apiKey) {
      throw new ApiError(500, 'Thiếu OW_API_KEY cho tile.');
    }

    if (!allowedLayers.includes(layer)) {
      return res.status(400).send('Invalid layer');
    }

    const url = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png`;
    const { data, headers } = await http.get(url, {
      params: { appid: apiKey },
      responseType: 'arraybuffer',
    });

    res.setHeader('Content-Type', headers['content-type'] || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.send(data);
  } catch (err) {
    next(err);
  }
};
