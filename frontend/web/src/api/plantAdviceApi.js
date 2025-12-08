// src/api/plantAdviceApi.js
import axios from "../api/shared/axiosClient";

const plantAdviceApi = {
  /**
   * Lấy gợi ý chăm sóc cây theo thời tiết + tên cây
   * @param {number} lat
   * @param {number} lon
   * @param {string} plantName
   */
  getAdvice(lat, lon, plantName) {
    return axios.get("/api/plant-advice", {
      params: {
        lat,
        lon,
        plantName,
      },
    });
  },
};

export default plantAdviceApi;
