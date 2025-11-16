import { http } from '../lib/http.js';
import { ApiError } from '../lib/http.js';

const BASE_WEATHER = 'https://api.openweathermap.org/data/2.5';
const BASE_HISTORY = 'https://history.openweathermap.org/data/2.5';

function getKey(apiKey) {
  const key = apiKey || process.env.OW_API_KEY;
  if (!key) throw new ApiError(500, 'Missing OpenWeather API Key');
  return key;
}

function handleAxios(err, label = 'OpenWeather') {
  const status = err.response?.status || 500;
  const data = err.response?.data;
  const msg =
    typeof data === 'string'
      ? data
      : data
      ? JSON.stringify(data)
      : err.message;
  throw new ApiError(status, `${label} error (${status}): ${msg}`);
}

/** Current weather API */
export async function owCurrent(lat, lon, units, lang, apiKey) {
  const key = getKey(apiKey);
  try {
    const { data } = await http.get(`${BASE_WEATHER}/weather`, {
      params: {
        lat,
        lon,
        appid: key,
        units: units || process.env.OW_UNITS || 'metric',
        lang: lang || process.env.OW_LANG || 'vi',
      },
    });
    return data;
  } catch (err) {
    handleAxios(err, 'OW current');
  }
}

/** One Call – hourly 4 days + daily… (all in one) */
export async function owOneCall(lat, lon, units, lang, apiKey) {
  const key = getKey(apiKey);
  try {
    const { data } = await http.get(`${BASE_WEATHER}/onecall`, {
      params: {
        lat,
        lon,
        appid: key,
        units: units || process.env.OW_UNITS || 'metric',
        lang: lang || process.env.OW_LANG || 'vi',
        // bạn có thể chỉnh lại exclude nếu muốn
        exclude: 'minutely,alerts',
      },
    });
    return data;
  } catch (err) {
    handleAxios(err, 'OW onecall');
  }
}

/** 3-hour forecast 5 days */
export async function owForecast3h(lat, lon, units, lang, apiKey) {
  const key = getKey(apiKey);
  try {
    const { data } = await http.get(`${BASE_WEATHER}/forecast`, {
      params: {
        lat,
        lon,
        appid: key,
        units: units || process.env.OW_UNITS || 'metric',
        lang: lang || process.env.OW_LANG || 'vi',
      },
    });
    return data; // list[] mỗi bước 3h
  } catch (err) {
    handleAxios(err, 'OW 3h forecast');
  }
}

/** Daily forecast 16 days – available trong Developer plan */
export async function owDaily16(lat, lon, units, lang, apiKey) {
  const key = getKey(apiKey);
  try {
    const { data } = await http.get(`${BASE_WEATHER}/forecast/daily`, {
      params: {
        lat,
        lon,
        appid: key,
        cnt: 16,
        units: units || process.env.OW_UNITS || 'metric',
        lang: lang || process.env.OW_LANG || 'vi',
      },
    });
    return data;
  } catch (err) {
    handleAxios(err, 'OW daily16');
  }
}

/** Historical data – dùng history.openweathermap.org */
export async function owHistory(lat, lon, startUnix, endUnix, units, lang, apiKey) {
  const key = getKey(apiKey);
  try {
    const { data } = await http.get(`${BASE_HISTORY}/history/city`, {
      params: {
        lat,
        lon,
        appid: key,
        type: 'hour',        // hourly history
        start: startUnix,    // unix time (seconds)
        end: endUnix,        // unix time (seconds)
        units: units || process.env.OW_UNITS || 'metric',
        lang: lang || process.env.OW_LANG || 'vi',
      },
    });
    return data;
  } catch (err) {
    handleAxios(err, 'OW history');
  }
}

/** Weather map tile URL builder – dùng cho Leaflet/Mapbox */
export function owTileUrl(layer = 'temp_new', z = 0, x = 0, y = 0, apiKey) {
  const key = getKey(apiKey);
  // ví dụ layer: temp_new, clouds_new, precip_new, wind_new, pressure_new, etc.
  return `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${key}`;
}
