// controllers/plantAdviceController.js
import WeatherSnapshot from "../models/WeatherSnapshot.js";
import AirSnapshot from "../models/AirSnapshot.js";
import { isFresh } from "../lib/cache.js";
import { owCurrent } from "../services/openweather.js";
import { getAirQuality } from "../services/openweatherAir.js";
import { buildPlantAdvice } from "../services/plantWeatherAdvice.js";

export const getPlantAdviceController = async (req, res, next) => {
  try {
    const { lat, lon, plant_group: plantGroup = "other" } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Thiếu lat/lon" });
    }

    if (!process.env.OW_API_KEY) {
      // nếu thiếu key thì báo lỗi rõ ràng (tránh crash)
      return res.status(500).json({ error: "Thiếu OW_API_KEY trong server." });
    }

    const latNum = Number(lat);
    const lonNum = Number(lon);

    // 1. WEATHER current (cache)
    let weatherDoc = await WeatherSnapshot.findOne({
      provider: "openweather",
      scope: "current",
      lat: latNum,
      lon: lonNum,
    }).sort({ createdAt: -1 });

    let weatherPayload;
    if (isFresh(weatherDoc, 10)) {
      weatherPayload = weatherDoc.payload;
    } else {
      const data = await owCurrent(lat, lon, "metric", "vi");
      weatherPayload = data;
      await WeatherSnapshot.create({
        provider: "openweather",
        scope: "current",
        lat: latNum,
        lon: lonNum,
        payload: data,
      });
    }

    // 2. AQI (cache)
    let airDoc = await AirSnapshot.findOne({
      lat: latNum,
      lon: lonNum,
    }).sort({ createdAt: -1 });

    let airPayload;
    if (isFresh(airDoc, 30)) {
      airPayload = airDoc.payload;
    } else {
      const data = await getAirQuality(lat, lon, process.env.OW_API_KEY);
      airPayload = data;
      await AirSnapshot.create({ lat: latNum, lon: lonNum, payload: data });
    }

    // 3. Build advice
    const advice = buildPlantAdvice({
      weatherPayload,
      airPayload,
      plantGroup,
    });

    const c = advice.basicConditions;

    return res.json({
      lat: latNum,
      lon: lonNum,
      plant_group: plantGroup,
      conditions: {
        temp: c.temp,
        humidity: c.humidity,
        rain1h: c.rain1h,
        windSpeed: c.windSpeed,
        uvi: c.uvi,
        aqi: advice.aqi,
        aqi_label: advice.aqiLabel,
      },
      summary: advice.summary,
      tips: advice.tips,
      extraNotes: advice.extraNotes,
    });
  } catch (err) {
    console.error("ERROR in getPlantAdviceController:", err);
    // đảm bảo trả JSON để FE đọc được message
    res
      .status(500)
      .json({ error: "Lỗi server khi tạo gợi ý chăm sóc cây.", detail: err.message });
  }
};
