// src/api/plantAdviceApi.js
import axiosClient from "../api/shared/axiosClient.js";

const plantAdviceApi = {
  getAdvice(lat, lon, plantGroup) {
    return axiosClient.get("/api/gardening/advice", {
      params: {
        lat,
        lon,
        plant_group: plantGroup,
        lang: "vi",
      },
    });
  },
};

export default plantAdviceApi;
