import axiosClient from './axiosClient';

export function getWeather(q) {
  return axiosClient.get(`/admin/weather?q=${encodeURIComponent(q)}`);
}

export default { getWeather };
