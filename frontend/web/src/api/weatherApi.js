import axiosClient from "./axiosClient";

function getWeather(q) {
  return axiosClient.get("/admin/weather", { params: { q } });
}

const weatherApi = { getWeather };

export default weatherApi;
