import React, { useState } from 'react';
import Header from '../components/shared/Header';
import weatherApi from '../api/farmer/weatherApi';

export default function WeatherPage() {
  const [q, setQ] = useState('Hanoi');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.getWeatherUser(q);
      const payload = res?.data?.data || res?.data || null;
      setData(payload);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container p-4">
        <h1>Thời tiết</h1>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12}}>
          <input value={q} onChange={e=>setQ(e.target.value)} className="form-control" />
          <button className="btn btn-primary" onClick={fetchWeather} disabled={loading}>{loading? 'Đang tải':'Lấy thời tiết'}</button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {data ? (
          <div>
            <h4>{data.location?.name || data.city || 'Unknown'}</h4>
            <p>{data.current?.temp_c ?? data.current?.temp ?? '--'}°C • {data.current?.condition?.text}</p>
            <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ) : (
          <div className="text-muted">Chưa có dữ liệu. Bấm 'Lấy thời tiết'.</div>
        )}
      </div>
    </>
  );
}
