// src/pages/WeatherPage.jsx
import React, { useEffect, useState } from "react";
import weatherApi from "../api/weatherApi";
import "../css/WeatherPage.css";
import {
  translateDescription,
  translateWeather,
} from "../utils/weatherTranslation";
import plantAdviceApi from "../api/plantAdviceApi.js";
import PlantAdviceCard from "../components/PlantAdviceCard.jsx";
import Header from "../components/shared/Header";

const DEFAULT_QUERY = "";

// (giả sử bạn có DEFAULT_LAT/LON ở đâu đó, nếu không thì thêm vào đây)
const DEFAULT_LAT = 10.7769;
const DEFAULT_LON = 106.7009;

const getAqiInfo = (aqi) => {
  switch (aqi) {
    case 1:
      return {
        label: "Tốt",
        desc: "Không khí trong lành, an toàn cho mọi người.",
        colorClass: "aqi-good",
      };
    case 2:
      return {
        label: "Khá",
        desc: "Có thể chấp nhận được, nhóm nhạy cảm vẫn ổn.",
        colorClass: "aqi-fair",
      };
    case 3:
      return {
        label: "Trung bình",
        desc: "Nhóm nhạy cảm (hen, tim mạch…) nên hạn chế ra ngoài lâu.",
        colorClass: "aqi-moderate",
      };
    case 4:
      return {
        label: "Kém",
        desc: "Không khí kém, nên hạn chế hoạt động ngoài trời.",
        colorClass: "aqi-poor",
      };
    case 5:
      return {
        label: "Rất kém",
        desc: "Ô nhiễm nặng, nên ở trong nhà nếu có thể.",
        colorClass: "aqi-very-poor",
      };
    default:
      return {
        label: "Không xác định",
        desc: "Chưa có dữ liệu đánh giá AQI.",
        colorClass: "aqi-unknown",
      };
  }
};

