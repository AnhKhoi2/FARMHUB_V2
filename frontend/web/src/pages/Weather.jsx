import React, { useState } from 'react';
import { Card, Row, Col, Typography, Input, Button, Spin, Alert } from 'antd';
import Header from '../components/shared/Header';
import weatherApi from '../api/farmer/weatherApi';

const { Title, Text } = Typography;

export default function WeatherPage() {
  const [q, setQ] = useState('Can tho');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    if (!q) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await weatherApi.getWeatherUser(q);
      const payload = res?.data?.data?.data || null;
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
      <div style={{ maxWidth: 600, margin: '20px auto', padding: '0 16px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Thời tiết
        </Title>

        {/* Search */}
        <Row gutter={8} style={{ marginBottom: 24 }}>
          <Col flex="auto">
            <Input
              placeholder="Nhập tên thành phố"
              value={q}
              onChange={e => setQ(e.target.value)}
              onPressEnter={fetchWeather}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchWeather} loading={loading}>
              Lấy thời tiết
            </Button>
          </Col>
        </Row>

        {/* Error */}
        {error && <Alert message={error} type="error" style={{ marginBottom: 16 }} />}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Spin tip="Đang tải..." />
          </div>
        )}

        {/* Weather Card */}
        {data && data.raw && (
          <Card hoverable>
            <Row gutter={16} align="middle">
              <Col>
                <img
                  src={`https:${data.raw.current.condition.icon}`}
                  alt={data.raw.current.condition.text}
                  width={64}
                  height={64}
                />
              </Col>
              <Col>
                <Title level={4}>
                  {data.raw.location.name}, {data.raw.location.country}
                </Title>
                <Text>{data.raw.current.condition.text}</Text>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '8px 0' }}>
                  {data.raw.current.temp_c}°C
                </div>
                <Text type="secondary">
                  Cảm giác: {data.raw.current.feelslike_c}°C
                </Text>
                <br />
                <Text type="secondary">
                  Độ ẩm: {data.raw.current.humidity}% | Gió: {data.raw.current.wind_kph} km/h
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Cập nhật: {data.raw.current.last_updated}
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* No Data */}
        {!loading && !data && !error && (
          <Text type="secondary">Chưa có dữ liệu. Bấm "Lấy thời tiết".</Text>
        )}
      </div>
    </>
  );
}
