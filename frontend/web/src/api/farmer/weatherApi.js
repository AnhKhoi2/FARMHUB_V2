import axiosClient from "../shared/axiosClient";

function getWeather(q) {
  return axiosClient.get("/admin/weather", { params: { q } });
}

function getWeatherUser(q) {
  // user-facing endpoint on backend: /admin/weather/user
  return axiosClient.get("/admin/weather/user", { params: { q } });
}

const weatherApi = { getWeather, getWeatherUser };

export default weatherApi;
