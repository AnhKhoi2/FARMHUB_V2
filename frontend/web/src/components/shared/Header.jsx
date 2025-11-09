import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import { FaUser, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import "./Header.css";

const Header = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const location = useLocation();
  const currentPath = location.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const dropdown = document.querySelector(".user-dropdown");
      const mobileNav = document.querySelector(".main-nav");

      if (dropdown && !dropdown.contains(e.target)) {
        setDropdownOpen(false);
      }

      if (
        mobileNav &&
        !mobileNav.contains(e.target) &&
        !e.target.closest(".mobile-menu-toggle")
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMenuOpen(false);
    setSubmenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleSubmenu = () => {
    setSubmenuOpen(!submenuOpen);
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
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          <nav className={`main-nav ${menuOpen ? "mobile-menu-open" : ""}`}>
            <ul>
              <li className={currentPath === "/" ? "active" : ""}>
                <Link to="/">Trang Chủ</Link>
              </li>
              <li className={currentPath.startsWith("/shop") ? "active" : ""}>
                <Link to="/shop">Cửa Hàng</Link>
              </li>
              <li className={currentPath.startsWith("/about") ? "active" : ""}>
                <Link to="/about">Giới Thiệu</Link>
              </li>
              <li className={currentPath.startsWith("/news") ? "active" : ""}>
                <Link to="/news">Tin Tức</Link>
              </li>
              <li
                className={currentPath.startsWith("/weather") ? "active" : ""}
              >
                <Link to="/weather">Thời Tiết</Link>
              </li>
              <li
                className={`has-submenu ${
                  currentPath.startsWith("/my-garden") ||
                  currentPath.startsWith("/farmer/notebooks")
                    ? "active"
                    : ""
                }`}
              >
                <span
                  className={`dropdown-toggle ${
                    submenuOpen ? "submenu-open" : ""
                  }`}
                  onClick={toggleSubmenu}
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
                    <Link to="/farmer/collections">Bộ sưu tập</Link>
                  </li>
                </ul>
              </li>
              <li
                className={currentPath.startsWith("/diagnosis") ? "active" : ""}
              >
                <Link to="/diagnosis">Chuẩn Đoán</Link>
              </li>
              <li className={currentPath.startsWith("/guides") ? "active" : ""}>
                <Link to="/guides">Hướng Dẫn</Link>
              </li>
              <li className={currentPath.startsWith("/market") ? "active" : ""}>
                <Link to="/market">Bài Đăng</Link>
              </li>
              <li className={currentPath.startsWith("/experts") ? "active" : ""}>
                <Link to="/experts">Chuyên gia</Link>
              </li>
              <li className="user-menu">
                {user ? (
                  <div
                    className="user-dropdown"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    <div className="user-info">
                      <img
                        src={user.avatar || "https://via.placeholder.com/40"}
                        alt="Avatar"
                        className="avatar"
                      />
                      <span className="username">
                        {user.username || user.email}
                        <span> ▾</span>
                      </span>
                    </div>
                    <ul
                      className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}
                    >
                      <li>
                        <Link to="/profile">
                          <FaUser className="me-2" size={16} />
                          Hồ Sơ
                        </Link>
                      </li>
                      <li>
                        <Link to="/cart">
                          <FaShoppingCart className="me-2" size={16} />
                          Giỏ Hàng
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

      {/* Mobile menu overlay */}
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
