export function pickOpenMeteo(nowData) {
  if (!nowData) return null;
  return {
    source: "open-meteo",
    time: nowData?.current?.time,
    temperature: nowData?.current?.temperature_2m,
    wind_speed: nowData?.current?.wind_speed_10m,
    relative_humidity: nowData?.current?.relative_humidity_2m,
    precipitation: nowData?.current?.precipitation
  };
}

export function pickOpenWeather(onecall) {
  if (!onecall) return null;
  return {
    source: "openweather",
    current: {
      dt: onecall.current?.dt,
      temp: onecall.current?.temp,
      feels_like: onecall.current?.feels_like,
      humidity: onecall.current?.humidity,
      wind_speed: onecall.current?.wind_speed,
      weather: onecall.current?.weather?.[0]
    },
    hourly: onecall.hourly?.slice(0, 24) || [],
    daily: onecall.daily?.slice(0, 7) || []
  };
}

export function pickOpenWeatherAir(air) {
  const item = air?.list?.[0];
  if (!item) return null;
  return {
    source: "openweather-air",
    aqi: item.main?.aqi,           // 1..5
    components: item.components,   // pm2_5, pm10, no2, o3...
    dt: item.dt
  };
}

export function combinePayload({ location, omNow, owOneCall, air }) {
  return {
    location,
    open_meteo: pickOpenMeteo(omNow),
    openweather: pickOpenWeather(owOneCall),
    air: pickOpenWeatherAir(air)
  };
}
