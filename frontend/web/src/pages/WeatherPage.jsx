// src/pages/WeatherPage.jsx
import React, {  useState } from "react";
import weatherApi from "../api/weatherApi";
import "../css/WeatherPage.css";
import { translateDescription } from "../utils/weatherTranslation";
import plantAdviceApi from "../api/plantAdviceApi.js";
import PlantAdviceCard from "../components/PlantAdviceCard.jsx";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

const DEFAULT_QUERY = "";
const DEFAULT_LAT = 10.7769;
const DEFAULT_LON = 106.7009;

// --- Progress Bar cho độ ẩm, gió ---
const ProgressBar = ({ value, max, colorClass, label }) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="mt-1">
      <small className="text-muted d-block fw-semibold">
        {label}: {value}
        {label === "Độ ẩm" ? "%" : ""}
      </small>
      <div className="visual-progress">
        <div
          className={`visual-progress-bar ${colorClass}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

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

  // toạ độ đang dùng
  const [coords, setCoords] = useState(null);

  // ---- GỢI Ý CHĂM SÓC CÂY ----
  const [plantName, setPlantName] = useState("");
  const [advice, setAdvice] = useState(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState("");
  const [hasRequestedAdvice, setHasRequestedAdvice] = useState(false);

  // ---- LỊCH SỬ THỜI TIẾT ----
  const todayISO = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoISO = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .slice(0, 10);

  const [historyStart, setHistoryStart] = useState(sevenDaysAgoISO);
  const [historyEnd, setHistoryEnd] = useState(todayISO);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // ====== HANDLERS THỜI TIẾT ======

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

        await loadByCoords(lat, lon, { fromMyLocation: true });
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

  const loadByCoords = async (lat, lon, options = {}) => {
    const { fromMyLocation = false } = options;

    setLoading(true);
    setError("");
    setCoords({ lat, lon });

    try {
      const [curRes, fcRes, airRes] = await Promise.all([
        weatherApi.getCurrent(lat, lon),
        weatherApi.getForecast3h(lat, lon),
        weatherApi.getAir(lat, lon),
      ]);

      const curData = curRes.data?.data;
      setCurrent(curData || null);
      setForecast(fcRes.data?.data?.list?.slice(0, 8) || []);
      setAir(airRes.data?.data || null);

      if (fromMyLocation && curData) {
        const detectedPlace = {
          name: curData.name || "Vị trí hiện tại",
          latitude: lat,
          longitude: lon,
          country: curData.sys?.country || "",
          admin1: curData.sys?.state || "",
        };
        setPlace(detectedPlace);
      }
    } catch (err) {
      console.error(err);
      setError("Không tải được dữ liệu thời tiết. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError("");

    if (!query.trim()) {
      setError("Vui lòng nhập tên khu vực.");
      return;
    }

    try {
      const res = await weatherApi.searchPlace(query);
      const p = res.data?.place;
      if (!p) {
        setError("Không tìm thấy địa điểm.");
        return;
      }
      setPlace(p);
      await loadByCoords(p.latitude, p.longitude);
    } catch (err) {
      console.error(err);
      setError("Lỗi tìm kiếm địa điểm.");
    }
  };

  const handleLoadHistory = async () => {
    setHistoryLoading(true);
    setError("");

    try {
      const baseLat = coords?.lat ?? DEFAULT_LAT;
      const baseLon = coords?.lon ?? DEFAULT_LON;

      const res = await weatherApi.getHistory(
        baseLat,
        baseLon,
        historyStart,
        historyEnd
      );

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

  // ====== HANDLER GỢI Ý CHĂM SÓC CÂY (CHỈ GỌI KHI BẤM NÚT) ======

  const handleGetPlantAdvice = async () => {
    setHasRequestedAdvice(true);
    setAdviceError("");
    setAdvice(null);

    if (!coords) {
      setAdviceError(
        "Vui lòng chọn địa điểm hoặc dùng vị trí hiện tại trước khi xin gợi ý."
      );
      return;
    }

    if (!plantName.trim()) {
      setAdviceError("Vui lòng nhập tên cây bạn muốn trồng.");
      return;
    }

    try {
      setAdviceLoading(true);

      const res = await plantAdviceApi.getAdvice(
        coords.lat,
        coords.lon,
        plantName.trim()
      );

      setAdvice(res.data);
    } catch (err) {
      console.error(
        "Lỗi gợi ý chăm sóc cây:",
        err.response?.data || err.message
      );
      setAdviceError(
        err.response?.data?.error ||
          "Không lấy được gợi ý chăm sóc cây. Vui lòng thử lại sau."
      );
    } finally {
      setAdviceLoading(false);
    }
  };

  // ====== DỮ LIỆU HIỂN THỊ ======

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
      <div className="weather-page-root ">
        <div className="container">
          <h1 style={{ fontWeight: 700, fontSize: "26px" }}>Thời Tiết & Nông Nghiệp</h1>
          <p className="text-muted mb-3 ">
            Xem thời tiết, chất lượng không khí và chỉ khi cần thì nhấn nút để AI
            gợi ý chăm sóc cây theo điều kiện hiện tại.
          </p>

          {/* Search */}
          <form className="row g-2 mb-4 weather-search-row" onSubmit={handleSearch}>
            <div className="col-md-7">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tên khu vực (ví dụ: Cần Thơ)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <button
                type="submit"
                className="btn btn-weather-primary w-100"
                disabled={loading}
              >
                🔍 Tìm kiếm
              </button>
            </div>

            <div className="col-md-3">
              <button
                type="button"
                className="btn btn-weather-primary w-100"
                onClick={handleUseMyLocation}
                disabled={loading || usingMyLocation}
              >
                {usingMyLocation ? "Đang lấy vị trí..." : "📍 Dùng vị trí hiện tại"}
              </button>
            </div>
          </form>

          {/* Nhập cây trồng (giao diện hiện đại) */}
          <div className="row g-3 mb-4 weather-plant-input">
            <div className="col-lg-7">
              <div className="plant-input-card">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <div>
                    <div className="plant-input-label">
                      🌱 Nhập cây bạn muốn trồng
                    </div>
                    {/* <div className="plant-input-sub">
                      Ví dụ: <strong>Cà chua bi</strong>,{" "}
                      <strong>Rau muống</strong>, <strong>Dâu tây</strong>...
                    </div> */}
                  </div>
                </div>

                <div className="plant-input-row">
                  <span className="plant-input-icon">🔎</span>
                  <input
                    type="text"
                    className="form-control plant-input-control"
                    placeholder="Nhập tên cây để AI gợi ý cách chăm sóc theo thời tiết hiện tại..."
                    value={plantName}
                    onChange={(e) => setPlantName(e.target.value)}
                  />
                </div>

                <div className="plant-input-hint">
                  Phần này <strong>không bắt buộc</strong>. Nếu chỉ xem thời
                  tiết, bạn có thể bỏ trống.
                </div>
              </div>
            </div>

            <div className="col-lg-5 d-flex align-items-center">
              <button
                type="button"
                className="btn btn-weather-primary w-100 plant-advice-btn"
                onClick={handleGetPlantAdvice}
                disabled={adviceLoading}
              >
                {adviceLoading ? "Đang gợi ý..." : "✨ Gợi ý chăm sóc cây"}
              </button>
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
                  (Tọa độ: {place.latitude.toFixed(3)},{" "}
                  {place.longitude.toFixed(3)})
                </span>
              )}
            </p>
          )}

          {loading && (
            <p className="weather-status-loading">Đang tải dữ liệu thời tiết...</p>
          )}
          {error && <p className="weather-status-error">{error}</p>}

          {!loading && !error && (
            <>
              {/* Current + AQI */}
              <div className="row">
                {/* Thời tiết hiện tại */}
                <div className="col-md-6 mb-3">
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h5 className="mb-2 fw-bold">☀️ Điều kiện hiện tại</h5>
                      <p className="mb-1 fw-bold fs-5 text-success">
                        {cityName}
                      </p>

                      {currentWeather ? (
                        <>
                          <div className="d-flex align-items-center mb-3 main-weather-info">
                            {icon && (
                              <img
                                src={`https://openweathermap.org/img/wn/${icon}@4x.png`}
                                alt="weather icon"
                                style={{ width: 100, height: 100 }}
                              />
                            )}
                            <div className="ms-3">
                              <h2 className="mb-0">
                                <span className="temp-val">
                                  {Math.round(temp)}
                                </span>
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

                            {windSpeed != null && (
                              <div className="col-md-6">
                                <ProgressBar
                                  value={windSpeed}
                                  max={15}
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

                {/* AQI cho cây trồng */}
                <div className="col-md-6 mb-3">
                  <div className="card shadow-sm h-100 aqi-card-modern">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h5 className="mb-1 fw-bold d-flex align-items-center gap-1">
                            🌿 CHẤT LƯỢNG KHÔNG KHÍ CHO CÂY TRỒNG
                          </h5>
                          <div className="text-muted small">
                            AQI càng thấp thì điều kiện không khí càng thuận lợi
                            cho cây phát triển.
                          </div>
                        </div>

                        {aqiValue && (
                          <div
                            className={`aqi-badge-modern ${aqiInfo.colorClass}`}
                          >
                            <div className="aqi-badge-number">
                              AQI <span>{aqiValue}</span>
                            </div>
                            <div className="aqi-badge-label">
                              {aqiInfo.labelForPlants || aqiInfo.label}
                            </div>
                            <div className="aqi-badge-chip">
                              {/* icon nhỏ gợi ý cây trồng */}
                              <span className="chip-icon">🌱</span>
                              <span className="chip-text">
                                {aqiInfo.plantHint || "Độ phù hợp cho cây"}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {aqiValue ? (
                        <>
                          {/* Thanh scale AQI */}
                          <div className="aqi-scale mb-2">
                            <div className="aqi-scale-bar">
                              <div className="aqi-scale-good" />
                              <div className="aqi-scale-fair" />
                              <div className="aqi-scale-moderate" />
                              <div className="aqi-scale-poor" />
                              <div className="aqi-scale-very-poor" />
                            </div>
                            <div className="aqi-scale-labels small">
                              <span>Rất tốt</span>
                              <span>Phù hợp</span>
                              <span>Trung bình</span>
                              <span>Hạn chế</span>
                              <span>Không nên</span>
                            </div>
                          </div>

                          {/* Mô tả – hướng tới cây trồng */}
                          <p className="mb-2 small text-muted">
                            {aqiInfo.plantDesc || (
                              <>
                                Dựa trên AQI hiện tại, mức độ phù hợp cho cây trồng được đánh giá ở trên.
                                <br />
                                Bạn có thể dựa vào đó để quyết định gieo trồng, bón phân hay che chắn cho cây.
                              </>
                            )}
                          </p>

                          {/* Thông số chi tiết */}
                          <div className="row g-2 small">
                            <div className="col-6">
                              <div className="aqi-metric">
                                <span className="label">PM2.5</span>
                                <span className="value">
                                  {formatVal(pm2_5)} µg/m³
                                </span>
                              </div>
                              <div className="aqi-metric">
                                <span className="label">PM10</span>
                                <span className="value">
                                  {formatVal(pm10)} µg/m³
                                </span>
                              </div>
                              <div className="aqi-metric">
                                <span className="label">O₃</span>
                                <span className="value">
                                  {formatVal(o3)} µg/m³
                                </span>
                              </div>
                            </div>
                            <div className="col-6">
                              <div className="aqi-metric">
                                <span className="label">NO₂</span>
                                <span className="value">
                                  {formatVal(no2)} µg/m³
                                </span>
                              </div>
                              <div className="aqi-metric">
                                <span className="label">SO₂</span>
                                <span className="value">
                                  {formatVal(so2)} µg/m³
                                </span>
                              </div>
                              <div className="aqi-metric">
                                <span className="label">CO</span>
                                <span className="value">
                                  {formatVal(co)} µg/m³
                                </span>
                              </div>
                            </div>
                          </div>

                          <small className="text-muted d-block mt-2">
                            Đơn vị: µg/m³. Khi AQI từ mức{" "}
                            <strong>“Hạn chế”</strong> trở lên, nên hạn chế
                            trồng mới các cây mẫn cảm và ưu tiên che chắn cho
                            cây non.
                          </small>
                        </>
                      ) : (
                        <p>Chưa có dữ liệu AQI.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gợi ý chăm sóc cây */}
              <div className="card shadow-lg mt-4 plant-advice-card-wow">
                <div className="card-body">
                  <h5 className="mb-2 fw-bold">🌱 Gợi ý chăm sóc cây trồng</h5>

                  {adviceLoading && (
                    <p className="text-success">
                      Đang phân tích thời tiết và đưa ra gợi ý...
                    </p>
                  )}

                  {!adviceLoading && adviceError && (
                    <div className="alert alert-danger py-2 small">
                      {adviceError}
                    </div>
                  )}

                  {!adviceLoading && advice && (
                    <PlantAdviceCard data={advice} />
                  )}

                  {!adviceLoading && !advice && !adviceError && !hasRequestedAdvice && (
                    <p className="text-muted mb-0">
                      Nếu bạn muốn, hãy nhập tên cây và bấm{" "}
                      <strong>“Gợi ý chăm sóc cây”</strong>. Nếu chỉ xem thời
                      tiết, bạn có thể bỏ qua phần này.
                    </p>
                  )}

                  {!adviceLoading && !advice && !adviceError && hasRequestedAdvice && (
                    <p className="text-muted mb-0">
                      Chưa nhận được gợi ý. Bạn hãy thử lại sau hoặc kiểm tra kết
                      nối mạng.
                    </p>
                  )}
                </div>
              </div>

              {/* Forecast 3h */}
              <div className="card shadow-sm mt-4">
                <div className="card-body">
                  <h5 className="mb-2 fw-bold">
                    ⏰ Dự báo 24 giờ tới (Mỗi 3h)
                  </h5>
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
                        const translatedDesc = translateDescription(desc);

                        return (
                          <div
                            key={item.dt}
                            className="forecast-card border rounded p-2 text-center"
                            style={{
                              animationDelay: `${index * 0.1}s`,
                            }}
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

                            <div className="fw-bold text-success fs-5">
                              {temp}°C
                            </div>

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
                  <h5 className="mb-2 fw-bold">
                    📊 Lịch sử nhiệt độ (Theo giờ)
                  </h5>

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
                            const translatedDesc =
                              translateDescription(desc);

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
                      Chưa có dữ liệu lịch sử. Hãy chọn khoảng ngày và bấm "Xem
                      lịch sử".
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default WeatherPage;
