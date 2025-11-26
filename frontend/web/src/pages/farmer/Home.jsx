import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  FaCloudSun,
  FaBook,
  FaStethoscope,
  FaBug,
} from "react-icons/fa";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/farmer/Home.css";

// Toạ độ mặc định (TP.HCM)
const DEFAULT_LAT = 10.7769;
const DEFAULT_LON = 106.7009;

// API mới – lấy từ POST
const API_LATEST_POSTS = "/api/posts/public";

const Home = () => {
  const user = useSelector((state) => state.auth.user);

  const [recentVisited, setRecentVisited] = useState([]);

  // Thời tiết
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Post
  const [latestPosts, setLatestPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState(null);
  //guide
  const [latestGuides, setLatestGuides] = useState([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guidesError, setGuidesError] = useState(null);

  // Recent visited
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentVisited") || "[]");
    setRecentVisited(stored);
  }, []);

  // Weather
  useEffect(() => {
    const fetchWeather = async (coords) => {
      try {
        setWeatherLoading(true);
        setWeatherError(null);

        const effective =
          coords && coords.lat && coords.lon
            ? coords
            : { lat: DEFAULT_LAT, lon: DEFAULT_LON };

        const res = await axiosClient.get("/api/weather", {
          params: {
            lat: effective.lat,
            lon: effective.lon,
            scope: "current",
            units: "metric",
            lang: "vi",
          },
        });

        const raw = res.data?.data || {};

        const mapped = {
          locationName: raw.name || raw.city || "Vị trí của bạn",
          tempC:
            raw.tempC ??
            raw.temperature ??
            raw.current?.tempC ??
            raw.current?.temperature ??
            raw.main?.temp ??
            null,
          feelsLikeC:
            raw.feelsLikeC ??
            raw.feels_like ??
            raw.current?.feelsLikeC ??
            raw.main?.feels_like ??
            null,
          humidity:
            raw.humidity ??
            raw.current?.humidity ??
            raw.main?.humidity ??
            null,
          condition:
            raw.condition ||
            raw.description ||
            raw.weather?.[0]?.description ||
            "Đang cập nhật",
        };

        setWeather(mapped);
      } catch (err) {
        console.error("Weather error:", err);
        setWeatherError("Không lấy được dữ liệu thời tiết.");
      } finally {
        setWeatherLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          fetchWeather({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        () => fetchWeather(null)
      );
    } else {
      fetchWeather(null);
    }
  }, []);

  // ⭐ Lấy 3 bài post từ PostController
  useEffect(() => {
    const fetchLatestPosts = async () => {
      try {
        setPostsLoading(true);
        setPostsError(null);

        const res = await axiosClient.get(API_LATEST_POSTS, {
          params: { page: 1, limit: 3 },
          headers: { Authorization: "" }, // ép public, tránh verifyToken
        });

        const raw = res.data;

        let items =
          raw?.data?.items ??
          raw?.items ??
          raw?.data ??
          [];

        setLatestPosts(Array.isArray(items) ? items.slice(0, 3) : []);
      } catch (err) {
        console.error("Latest posts error:", err?.response || err);
        setPostsError("Không tải được bài đăng.");
        setLatestPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchLatestPosts();
  }, []);
  // 3 bài hướng dẫn
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        setGuidesLoading(true);
        setGuidesError(null);

        const res = await axiosClient.get("/guides", {
          params: { page: 1, limit: 3 },
          headers: { Authorization: "" } // ép public
        });

        const items = res.data?.data || []; // backend trả thẳng array
        setLatestGuides(items.slice(0, 3));
      } catch (err) {
        console.error("Guides error:", err);
        setGuidesError("Không tải được hướng dẫn.");
      } finally {
        setGuidesLoading(false);
      }
    };

    fetchGuides();
  }, []);

  // Helpers
  const getShortDescription = (text, max = 100) => {
    if (!text) return "";
    return text.length <= max ? text : text.slice(0, max) + "...";
  };

  const getLocationText = (location) => {
    if (!location) return "";
    if (typeof location === "string") return location;
    return (
      location.address ||
      location.city ||
      location.district ||
      location.province ||
      ""
    );
  };

  const getFirstImage = (images) => {
    if (!Array.isArray(images) || images.length === 0) return null;
    const img = images[0];
    return typeof img === "string" ? img : img.url || null;
  };

  return (
    <>
      <Header />
      <div className="homepage user-home-page">

        {/* ---------- HERO ---------- */}
        <section className="hero-section">
          <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
            <div className="carousel-indicators">
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="0" className="active"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="1"></button>
              <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="2"></button>
            </div>

            <div className="carousel-inner">
              <div className="carousel-item active" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200" className="d-block w-100" />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">Sống Xanh Bắt Đầu Từ Đây</h2>
                  <p className="fs-5">
                    Trồng rau sạch tại nhà dễ dàng với FarmHub. <br />
                    Hướng dẫn chi tiết, công nghệ AI hỗ trợ, cộng đồng kết nối.
                  </p>
                  <Link to="/guides" className="btn btn-success btn-lg mt-3">Khám Phá Ngay</Link>
                </div>
              </div>

              <div className="carousel-item" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200" className="d-block w-100" />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">Tươi Sạch, Tiện Lợi</h2>
                  <p className="fs-5">
                    Mua hạt giống, phân bón, dụng cụ chất lượng cao. <br />
                    Tạo khu vườn xanh ngay tại đô thị.
                  </p>
                  <Link to="/shop" className="btn btn-success btn-lg mt-3">Mua Sắm Ngay</Link>
                </div>
              </div>

              <div className="carousel-item" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200" className="d-block w-100" />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">Sản Phẩm Hữu Cơ Tươi Sạch</h2>
                  <p className="fs-5">
                    Chất lượng tươi sạch, hỗ trợ tận tâm. <br />
                    Biến ban công thành vườn rau xanh mát.
                  </p>
                  <Link to="/my-garden" className="btn btn-success btn-lg mt-3">Bắt Đầu Hành Trình</Link>
                </div>
              </div>
            </div>

            <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
              <span className="carousel-control-prev-icon"></span>
            </button>
            <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
              <span className="carousel-control-next-icon"></span>
            </button>
          </div>
        </section>

        {/* ---------- WEATHER ---------- */}
        <section className="weather-section container my-5">
          <div className="card shadow-sm weather-card">
            <div className="card-body d-flex flex-column flex-md-row align-items-center justify-content-between">
              <div className="d-flex align-items-center mb-3 mb-md-0">
                <div className="weather-icon-wrapper me-3">
                  <FaCloudSun className="weather-main-icon" />
                </div>
                <div>
                  <h3 className="weather-title mb-1">Thời tiết cho vườn của bạn</h3>

                  {weatherLoading ? (
                    <p className="text-muted">Đang tải dữ liệu...</p>
                  ) : weatherError ? (
                    <p className="text-danger">{weatherError}</p>
                  ) : weather ? (
                    <>
                      <p className="weather-location">{weather.locationName}</p>
                      <p className="text-muted text-capitalize">{weather.condition}</p>
                    </>
                  ) : (
                    <p className="text-muted">Chưa có dữ liệu.</p>
                  )}
                </div>
              </div>

              <div className="weather-main d-flex align-items-center">
                {weather ? (
                  <>
                    <div className="me-4 text-center">
                      <div className="weather-temp">{Math.round(weather.tempC)}°C</div>
                      <div className="text-muted small">Cảm giác như {Math.round(weather.feelsLikeC)}°C</div>
                    </div>
                    <div className="d-flex flex-column align-items-end text-muted small">
                      <div>Độ ẩm: {weather.humidity}%</div>

                      <Link to="/weather" className="weather-detail-btn mt-2">
                        XEM CHI TIẾT
                      </Link>
                    </div>

                  </>
                ) : (
                  <div className="text-muted small">Không có dữ liệu.</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- LATEST POSTS ---------- */}
          <section className="container my-5 market-section">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <span className="text-success text-uppercase fw-semibold">Rao vặt</span>
                <h2 className="h3 fw-bold mb-0">Tin rao vặt mới nhất</h2>
                
              </div>

            </div>

            {postsLoading ? (
              <div className="row g-4">
                {[1, 2, 3].map((i) => (
                  <div className="col-md-4" key={i}>
                    <div className="card shadow-sm skeleton-card">
                      <div className="skeleton-img mb-3" />
                      <div className="skeleton-line mb-2" />
                      <div className="skeleton-line small mb-2" />
                      <div className="skeleton-line small w-50" />
                      
                    </div>
                  </div>
                ))}
              </div>
            ) : postsError ? (
              <p className="text-danger">{postsError}</p>
            ) : latestPosts.length === 0 ? (
              <div className="market-empty text-muted">
                Chưa có bài đăng nào.
                <Link to="/market">Đi đến chợ nông sản</Link>.
              </div>
            ) : (
              <div className="row g-4">
                {latestPosts.map((post) => {
                  const imgUrl = getFirstImage(post.images);
                  const locationText = getLocationText(post.location);
                  return (
                    <div className="col-md-4" key={post._id}>
                      <div className="card h-100 shadow-sm market-card">
                        {imgUrl && (
                          <div className="market-image-wrapper">
                            <img src={imgUrl} className="market-image" alt={post.title} />
                          </div>
                        )}

                        <div className="card-body d-flex flex-column">
                          <h5 className="card-title fw-bold">{post.title}</h5>

                          {post.category && (
                            <div className="badge bg-light text-success border mb-2">
                              {post.category}
                            </div>
                          )}

                          <p className="text-muted mb-3">
                            {getShortDescription(post.description, 110)}
                          </p>

                          {post.price && <div className="market-price">{post.price}</div>}

                          <div className="market-meta mt-auto">
                            {locationText && <div className="small text-muted">📍 {locationText}</div>}
                            {post.userId?.username && (
                              <div className="small text-muted">👤 {post.userId.username}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        {/* ---------- Guide ---------- */}
        <section className="container my-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <span className="text-success text-uppercase fw-semibold">Hướng dẫn</span>
              <h2 className="h3 fw-bold mb-0">Hướng dẫn trồng trọt</h2>
            </div>
          </div>

          {guidesLoading ? (
            <p>Đang tải...</p>
          ) : guidesError ? (
            <p className="text-danger">{guidesError}</p>
          ) : (
            <div className="row g-4">
              {latestGuides.map((g) => (
                <div className="col-md-4" key={g._id}>
                  <div className="guide-card">

                    {g.image ? (
                      <img
                        src={g.image}
                        alt={g.title}
                        className="guide-image"
                      />
                    ) : (
                      <div className="guide-image d-flex align-items-center justify-content-center text-muted">
                        No Image
                      </div>
                    )}

                    <div className="guide-body">
                      <h5 className="guide-title">{g.title}</h5>
                      <p className="guide-desc">
                        {g.summary || g.description?.slice(0, 120)}...
                      </p>

                      <Link
                        to={`/guides/${g._id}`}
                        className="btn btn-success guide-btn"
                      >
                        Xem chi tiết
                      </Link>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


        {/* ---------- SERVICES ---------- */}
        <section className="services-section container my-5 py-5">
  <div className="text-center mb-5">
    <span className="text-success text-uppercase fw-semibold">
      Dịch vụ
    </span>
    <h2 className="display-5 fw-bold">Các dịch vụ của chúng tôi</h2>
  </div>

  <div className="row g-4">
    
    {/* WEATHER */}
    <div className="col-md-3">
      <Link to="/weather" className="text-decoration-none">
        <div className="card h-100 shadow-sm hover-card text-center p-4">
          <FaCloudSun size={64} className="text-success mb-3" />
          <h4 className="fw-bold">Thời tiết</h4>
          <p className="text-muted">Dự báo thời tiết chuẩn cho cây trồng</p>
        </div>
      </Link>
    </div>

    {/* NHẬT KÝ LÀM VƯỜN */}
    <div className="col-md-3">
      <Link to="/farmer/notebooks" className="text-decoration-none">
        <div className="card h-100 shadow-sm hover-card text-center p-4">
          <FaBook size={64} className="text-success mb-3" />
          <h4 className="fw-bold">Nhật ký làm vườn</h4>
          <p className="text-muted">Theo dõi tiến trình trồng trọt</p>
        </div>
      </Link>
    </div>

    {/* CHUẨN ĐOÁN */}
    <div className="col-md-3">
      <Link to="/plant-diagnosis" className="text-decoration-none">
        <div className="card h-100 shadow-sm hover-card text-center p-4">
          <FaStethoscope size={64} className="text-success mb-3" />
          <h4 className="fw-bold">Chuẩn đoán</h4>
          <p className="text-muted">Sổ khám sức khỏe cây trồng</p>
        </div>
      </Link>
    </div>

    {/* BỆNH CÂY TRỒNG */}
    <div className="col-md-3">
      <Link to="/diseases" className="text-decoration-none">
        <div className="card h-100 shadow-sm hover-card text-center p-4">
          <FaBug size={64} className="text-success mb-3" />
          <h4 className="fw-bold">Bệnh cây trồng</h4>
          <p className="text-muted">Thông tin bệnh & cách xử lý</p>
        </div>
      </Link>
    </div>

  </div>
</section>


      </div>
      <Footer />
    </>
  );
};

export default Home;
