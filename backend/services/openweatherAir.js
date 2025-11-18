import { http, ApiError } from '../lib/http.js';


const BASE = 'https://api.openweathermap.org/data/2.5/air_pollution';


export async function getAirQuality(lat, lon, apiKey) {
if (!apiKey) throw new ApiError(500, 'Missing OpenWeather API Key');
const { data } = await http.get(BASE, { params: { lat, lon, appid: apiKey } });
return data; // có aqi + thành phần: pm2_5, pm10, o3, no2, so2, co
}