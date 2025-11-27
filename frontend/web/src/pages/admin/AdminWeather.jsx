import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import weatherApi from '../../api/farmer/weatherApi';

export default function AdminWeather() {
  const [q, setQ] = useState('Hanoi');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await weatherApi.getWeather(q);
      const payload = res?.data?.data || res?.data || null;
      setData(payload);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const getPayload = () => {
    if (!data) return null;
    if (data.provider === 'external' && data.raw) return data.raw;
    if (data.current) return data;
    return data.raw || data;
  };

  const payload = getPayload();

  return (
    <AdminLayout>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">THỜI TIẾT</h5>

          <div className="d-flex gap-2 mb-3">
            <input className="form-control" value={q} onChange={e => setQ(e.target.value)} placeholder="Thành phố hoặc vị trí" />
            <button className="btn btn-primary" onClick={fetchWeather} disabled={loading}>{loading? 'Đang tải...':'Lấy dữ liệu'}</button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          {payload ? (
            <div className="row">
              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-body d-flex align-items-center">
                    <div>
                      <h5 className="h3 mb-0">{payload.location?.name || payload.city || 'Không rõ'}</h5>
                      <div className="text-muted small">{payload.location?.country || ''} • {payload.location?.localtime || payload.current?.last_updated || ''}</div>
                    </div>
                    <div className="ms-auto text-end">
                      <div className="h1 mb-0">{payload.current?.temp_c ?? payload.current?.temp ?? '--'}°C</div>
                      <div className="small text-muted">Cảm giác như {payload.current?.feelslike_c ?? payload.current?.feelslike ?? '--'}°C</div>
                    </div>
                  </div>
                  <div className="card-footer d-flex align-items-center">
                    {payload.current?.condition?.icon && (
                      <img src={payload.current.condition.icon.startsWith('http') ? payload.current.condition.icon : 'https:' + payload.current.condition.icon} alt="icon" style={{width:48,height:48}} />
                    )}
                    <div className="ms-3">
                      <div className="fw-semibold">{payload.current?.condition?.text}</div>
                      <div className="small text-muted">Gió {payload.current?.wind_kph} kph • Độ ẩm {payload.current?.humidity}%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Dữ liệu thô</h6>
                    <pre style={{whiteSpace:'pre-wrap',maxHeight:320,overflow:'auto'}}>{JSON.stringify(payload, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted">Chưa có dữ liệu. Nhấn 'Lấy dữ liệu'.</div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
