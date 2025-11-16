// controllers/weatherController.js
import WeatherSnapshot from '../models/WeatherSnapshot.js';
import { isFresh } from '../lib/cache.js';
import { getOpenMeteoForecast } from '../services/openmeteo.js';
import {
  owCurrent,
  owForecast3h,
  owDaily16,
  owHistory,
} from '../services/openweather.js';

// GET /api/weather
export const getWeatherController = async (req, res, next) => {
  try {
    const {
      provider = 'openweather',
      scope = 'forecast3h',
      lat,
      lon,
      units,
      lang,
    } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Thiếu lat/lon' });
    }

    const cacheMinutes =
      scope === 'current' ? 5 : scope === 'forecast3h' ? 15 : 30;

    const cached = await WeatherSnapshot.findOne({
      provider,
      scope,
      lat: Number(lat),
      lon: Number(lon),
    }).sort({ createdAt: -1 });

    if (isFresh(cached, cacheMinutes)) {
      return res.json({
        cached: true,
        scope,
        provider,
        data: cached.payload,
      });
    }

    let data;
    if (provider === 'open-meteo') {
      data = await getOpenMeteoForecast(lat, lon);
    } else {
      if (!process.env.OW_API_KEY) {
        return res
          .status(500)
          .json({ error: 'Server thiếu OW_API_KEY. Hãy cấu hình .env.' });
      }

      switch (scope) {
        case 'current':
          data = await owCurrent(lat, lon, units, lang);
          break;
        case 'daily16':
          data = await owDaily16(lat, lon, units, lang);
          break;
        case 'forecast3h':
        default:
          data = await owForecast3h(lat, lon, units, lang);
      }
    }

    await WeatherSnapshot.create({
      provider: provider === 'open-meteo' ? 'open-meteo' : 'openweather',
      scope,
      lat,
      lon,
      payload: data,
    });

    res.json({ cached: false, scope, provider, data });
  } catch (e) {
    next(e);
  }
};

// GET /api/weather/history
export const getWeatherHistoryController = async (req, res, next) => {
  try {
    const { lat, lon, start, end, units, lang } = req.query;

    if (!lat || !lon || !start || !end) {
      return res
        .status(400)
        .json({ error: 'Cần lat, lon, start, end (thời gian)' });
    }

    if (!process.env.OW_API_KEY) {
      return res
        .status(500)
        .json({ error: 'Server thiếu OW_API_KEY. Hãy cấu hình .env.' });
    }

    const toUnix = (v) =>
      /^\d+$/.test(v) ? Number(v) : Math.floor(new Date(v).getTime() / 1000);

    const startUnix = toUnix(start);
    const endUnix = toUnix(end);

    const cached = await WeatherSnapshot.findOne({
      provider: 'openweather-history',
      scope: 'history',
      lat: Number(lat),
      lon: Number(lon),
    }).sort({ createdAt: -1 });

    if (isFresh(cached, 60 * 24)) {
      return res.json({
        cached: true,
        provider: 'openweather-history',
        scope: 'history',
        data: cached.payload,
      });
    }

    const data = await owHistory(lat, lon, startUnix, endUnix, units, lang);

    await WeatherSnapshot.create({
      provider: 'openweather-history',
      scope: 'history',
      lat,
      lon,
      payload: data,
    });

    res.json({
      cached: false,
      provider: 'openweather-history',
      scope: 'history',
      data,
    });
  } catch (e) {
    next(e);
  }
};
