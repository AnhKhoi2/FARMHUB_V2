import React, { useState } from 'react';
import LocationForm from '../../components/weather/LocationForm.jsx';
import WeatherCard from '../../components/weather/WeatherCard.jsx';
import AirCard from '../../components/weather/AirCard.jsx';
import { getWeather, getAir, getHistory } from '../../api/weather/weatherApi.js';
import WeatherMap from '../../components/weather/WeatherMap.jsx';
import SixteenDayForecast from '../../components/weather/SixteenDayForecast.jsx';


import PlantSelector, { DEMO_PLANTS } from '../../components/weather/PlantSelector.jsx';
import PlantAlerts from '../../components/weather/PlantAlerts.jsx';

export default function Dashboard() {
  const [place, setPlace] = useState(null);

  // current weather (dùng cho WeatherCard)
  const [current, setCurrent] = useState(null);

  // các dữ liệu forecast & history để sau này vẽ chart/bảng
  const [forecast3h, setForecast3h] = useState(null);
  const [daily16, setDaily16] = useState(null);
  const [history, setHistory] = useState(null);


    void forecast3h;
void history;

  const [air, setAir] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [plants] = useState(DEMO_PLANTS); // sau này thay bằng data từ backend
const [selectedPlantId, setSelectedPlantId] = useState(DEMO_PLANTS[0].id);

  async function onResolved(p) {
  setPlace(p);
  setLoading(true);
  setError('');

  try {
    // ✔ Gọi song song 4 API của OpenWeather và Air Pollution
    const [curRes, forecastRes, dailyRes, airRes] = await Promise.all([
      getWeather({
        provider: 'openweather',
        scope: 'current',      // /data/2.5/weather
        lat: p.latitude,
        lon: p.longitude,
      }),
      getWeather({
        provider: 'openweather',
        scope: 'forecast3h',   // /data/2.5/forecast
        lat: p.latitude,
        lon: p.longitude,
      }),
      getWeather({
        provider: 'openweather',
        scope: 'daily16',      // /data/2.5/forecast/daily
        lat: p.latitude,
        lon: p.longitude,
      }),
      getAir({ lat: p.latitude, lon: p.longitude }),
    ]);

    // ✔ Cập nhật state FE
    setCurrent(curRes.data);         // thời tiết hiện tại
    setForecast3h(forecastRes.data); // forecast 3 giờ
    setDaily16(dailyRes.data);       // forecast 16 ngày
    setAir(airRes.data);             // chất lượng không khí

    // ✔ Lấy history 7 ngày gần nhất
    const now = new Date();
    const end = now.toISOString();
    const start = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

    const histRes = await getHistory({
      lat: p.latitude,
      lon: p.longitude,
      start,
      end,
    });

    setHistory(histRes.data);        // lịch sử thời tiết


    
  } catch (err) {
    console.error('Dashboard error:', err);
    setError('Không lấy được dữ liệu thời tiết (xem console).');
  } finally {
    setLoading(false);
  }
}
    const selectedPlant =
  plants.find((p) => p.id === selectedPlantId) || plants[0];
const selectedCropType = selectedPlant?.cropType || 'leafy';


return (
  <div>
    <LocationForm onResolved={onResolved} />

    {place && (
      <p>
        <strong>Địa điểm:</strong> {place.name}, {place.admin1 || ''}{' '}
        {place.country} — ({place.latitude}, {place.longitude})
      </p>
    )}

    {loading && <p>Đang tải dữ liệu…</p>}
    {error && <p style={{ color: 'crimson' }}>{error}</p>}

    {/* Chọn cây */}
    <PlantSelector
      plants={plants}
      selectedId={selectedPlantId}
      onChange={setSelectedPlantId}
    />

    {/* Thời tiết hiện tại + chất lượng không khí */}
    <WeatherCard provider="openweather" data={current} />
    <AirCard data={air} />

    {/* Bản đồ thời tiết */}
    {place && (
      <WeatherMap lat={place.latitude} lon={place.longitude} />
    )}

    {/* Cảnh báo tổng hợp theo cây đang chọn */}
    {daily16 && (
      <PlantAlerts daily16={daily16} cropType={selectedCropType} />
    )}

    {/* Bảng 16 ngày + gợi ý tưới/bón chi tiết */}
    {daily16 && (
      <SixteenDayForecast
        data={daily16}
        cropType={selectedCropType}
      />
    )}

  </div>
);

}
