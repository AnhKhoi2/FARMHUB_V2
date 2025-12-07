// controllers/plantAdviceController.js
import {
  owCurrent,
  owForecast3h,
} from '../services/openweather.js';
import { buildWeatherBasedPlantCare } from '../services/aiGemini.js';

export const getPlantCareAdviceByWeather = async (req, res, next) => {
  try {
    const { lat, lon, plantName } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Thiếu lat/lon' });
    }

    if (!plantName || !plantName.trim()) {
      return res
        .status(400)
        .json({ error: 'Vui lòng nhập tên cây trồng' });
    }

    if (!process.env.OW_API_KEY) {
      return res
        .status(500)
        .json({ error: 'Thiếu OW_API_KEY trên server. Hãy cấu hình .env.' });
    }

    // Lấy thời tiết hiện tại + forecast 3h (24h tới)
    const [current, forecast3h] = await Promise.all([
      owCurrent(lat, lon, 'metric', 'vi'),
      owForecast3h(lat, lon, 'metric', 'vi'),
    ]);

    const list = forecast3h?.list || [];

    // Tính min/max nhiệt độ, tổng mưa, gió mạnh nhất trong ~24h tới
    let minTemp = null;
    let maxTemp = null;
    let rainTotal = 0;
    let maxWind = 0;

    const slice = list.slice(0, 8); // 8 * 3h = 24h
    slice.forEach((item) => {
      const t = item.main?.temp;
      if (t != null) {
        minTemp = minTemp === null ? t : Math.min(minTemp, t);
        maxTemp = maxTemp === null ? t : Math.max(maxTemp, t);
      }

      const r = item.rain?.['3h'];
      if (r != null) rainTotal += r;

      const w = item.wind?.speed;
      if (w != null && w > maxWind) maxWind = w;
    });

    const weatherSummary = {
      currentTempC: current?.main?.temp ?? null,
      currentHumidity: current?.main?.humidity ?? null,
      currentDescription: current?.weather?.[0]?.description ?? null,
      todayMinTempC: minTemp,
      todayMaxTempC: maxTemp,
      rainNext24hMm: Number(rainTotal.toFixed(1)),
      maxWindSpeedMs: maxWind,
      forecastSample: slice.map((item) => ({
        time: item.dt_txt || item.dt,
        tempC: item.main?.temp ?? null,
        humidity: item.main?.humidity ?? null,
        description: item.weather?.[0]?.description ?? null,
        rain3hMm: item.rain?.['3h'] ?? 0,
      })),
    };

    const locationName = [
      current?.name,
      current?.sys?.state,
      current?.sys?.country,
    ]
      .filter(Boolean)
      .join(', ');

    const aiResult = await buildWeatherBasedPlantCare({
      plantName: plantName.trim(),
      locationName: locationName || 'Không rõ',
      weatherSummary,
    });

    return res.json(aiResult);
  } catch (e) {
    console.error('getPlantCareAdviceByWeather error:', e);
    next(e);
  }
};
