// src/api/weatherApi.js
import axiosClient from "../api/shared/axiosClient"; 
// ❗ Quan trọng: đường dẫn phải là "../axiosClient", KHÔNG phải "../api/weatherApi"

const weatherApi = {
  searchPlace(q) {
    return axiosClient.get("/api/geocode/search", {
      params: { q },
    });
  },

  getCurrent(lat, lon) {
    return axiosClient.get("/api/weather", {
      params: {
        provider: "openweather",
        scope: "current",
        lat,
        lon,
        units: "metric",
        lang: "vi",
      },
    });
  },

  getForecast3h(lat, lon) {
    return axiosClient.get("/api/weather", {
      params: {
        provider: "openweather",
        scope: "forecast3h",
        lat,
        lon,
        units: "metric",
        lang: "vi",
      },
    });
  },

  getAir(lat, lon) {
    return axiosClient.get("/api/air", {
      params: { lat, lon },
    });
  },

  // 🔥 HÀM HISTORY Ở ĐÂY!
  getHistory(lat, lon, start, end) {
    return axiosClient.get("/api/weather/history", {
      params: {
        lat,
        lon,
        start,
        end,
        units: "metric",
        lang: "vi",
      },
    });
  },
};

export default weatherApi;
