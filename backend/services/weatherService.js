const WEATHER_API_URL = process.env.WEATHER_API_URL || null; // e.g. https://api.weatherapi.com/v1/current.json
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || null;

export async function fetchWeather(q) {
  if (!q) throw new Error('Missing location query');

  // If there's no configured external API, return a small mock for dev convenience
  if (!WEATHER_API_URL) {
    return {
      provider: 'mock',
      location: q,
      current: {
        temp_c: 25,
        condition: 'Sunny',
        wind_kph: 5,
        humidity: 60,
      },
    };
  }

  // Build URL. Support simple template replacement or ?q= style
  let url = WEATHER_API_URL;
  if (url.includes('{q}')) {
    url = url.replace('{q}', encodeURIComponent(q));
    if (WEATHER_API_KEY) url = url.replace('{key}', encodeURIComponent(WEATHER_API_KEY));
  } else {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}q=${encodeURIComponent(q)}`;
    if (WEATHER_API_KEY) url += `&key=${encodeURIComponent(WEATHER_API_KEY)}`;
  }

  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Weather API error: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return { provider: 'external', raw: data };
}

export default { fetchWeather };
