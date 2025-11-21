import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import { FaUser, FaBars, FaTimes } from "react-icons/fa"; // ❌ bỏ FaShoppingCart
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import authApi from "../../api/shared/authApi";
import NotificationBell from "../NotificationBell";
import "./Header.css";
import { RadarChartOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
const Header = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = location.pathname;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  useEffect(() => {
    setDropdownOpen(false);
    setMenuOpen(false);
    setSubmenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // attempt server-side logout to clear refresh cookie
      await authApi.logout();
    } catch (e) {
      // ignore network error but continue clearing client state
      console.warn("Logout API failed:", e?.response?.data || e?.message || e);
    }

    // clear client-side state
    dispatch(logout());
    setDropdownOpen(false);
    setMenuOpen(false);
    toast.info("Bạn đã đăng xuất.");
    navigate("/login");
  };

  const toggleSubmenu = () => {
    setSubmenuOpen(!submenuOpen);
  };

  const handleToggleUserDropdown = (e) => {
    e.stopPropagation();
    setDropdownOpen((prev) => !prev);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 992) setSubmenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 992) setSubmenuOpen(false);
  };

  return (
    <>
      <header className="main-header">
        <div className="header-container">
          <div className="logo d-flex align-items-center me-auto">
            <Link to="/" className="text-white text-decoration-none">
              <h2 className="mb-0 fw-bold">
                <span className="text-success">Farm</span>Hub
              </h2>
            </Link>
          </div>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle mobile menu"
          >
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          <nav className={`main-nav ${menuOpen ? "mobile-menu-open" : ""}`}>
            <ul>
              <li className={currentPath === "/" ? "active" : ""}>
                <Link to="/">Trang Chủ</Link>
              </li>

              <li
                className={currentPath.startsWith("/weather") ? "active" : ""}
              >
                <Link to="/weather">Thời Tiết</Link>
              </li>
              <li
                className={
                  currentPath.startsWith("/plant-diagnosis") ? "active" : ""
                }
              >
                <Link to="/plant-diagnosis">Chẩn đoán bằng hình ảnh</Link>
              </li>

              {/* NHẬT KÝ LÀM VƯỜN – SUBMENU */}
              <li
                className={`has-submenu ${
                  currentPath.startsWith("/my-garden") ||
                  currentPath.startsWith("/farmer/notebooks") ||
                  currentPath.startsWith("/farmer/collections")
                    ? "active"
                    : ""
                }`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <span
                  className="dropdown-toggle"
                  onClick={() => window.innerWidth < 992 && toggleSubmenu()}
                >
                  Nhật Ký Làm Vườn
                </span>

                <ul
                  className={`submenu ${
                    submenuOpen ? "mobile-submenu-open" : ""
                  }`}
                >
                  <li>
                    <Link to="/farmer/notebooks">Nhật ký cơ bản</Link>
                  </li>
                  <li>
                    <Link to="/farmer/notebooks/stats">Thống kê nhật ký</Link>
                  </li>
                  <li>
                    <Link to="/farmer/collections">Bộ sưu tập</Link>
                  </li>
                </ul>
              </li>

              <li className={currentPath.startsWith("/guides") ? "active" : ""}>
                <Link to="/guides">Hướng Dẫn</Link>
              </li>

              <li className={currentPath.startsWith("/market") ? "active" : ""}>
                <Link to="/market">Chợ</Link>
              </li>

              <li
                className={currentPath.startsWith("/experts") ? "active" : ""}
              >
                <Link to="/experts">Chuyên gia</Link>
              </li>
              <li
                className={currentPath.startsWith("/pricing") ? "active" : ""}
              >
                <Link to="/pricing">Gói Dịch Vụ</Link>
              </li>

              {user && (
                <li className="notification-item">
                  <NotificationBell />
                </li>
              )}
              {/* streak */}
              <li
                className={
                  currentPath.startsWith("/farmer/streak") ? "active" : ""
                }
              >
                <Link to="/farmer/streak">
                  <Tooltip title="Xếp hạng Streak">
                    <RadarChartOutlined style={{ fontSize: "18px" }} />
                  </Tooltip>
                </Link>
              </li>

              {/* USER MENU */}
              <li className="user-menu">
                {user ? (
                  <div className="user-dropdown">
                    <div
                      className="user-info"
                      onClick={handleToggleUserDropdown}
                      title={user?.username || user?.email}
                    >
                      <img
                        src={user?.avatar || "/logo192.png"}
                        alt="Avatar"
                        className="avatar"
                      />
                    </div>

                    <ul
                      className={`user-dropdown-menu ${
                        dropdownOpen ? "show" : ""
                      }`}
                    >
                      <li
                        className="user-menu-header"
                        style={{
                          padding: "0.75rem 1rem",
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <img
                            src={user?.avatar || "/logo192.png"}
                            alt="avatar"
                            style={{ width: 36, height: 36, borderRadius: 18 }}
                          />
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {user?.username || user?.email}
                            </div>
                            <div style={{ fontSize: 12, color: "#666" }}>
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </li>
                      <li>
                        <Link
                          to="/profile"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <FaUser className="me-2" size={16} /> Hồ Sơ
                        </Link>
                      </li>

                      <li>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="logout-btn"
                        >
                          Đăng Xuất
                        </button>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <Link to="/login">Đăng Nhập</Link>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* overlay bắt click ngoài để đóng dropdown user */}
      {dropdownOpen && (
        <div
          className="dropdown-overlay"
          onClick={() => setDropdownOpen(false)}
        />
      )}

      {menuOpen && (
        <div
          className="mobile-menu-overlay show"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Header;
