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
import Footer from "../components/shared/Footer";


const DEFAULT_QUERY = "";

// (giả sử bạn có DEFAULT_LAT/LON ở đâu đó, nếu không thì thêm vào đây)
const DEFAULT_LAT = 10.7769;
const DEFAULT_LON = 106.7009;

// --- Component Progress Bar mới ---
const ProgressBar = ({ value, max, colorClass, label }) => {
  // Giới hạn giá trị ở mức 100%
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="mt-1">
      <small className="text-muted d-block fw-semibold">{label}: {value}{label === 'Độ ẩm' ? '%' : ''}</small>
      <div className={`visual-progress`}>
        <div 
          className={`visual-progress-bar ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};
// ---------------------------------

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
        <h1 className="mb-4 text-success fw-bold app-header">🌾 Thời tiết & Nông nghiệp</h1>

      {/* Search */}
      <form className="row g-2 mb-4" onSubmit={handleSearch}>
        <div className="col-md-5">
          <input
            type="text"
            className="form-control"
            placeholder="Nhập tên khu vực (ví dụ: Cần thơ)"
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
            🔍 Tìm kiếm
          </button>
        </div>

        <div className="col-md-4">
          <button
            type="button"
            className="btn btn-outline-success w-100" 
            onClick={handleUseMyLocation}
            disabled={loading || usingMyLocation}
          >
            {usingMyLocation ? "Đang lấy vị trí..." : "📍 Dùng vị trí hiện tại"}
          </button>
        </div>
      </form>

      {/* Chọn nhóm cây trồng để tư vấn - Đưa lên cao */}
      <div className="row g-2 mb-3">
        <div className="col-md-4">
          <label className="form-label small fw-bold text-success">Chọn loại cây trồng:</label>
          <select
            className="form-select border-success"
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
        <p className="text-muted mb-4">
          Địa điểm đang xem:{" "}
          <strong className="text-success">
            {place.name}
            {place.admin1 ? `, ${place.admin1}` : ""}
            {place.country ? `, ${place.country}` : ""}
          </strong>
          {place.latitude && place.longitude && (
            <span className="ms-2 small">
              (Tọa độ: {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)})
            </span>
          )}
        </p>
      )}

      {loading && <p className="text-success">Đang tải dữ liệu...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* Current + AQI */}
          <div className="row">
            {/* Thời tiết hiện tại */}
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">☀️ Điều kiện hiện tại</h5>
                  <p className="mb-1 fw-bold fs-5 text-success">{cityName}</p>

                  {currentWeather ? (
                    <>
                      <div className="d-flex align-items-center mb-3 main-weather-info">
                        {icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${icon}@4x.png`} // Icon lớn hơn
                            alt="weather icon"
                            style={{ width: 100, height: 100 }}
                          />
                        )}
                        <div className="ms-3">
                          <h2 className="mb-0">
                            <span className="temp-val">{Math.round(temp)}</span>
                            °C
                          </h2>
                          {description && (
                            <div className="text-capitalize text-success fw-bold">
                              {translateDescription(description)} 
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="row g-3">
                        {feelsLike != null && (
                          <div className="col-md-6">
                            🌡️ Cảm giác như:{" "}
                            <span className="detail-val">
                              {Math.round(feelsLike)}°C
                            </span>
                          </div>
                        )}
                        
                        {/* THÊM PROGRESS BAR CHO ĐỘ ẨM */}
                        {humidity != null && (
                          <div className="col-md-6">
                            <ProgressBar 
                              value={humidity} 
                              max={100} 
                              colorClass="bg-info" 
                              label="Độ ẩm" 
                            />
                          </div>
                        )}

                        {/* THÊM PROGRESS BAR CHO TỐC ĐỘ GIÓ */}
                        {windSpeed != null && (
                          <div className="col-md-6">
                            <ProgressBar 
                              value={windSpeed} 
                              max={15} /* Giả định max 15 m/s là gió mạnh */ 
                              colorClass="bg-success" 
                              label="Tốc độ gió (m/s)" 
                            />
                          </div>
                        )}
                      </div>
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
                  <h5 className="card-title">💨 Chất lượng không khí (AQI)</h5>

                  {aqiValue ? (
                    <>
                      {/* Badge màu theo mức AQI */}
                      <div className={`aqi-badge mb-3 ${aqiInfo.colorClass}`}>
                        <span className="aqi-badge-main">
                          AQI {aqiValue} – {aqiInfo.label}
                        </span>
                      </div>

                      {/* Mô tả ngắn mức AQI */}
                      <p className="mb-3 fw-semibold text-dark">
                        {aqiInfo.desc}
                      </p>

                      {/* Các thông số chi tiết với kí hiệu + tên tiếng Việt */}
                      <p className="mb-1 small">
                        <strong>PM2.5</strong> (bụi mịn):{" "}
                        <span className="fw-bold">{formatVal(pm2_5)}</span> µg/m³
                        &nbsp;—&nbsp;
                        <strong>PM10</strong> (bụi thô):{" "}
                        <span className="fw-bold">{formatVal(pm10)}</span> µg/m³
                      </p>

                      <p className="mb-2 small">
                        <strong>O₃</strong> (ozon): {formatVal(o3)} µg/m³
                        &nbsp;—&nbsp;
                        <strong>NO₂</strong> (nitơ): {formatVal(no2)} µg/m³
                        &nbsp;—&nbsp;
                        <strong>SO₂</strong> (lưu huỳnh): {formatVal(so2)} µg/m³
                        &nbsp;—&nbsp;
                        <strong>CO</strong> (carbon): {formatVal(co)} µg/m³
                      </p>

                      <small className="text-muted d-block">
                        Đơn vị: µg/m³.
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
                      3 – T.Bình
                    </span>
                    <span className="aqi-legend-chip aqi-poor">4 – Kém</span>
                    <span className="aqi-legend-chip aqi-very-poor">
                      5 – Rất Kém
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gợi ý chăm sóc cây theo thời tiết - Card nổi bật */}
          <div className="card shadow-lg mt-4 plant-advice-card-wow">
            <div className="card-body">
              <h5 className="card-title">🌱 Gợi ý chăm sóc cây trồng</h5>

              {adviceLoading && <p className="text-success">Đang phân tích thời tiết và đưa ra gợi ý...</p>}

              {!adviceLoading && advice && (
                <PlantAdviceCard data={advice} />
              )}

              {!adviceLoading && !advice && (
                <p className="text-muted mb-0">
                  Chưa có gợi ý. Hãy tìm địa điểm, chọn loại cây và tải dữ liệu thời tiết để nhận tư vấn.
                </p>
              )}
            </div>
          </div>

          {/* Forecast 3h – dạng thẻ */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title">⏰ Dự báo 24 giờ tới (Mỗi 3h)</h5>
              {forecast.length > 0 ? (
                <div className="d-flex flex-wrap gap-3 forecast-cards">
                  {forecast.map((item, index) => {
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
                    const translatedDesc = translateDescription(desc); // Dịch mô tả

                    return (
                      <div
                        key={item.dt}
                        className="forecast-card border rounded p-2 text-center"
                        style={{ animationDelay: `${index * 0.1}s` }} /* Thêm delay cho hiệu ứng trượt */
                      >
                        <div className="small text-muted">{day}</div>
                        <div className="fw-bold">{hour}</div>

                        {icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${icon}.png`}
                            alt="icon"
                            style={{ width: 40, height: 40 }}
                            className="my-1"
                          />
                        )}

                        <div className="fw-bold text-success fs-5">{temp}°C</div>

                        {translatedDesc && (
                          <div className="small text-capitalize">
                            {translatedDesc}
                          </div>
                        )}

                        {hum != null && (
                          <div className="small text-muted mt-1">
                            💧 {hum}%
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


          {/* Lịch sử thời tiết */}
          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h5 className="card-title">📊 Lịch sử nhiệt độ (Theo giờ)</h5>

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
                    className="btn btn-success w-100" 
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
                        const translatedDesc = translateDescription(desc); // Dịch mô tả

                        return (
                          <tr key={item.dt}>
                            <td>{timeStr}</td>
                            <td className="fw-bold text-success">
                              {temp != null ? Math.round(temp) : "-"}
                            </td>
                            <td>{humidity != null ? humidity : "-"}</td>
                            <td className="text-capitalize small">
                              {translatedDesc || "-"}
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
        </>
      )}
      </div>
      <Footer /> 
    </>
  );
};

export default WeatherPage;