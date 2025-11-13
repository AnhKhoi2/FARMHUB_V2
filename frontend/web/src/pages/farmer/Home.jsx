import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import {
  FaClock,
  FaLeaf,
  FaCloudSun,
  FaBook,
  FaStethoscope,
  FaBug,
} from "react-icons/fa";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import "../../css/farmer/Home.css";

const Home = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [selectedTab, setSelectedTab] = useState("Tất Cả");
  const [recentVisited, setRecentVisited] = useState([]);

  // Mock data cho products
  const allProducts = [
    {
      id: 1,
      name: "Hạt Giống Cà Chua",
      price: 25000,
      originalPrice: 35000,
      image:
        "https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=400",
      category: ["Hạt Giống"],
    },
    {
      id: 2,
      name: "Phân Bón Hữu Cơ",
      price: 120000,
      originalPrice: 150000,
      image:
        "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400",
      category: ["Phân Bón"],
    },
    {
      id: 3,
      name: "Rau Xà Lách",
      price: 15000,
      originalPrice: null,
      image:
        "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=400",
      category: ["Rau Ăn Lá"],
    },
    {
      id: 4,
      name: "Dụng Cụ Làm Vườn",
      price: 85000,
      originalPrice: 100000,
      image:
        "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
      category: ["Dụng Cụ"],
    },
    {
      id: 5,
      name: "Hạt Giống Dưa Leo",
      price: 20000,
      originalPrice: null,
      image:
        "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=400",
      category: ["Hạt Giống"],
    },
  ];

  const allCategories = [...new Set(allProducts.flatMap((p) => p.category))];
  const tabs = ["Tất Cả", ...allCategories];

  useEffect(() => {
    // Lấy dữ liệu từ localStorage
    const stored = JSON.parse(localStorage.getItem("recentVisited") || "[]");
    setRecentVisited(stored);
  }, []);

  const filteredProducts = allProducts.filter((product) => {
    if (selectedTab === "Tất Cả") return true;
    return product.category.includes(selectedTab);
  });

  return (
    <>
      <Header />
      <div className="homepage">
        {/* Hero Carousel */}
        <section className="hero-section">
          <div
            id="heroCarousel"
            className="carousel slide"
            data-bs-ride="carousel"
          >
            <div className="carousel-indicators">
              <button
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to="0"
                className="active"
              ></button>
              <button
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to="1"
              ></button>
              <button
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to="2"
              ></button>
            </div>

            <div className="carousel-inner">
              <div className="carousel-item active" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img
                  src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200"
                  className="d-block w-100"
                  alt="Fresh Produce"
                />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">
                    Sống Xanh Bắt Đầu Từ Đây
                  </h2>
                  <p className="fs-5">
                    Trồng rau sạch tại nhà dễ dàng với FarmHub. <br />
                    Hướng dẫn chi tiết, công nghệ AI hỗ trợ, cộng đồng kết nối.
                  </p>
                  <Link to="/guides" className="btn btn-success btn-lg mt-3">
                    Khám Phá Ngay
                  </Link>
                </div>
              </div>

              <div className="carousel-item" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200"
                  className="d-block w-100"
                  alt="Healthy Living"
                />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">Tươi Sạch, Tiện Lợi</h2>
                  <p className="fs-5">
                    Mua hạt giống, phân bón, dụng cụ làm vườn chất lượng cao.{" "}
                    <br />
                    Hỗ trợ bạn tạo khu vườn xanh ngay tại đô thị.
                  </p>
                  <Link to="/shop" className="btn btn-success btn-lg mt-3">
                    Mua Sắm Ngay
                  </Link>
                </div>
              </div>

              <div className="carousel-item" data-bs-interval="3000">
                <div className="carousel-overlay"></div>
                <img
                  src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1200"
                  className="d-block w-100"
                  alt="Garden"
                />
                <div className="carousel-caption">
                  <h2 className="display-4 fw-bold">
                    Sản Phẩm Hữu Cơ Tươi Sạch
                  </h2>
                  <p className="fs-5">
                    Chất lượng tươi sạch, hỗ trợ tận tâm. <br />
                    Biến ban công thành vườn rau xanh mát với FarmHub.
                  </p>
                  <Link to="/my-garden" className="btn btn-success btn-lg mt-3">
                    Bắt Đầu Hành Trình
                  </Link>
                </div>
              </div>
            </div>

            <button
              className="carousel-control-prev"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="prev"
            >
              <span className="carousel-control-prev-icon"></span>
            </button>
            <button
              className="carousel-control-next"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="next"
            >
              <span className="carousel-control-next-icon"></span>
            </button>
          </div>
        </section>

        {/* Recently Visited - Chỉ hiển thị khi đã đăng nhập */}
        {user && (
          <section className="recently-visited container my-5">
            <h2 className="section-title">
              <FaClock className="me-2" /> Đã xem gần đây
            </h2>
            <div className="row g-4">
              {recentVisited.length > 0 ? (
                recentVisited.slice(0, 3).map((item, index) => (
                  <div className="col-md-4" key={index}>
                    <Link
                      to={`/guides/${item.slug}`}
                      className="text-decoration-none"
                    >
                      <div className="card h-100 shadow-sm hover-card">
                        <img
                          src={item.image}
                          className="card-img-top"
                          alt={item.title}
                        />
                        <div className="card-body">
                          <h5 className="card-title">{item.title}</h5>
                          <p className="card-text text-muted">{item.date}</p>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="col-12 text-center text-muted py-4">
                  <FaLeaf size={48} className="mb-3 opacity-50" />
                  <p>Chưa có cây trồng nào được xem gần đây.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Products Section */}
        <section className="our-products container my-5">
          <div className="text-center mb-4">
            <span className="text-success text-uppercase fw-semibold">
              Khám Phá
            </span>
            <h2 className="display-5 fw-bold">Sản phẩm của chúng tôi</h2>
          </div>

          <div className="product-tabs mb-4 d-flex justify-content-center flex-wrap gap-2">
            {tabs.map((tabName) => (
              <button
                key={tabName}
                className={`btn ${
                  selectedTab === tabName
                    ? "btn-success"
                    : "btn-outline-success"
                }`}
                onClick={() => setSelectedTab(tabName)}
              >
                {tabName}
              </button>
            ))}
          </div>

          <div className="row g-4">
            {filteredProducts.slice(0, 5).map((product) => {
              const discountPercent =
                product.originalPrice && product.originalPrice > product.price
                  ? Math.round(
                      ((product.originalPrice - product.price) /
                        product.originalPrice) *
                        100
                    )
                  : 0;

              return (
                <div className="col-md-6 col-lg-4" key={product.id}>
                  <div className="card h-100 shadow-sm hover-card position-relative">
                    {discountPercent > 0 && (
                      <span className="badge bg-danger position-absolute top-0 start-0 m-2">
                        -{discountPercent}%
                      </span>
                    )}
                    <img
                      src={product.image}
                      className="card-img-top"
                      alt={product.name}
                    />
                    <div className="card-body text-center">
                      <h5 className="card-title">{product.name}</h5>
                      <div className="mb-3">
                        {product.originalPrice && (
                          <span className="text-decoration-line-through text-muted me-2">
                            {product.originalPrice.toLocaleString()} VND
                          </span>
                        )}
                        <div className="fw-bold text-success fs-5">
                          {product.price.toLocaleString()} VND
                        </div>
                      </div>
                      <Link to="/shop" className="btn btn-outline-success">
                        Xem Chi Tiết
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section container my-5 py-5">
          <div className="text-center mb-5">
            <span className="text-success text-uppercase fw-semibold">
              Dịch vụ
            </span>
            <h2 className="display-5 fw-bold">Các dịch vụ của chúng tôi</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-3">
              <Link to="/weather" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card text-center p-4">
                  <div className="mb-3">
                    <FaCloudSun size={64} className="text-success" />
                  </div>
                  <h4 className="fw-bold">Thời tiết</h4>
                  <p className="text-muted">
                    Dự báo thời tiết chuẩn bị cho cây trồng
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/my-garden" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card text-center p-4">
                  <div className="mb-3">
                    <FaBook size={64} className="text-success" />
                  </div>
                  <h4 className="fw-bold">Nhật ký làm vườn</h4>
                  <p className="text-muted">
                    Lưu trữ quá trình canh tác 1 cách toàn diện
                  </p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/diagnosis" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card text-center p-4">
                  <div className="mb-3">
                    <FaStethoscope size={64} className="text-success" />
                  </div>
                  <h4 className="fw-bold">Chuẩn đoán</h4>
                  <p className="text-muted">Sổ khám sức khỏe cây trồng</p>
                </div>
              </Link>
            </div>

            <div className="col-md-3">
              <Link to="/diseases" className="text-decoration-none">
                <div className="card h-100 shadow-sm hover-card text-center p-4">
                  <div className="mb-3">
                    <FaBug size={64} className="text-success" />
                  </div>
                  <h4 className="fw-bold">Bệnh cây trồng</h4>
                  <p className="text-muted">
                    Tìm hiểu về các loại bệnh và cách phòng trừ
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Promo Banners */}
        <section className="promo-banners container my-5">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="promo-card bg-success text-white p-5 rounded shadow">
                <span className="badge bg-warning text-dark mb-3">
                  Tiết kiệm lên đến 50%
                </span>
                <h3 className="display-6 fw-bold">Sẵn Sàng Làm Vườn</h3>
                <p className="mb-4">
                  Mua ngay các sản phẩm làm vườn với giá ưu đãi
                </p>
                <Link to="/shop" className="btn btn-light btn-lg">
                  Mua ngay
                </Link>
              </div>
            </div>

            <div className="col-md-6">
              <div className="promo-card bg-dark text-white p-5 rounded shadow">
                <span className="badge bg-danger mb-3">Giảm ngay 15%</span>
                <h3 className="display-6 fw-bold">Tất cả sản phẩm</h3>
                <p className="mb-4">Sở hữu dụng cụ làm vườn chất lượng cao</p>
                <Link to="/shop" className="btn btn-success btn-lg">
                  Mua ngay
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* User Info & Logout */}
        {user && (
          <section className="user-section container my-5">
            <div className="card shadow-sm">
              <div className="card-body">
                <h5 className="card-title">
                  Xin chào,{" "}
                  <span className="text-success fw-bold">
                    {user.username || user.email}
                  </span>
                  ! 👋
                </h5>
                <p className="text-muted">Chào mừng bạn trở lại với FarmHub</p>
                <button
                  onClick={() => dispatch(logout())}
                  className="btn btn-outline-danger"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Falling Leaves Animation */}
        <div className="falling-leaves">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="leaf"
              style={{ animationDelay: `${i * 2}s` }}
            >
              🍃
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