const WeatherPage = () => {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [place, setPlace] = useState(null);
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [air, setAir] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usingMyLocation, setUsingMyLocation] = useState(false);

  // lưu tọa độ đang dùng (từ search hoặc vị trí hiện tại)
  const [coords, setCoords] = useState(null);

  // ---- STATE CHO GỢI Ý CHĂM SÓC CÂY ----
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [selectedPlantGroup, setSelectedPlantGroup] = useState("leaf_vegetable");

  // lịch sử
  const todayISO = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoISO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [historyStart, setHistoryStart] = useState(sevenDaysAgoISO);
  const [historyEnd, setHistoryEnd] = useState(todayISO);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Trình duyệt không hỗ trợ lấy vị trí hiện tại.");
      return;
    }

    setError("");
    setUsingMyLocation(true);
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Cập nhật thông tin “place” cho hợp lý
        setPlace({
          name: "Vị trí hiện tại",
          latitude: lat,
          longitude: lon,
          country: "",
          admin1: "",
        });

        await loadByCoords(lat, lon);
        setUsingMyLocation(false);
      },
      (err) => {
        console.error(err);
        setError(
          "Không lấy được vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
        );
        setUsingMyLocation(false);
        setLoading(false);
      }
    );
  };

  const loadByCoords = async (lat, lon) => {
    setLoading(true);
    setError("");
    setCoords({ lat, lon }); // lưu lại toạ độ đang dùng

    try {
      const [curRes, fcRes, airRes] = await Promise.all([
        weatherApi.getCurrent(lat, lon),
        weatherApi.getForecast3h(lat, lon),
        weatherApi.getAir(lat, lon),
      ]);

      setCurrent(curRes.data?.data || null);
      setForecast(fcRes.data?.data?.list?.slice(0, 8) || []); // ~24h tới
      setAir(airRes.data?.data || null);
    } catch (err) {
      console.error(err);
      setError("Không tải được dữ liệu thời tiết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async () => {
    setHistoryLoading(true);
    setError("");

    try {
      // ưu tiên dùng coords đã lưu; nếu chưa có, fallback về DEFAULT_LAT/LON
      const baseLat = coords?.lat ?? DEFAULT_LAT;
      const baseLon = coords?.lon ?? DEFAULT_LON;

      const res = await weatherApi.getHistory(
        baseLat,
        baseLon,
        historyStart,
        historyEnd
      );

      // openweather history trả về list[] dạng hourly theo type=hour
      const raw = res.data?.data;
      const list = raw?.list || [];

      setHistoryList(list);
    } catch (err) {
      console.error(err);
      setError("Không tải được dữ liệu lịch sử.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError("");
    try {
      const res = await weatherApi.searchPlace(query);
      const p = res.data?.place;
      if (!p) {
        setError("Không tìm thấy địa điểm.");
        return;
      }
      setPlace(p);

      // Place model: latitude / longitude
      await loadByCoords(p.latitude, p.longitude);
    } catch (err) {
      console.error(err);
      setError("Lỗi tìm kiếm địa điểm.");
    }
  };

  // ---- CALL API GỢI Ý CHĂM SÓC KHI CÓ COORDS HOẶC ĐỔI NHÓM CÂY ----
  useEffect(() => {
  if (!coords) return;

  const fetchAdvice = async () => {
    try {
      setAdviceLoading(true);
      const res = await plantAdviceApi.getAdvice(
        coords.lat,
        coords.lon,
        selectedPlantGroup
      );

      // BE trả thẳng JSON => res.data chính là object advice
      setAdvice(res.data);
    } catch (err) {
      console.error(
        "Lỗi lấy gợi ý chăm sóc cây:",
        err.response?.data || err.message
      );
      setAdvice(null);
    } finally {
      setAdviceLoading(false);
    }
  };

  fetchAdvice();
}, [coords, selectedPlantGroup]);


  // load default lần đầu (tuỳ bạn muốn auto load HCM hay để trống)
  // useEffect(() => {
  //   handleSearch();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const aqiValue = air?.list?.[0]?.main?.aqi;
  const aqiInfo = getAqiInfo(aqiValue);

  const components = air?.list?.[0]?.components || {};
  const { pm2_5, pm10, o3, no2, so2, co } = components;

  const formatVal = (v, decimals = 2) =>
    v != null ? v.toFixed(decimals) : "-";

  const currentWeather = current;
  const icon = currentWeather?.weather?.[0]?.icon;
  const description = currentWeather?.weather?.[0]?.description;
  const temp = currentWeather?.main?.temp;
  const feelsLike = currentWeather?.main?.feels_like;
  const humidity = currentWeather?.main?.humidity;
  const windSpeed = currentWeather?.wind?.speed;
  const cityName =
    place?.name || currentWeather?.name || "Địa điểm không xác định";

  return (
    <>
      <Header />
      <div className="container py-4">
        <h1 className="mb-3">Thời tiết & Chất lượng không khí</h1>

      {/* Search */}
      <form className="row g-2 mb-4" onSubmit={handleSearch}>
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên địa điểm (ví dụ: Ho Chi Minh City)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <button
            type="submit"
            className="btn btn-success w-100"
            disabled={loading}
          >
            Tìm kiếm
          </button>
        </div>

        <div className="col-md-4">
          <button
            type="button"
            className="btn btn-outline-primary w-100"
            onClick={handleUseMyLocation}
            disabled={loading || usingMyLocation}
          >
            {usingMyLocation ? "Đang lấy vị trí..." : "Dùng vị trí hiện tại"}
          </button>
        </div>
      </form>

      {/* Chọn nhóm cây trồng để tư vấn */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <label className="form-label small">Nhóm cây trồng</label>
          <select
            className="form-select"
            value={selectedPlantGroup}
            onChange={(e) => setSelectedPlantGroup(e.target.value)}
          >
            <option value="leaf_vegetable">Rau ăn lá</option>
            <option value="root_vegetable">Rau/cây củ</option>
            <option value="fruit_short_term">Rau, quả ngắn ngày</option>
            <option value="fruit_long_term">Cây ăn quả dài ngày</option>
            <option value="bean_family">Cây họ đậu</option>
            <option value="herb">Cây gia vị</option>
            <option value="flower_vegetable">Rau ăn hoa</option>
            <option value="other">Khác</option>
          </select>
          <small className="text-muted">
            Dùng để gợi ý chăm sóc cây phù hợp với loại cây bạn trồng.
          </small>
        </div>
      </div>

      {place && (
        <p className="text-muted">
          Địa điểm:{" "}
          <strong>
            {place.name}
            {place.admin1 ? `, ${place.admin1}` : ""}
            {place.country ? `, ${place.country}` : ""}
          </strong>
          {place.latitude && place.longitude && (
            <span className="ms-2">
              ({place.latitude.toFixed(3)}, {place.longitude.toFixed(3)})
            </span>
          )}
        </p>
      )}

      {loading && <p>Đang tải dữ liệu...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* Current + AQI */}
          <div className="row">
            {/* Thời tiết hiện tại */}
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">Thời tiết hiện tại</h5>
                  <p className="mb-1 fw-bold">{cityName}</p>

                  {currentWeather ? (
                    <>
                      <div className="d-flex align-items-center mb-2">
                        {icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
                            alt="weather icon"
                            style={{ width: 64, height: 64 }}
                          />
                        )}
                        <div className="ms-3">
                          <h2 className="mb-0">{Math.round(temp)}°C</h2>
                          {description && (
                            <div className="text-capitalize text-muted">
                              {description}
                            </div>
                          )}
                        </div>
                      </div>

                      <ul className="list-unstyled mb-0">
                        {feelsLike != null && (
                          <li>Cảm giác như: {Math.round(feelsLike)}°C</li>
                        )}
                        {humidity != null && <li>Độ ẩm: {humidity}%</li>}
                        {windSpeed != null && (
                          <li>Tốc độ gió: {windSpeed} m/s</li>
                        )}
                      </ul>
                    </>
                  ) : (
                    <p>Chưa có dữ liệu thời tiết.</p>
                  )}
                </div>
              </div>
            </div>

            {/* AQI */}
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">Chất lượng không khí (AQI)</h5>

                  {aqiValue ? (
                    <>
                      {/* Badge màu theo mức AQI */}
                      <div className={`aqi-badge mb-2 ${aqiInfo.colorClass}`}>
                        <span className="aqi-badge-main">
                          AQI {aqiValue} – {aqiInfo.label}
                        </span>
                      </div>

                      {/* Mô tả ngắn mức AQI */}
                      <p className="mb-2 small">{aqiInfo.desc}</p>

                      {/* Các thông số chi tiết với kí hiệu + tên tiếng Việt */}
                      <p className="mb-1 small">
                        <strong>PM2.5</strong> (bụi mịn &le; 2,5&nbsp;µm):{" "}
                        {formatVal(pm2_5)} µg/m³ &nbsp;—&nbsp;
                        <strong>PM10</strong> (bụi thô &le; 10&nbsp;µm):{" "}
                        {formatVal(pm10)} µg/m³
                      </p>

                      <p className="mb-2 small">
                        <strong>O₃</strong> (ozon tầng thấp): {formatVal(o3)}{" "}
                        µg/m³ &nbsp;—&nbsp;
                        <strong>NO₂</strong> (nitơ dioxit): {formatVal(no2)}{" "}
                        µg/m³ &nbsp;—&nbsp;
                        <strong>SO₂</strong> (lưu huỳnh dioxit):{" "}
                        {formatVal(so2)} µg/m³ &nbsp;—&nbsp;
                        <strong>CO</strong> (carbon monoxit): {formatVal(co)}{" "}
                        µg/m³
                      </p>

                      <small className="text-muted d-block">
                        Đơn vị: µg/m³. Nguồn: OpenWeather Air Pollution API.
                      </small>
                    </>
                  ) : (
                    <p>Chưa có dữ liệu AQI.</p>
                  )}

                  <hr />
                  <div className="d-flex flex-wrap gap-2 small">
                    <span className="aqi-legend-chip aqi-good">1 – Tốt</span>
                    <span className="aqi-legend-chip aqi-fair">2 – Khá</span>
                    <span className="aqi-legend-chip aqi-moderate">
                      3 – Trung bình
                    </span>
                    <span className="aqi-legend-chip aqi-poor">4 – Kém</span>
                    <span className="aqi-legend-chip aqi-very-poor">
                      5 – Rất kém
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gợi ý chăm sóc cây theo thời tiết */}
          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h5 className="card-title mb-3">
                Gợi ý chăm sóc cây theo thời tiết
              </h5>

              {adviceLoading && <p>Đang tải gợi ý chăm sóc...</p>}

              {!adviceLoading && advice && (
                <PlantAdviceCard data={advice} />
              )}

              {!adviceLoading && !advice && (
                <p className="text-muted mb-0">
                  Chưa có gợi ý. Hãy tìm địa điểm hoặc dùng vị trí hiện tại để
                  lấy dữ liệu thời tiết.
                </p>
              )}
            </div>
          </div>

          {/* Lịch sử thời tiết */}
          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h5 className="card-title mb-3">Lịch sử nhiệt độ (theo giờ)</h5>

              {/* Chọn khoảng ngày */}
              <div className="row g-2 mb-3">
                <div className="col-md-4">
                  <label className="form-label small">Từ ngày</label>
                  <input
                    type="date"
                    className="form-control"
                    value={historyStart}
                    onChange={(e) => setHistoryStart(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small">Đến ngày</label>
                  <input
                    type="date"
                    className="form-control"
                    value={historyEnd}
                    onChange={(e) => setHistoryEnd(e.target.value)}
                  />
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100"
                    onClick={handleLoadHistory}
                    disabled={historyLoading}
                  >
                    {historyLoading ? "Đang tải..." : "Xem lịch sử"}
                  </button>
                </div>
              </div>

              {/* Bảng lịch sử */}
              {historyList && historyList.length > 0 ? (
                <div className="table-responsive history-table-wrapper">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Nhiệt độ (°C)</th>
                        <th>Độ ẩm (%)</th>
                        <th>Mô tả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyList.map((item) => {
                        const dt = new Date(item.dt * 1000);
                        const timeStr = dt.toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const temp = item.main?.temp;
                        const humidity = item.main?.humidity;
                        const desc = item.weather?.[0]?.description;

                        return (
                          <tr key={item.dt}>
                            <td>{timeStr}</td>
                            <td>{temp != null ? Math.round(temp) : "-"}</td>
                            <td>{humidity != null ? humidity : "-"}</td>
                            <td className="text-capitalize">
                              {desc || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted mb-0">
                  Chưa có dữ liệu lịch sử. Hãy chọn khoảng ngày và bấm "Xem lịch
                  sử".
                </p>
              )}
            </div>
          </div>

          {/* Forecast 3h – dạng thẻ */}
          <div className="card shadow-sm mt-3">
            <div className="card-body">
              <h5 className="card-title mb-3">
                Dự báo trong ~24 giờ tới (3h / lần)
              </h5>
              {forecast.length > 0 ? (
                <div className="d-flex flex-wrap gap-3 forecast-cards">
                  {forecast.map((item) => {
                    const date = item.dt_txt
                      ? new Date(item.dt_txt)
                      : new Date(item.dt * 1000);

                    const hour = date.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const day = date.toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    });

                    const temp = Math.round(item.main?.temp);
                    const hum = item.main?.humidity;
                    const desc = item.weather?.[0]?.description;
                    const icon = item.weather?.[0]?.icon;

                    return (
                      <div
                        key={item.dt}
                        className="forecast-card border rounded p-2 text-center"
                        style={{ minWidth: 110, maxWidth: 140 }}
                      >
                        <div className="small text-muted">{day}</div>
                        <div className="fw-semibold">{hour}</div>

                        {icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${icon}.png`}
                            alt="icon"
                            style={{ width: 40, height: 40 }}
                            className="my-1"
                          />
                        )}

                        <div className="fw-bold">{temp}°C</div>

                        {desc && (
                          <div className="small text-capitalize">{desc}</div>
                        )}

                        {hum != null && (
                          <div className="small text-muted mt-1">
                            Độ ẩm: {hum}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>Chưa có dữ liệu dự báo.</p>
              )}
            </div>
          </div>
        </>
      )}
      </div>
    </>
  );
};

export default WeatherPage;
