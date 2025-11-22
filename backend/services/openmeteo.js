import { http } from '../lib/http.js';


// Geocoding: không cần API key
export async function geocodeByName(query) {
const url = 'https://geocoding-api.open-meteo.com/v1/search';
const { data } = await http.get(url, { params: { name: query, count: 1, language: 'vi' } });
if (!data?.results?.length) return null;
const r = data.results[0];
return {
name: r.name,
country: r.country,
admin1: r.admin1,
latitude: r.latitude,
longitude: r.longitude
};
}


// Weather forecast (ví dụ hourly)
export async function getOpenMeteoForecast(lat, lon) {
const url = 'https://api.open-meteo.com/v1/forecast';
const params = {
latitude: lat,
longitude: lon,
current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',
hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m',
timezone: 'auto'
};
const { data } = await http.get(url, { params });
return data;
}