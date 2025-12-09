import React, { useEffect, useState } from "react";
import { profileApi } from "../api/shared/profileApi";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutThunk } from "../redux/authThunks";
import {
  FaTachometerAlt,
  FaUsers,
  FaBug,
  FaFolderOpen,
  FaCloudSun,
  FaTrophy,
  FaSeedling,
  FaShoppingCart,
  FaBook,
  FaAngleLeft,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaHome,
} from "react-icons/fa";
import { Frown } from "lucide-react";

/*
  AdminLayout: fixed sidebar with collapsible state persisted to localStorage.
  - Phối màu Green Bright & Dark Base.
*/

const STORAGE_KEY = "adminSidebarCollapsed";

// Định nghĩa màu sắc và hằng số
const SIDEBAR_WIDTH = 280;
const COLLAPSED_WIDTH = 70;

// --- PHỐI MÀU MỚI ---
const PRIMARY_BRIGHT_GREEN = "#00FF4C"; // Màu xanh lá sáng
const DARK_BASE_GREEN = "#23622B"; // Màu nền Sidebar rất đậm
const LIGHT_GREY_BG = "#F4F6F9"; // Màu nền nội dung chính
const ACTIVE_HOVER_COLOR = PRIMARY_BRIGHT_GREEN; // Dùng cho Active/Hover effect

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(
    window.innerWidth <= 768
      ? true
      : localStorage.getItem(STORAGE_KEY) === "true"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const avatar = localStorage.getItem("profile_avatar");
      const fullName = localStorage.getItem("profile_fullName");
      if (avatar || fullName)
        return { avatar: avatar || null, fullName: fullName || null };
      return null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true" && window.innerWidth > 768) setCollapsed(true);
    } catch (e) {
      console.warn("AdminLayout: failed to read sidebar state", e);
    }

    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load profile for avatar display in header
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await profileApi.getProfile();
        if (!mounted) return;
        const p = res.data?.data || null;
        setProfile(p);
        try {
          if (typeof window !== "undefined" && p) {
            if (p.avatar) localStorage.setItem("profile_avatar", p.avatar);
            if (p.fullName)
              localStorage.setItem("profile_fullName", p.fullName);
            if (p.logo) localStorage.setItem("profile_logo", p.logo);
          }
        } catch (e) {
          /* ignore */
        }
      } catch (e) {
        // ignore — header can show fallback avatar
        // console.warn('AdminLayout: failed to fetch profile', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const toggleDesktop = () => {
    setCollapsed((c) => {
      const nv = !c;
      try {
        localStorage.setItem(STORAGE_KEY, String(nv));
      } catch (e) {
        console.warn("AdminLayout: failed to persist sidebar state", e);
      }
      return nv;
    });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((o) => !o);
  };

  const doLogout = () => {
    dispatch(logoutThunk());
    navigate("/login");
  };

  const currentWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const isMobile = window.innerWidth <= 768;
  const cachedLogo =
    typeof window !== "undefined" ? localStorage.getItem("profile_logo") : null;
  const cachedAvatar =
    typeof window !== "undefined"
      ? localStorage.getItem("profile_avatar")
      : null;
  const logoSrc =
    profile?.logo ||
    cachedLogo ||
    profile?.avatar ||
    cachedAvatar ||
    "/logo192.png";

  const linkBase =
    "nav-link text-white py-2 px-3 d-flex align-items-center gap-2";

  // Custom class cho màu hover/active: Primary Green với opacity
  const activeExtra = " active-custom bg-white bg-opacity-10 rounded";

  const navItems = [
    {
      to: "/admin/dashboard",
      label: "BẢNG ĐIỀU KHIỂN",
      icon: <FaTachometerAlt />,
    },
    { to: "/admin/users", label: "NGƯỜI DÙNG", icon: <FaUsers /> },
    { to: "/admin/diseases", label: "BỆNH", icon: <FaBug /> },
    { to: "/admin/categories", label: "DANH MỤC", icon: <FaFolderOpen /> },
    // { to: "/admin/weather", label: "Thời tiết", icon: <FaCloudSun /> },
    // { to: "/admin/models", label: "MÔ HÌNH TRỒNG", icon: <FaSeedling /> }, // Removed plant template management
    { to: "/admin/managerguides", label: "HƯỚNG DẪN", icon: <FaBook /> },
    { to: "/admin/transactions", label: "GIAO DỊCH", icon: <FaShoppingCart /> },
    { to: "/admin/leaderboard", label: "BẢNG XẾP HẠNG", icon: <FaTrophy /> },
    { to: "/admin/experts", label: "CHUYÊN GIA", icon: <FaUsers /> },
    {
      to: "/admin/expert-applications",
      label: "ĐƠN ỨNG TUYỂN",
      icon: <FaUsers />,
    },
  ];

  return (
    <div>
      <style>{`
        /* Giữ nguyên các style layout chung */
        .admin-sidebar-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,.5); z-index:1030; display: ${
          isMobile && isMobileMenuOpen ? "block" : "none"
        }; }
        .admin-sidebar { 
          position: fixed; 
          top:0; 
          left:0; 
          bottom:0; 
          overflow-y:auto; 
          z-index:1040; 
          transition: width .2s ease, transform .2s ease; 
        }
        .admin-main { 
          min-height:100vh; 
          background: ${LIGHT_GREY_BG}; 
          transition: margin-left .2s ease; 
        }
        .admin-hamburger { border:0; background:transparent; font-size:1.25rem; line-height:1; }
        .admin-hamburger:focus { outline: none; }
        .admin-logo { font-weight:700; font-size:1.2rem; letter-spacing:.5px; }
        .admin-nav-label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .admin-sidebar::-webkit-scrollbar { width:6px; }
        .admin-sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.25); border-radius:3px; }
        
        @media (max-width: 768px) {
          .admin-main { margin-left: 0 !important; }
          .admin-sidebar { 
            width: ${SIDEBAR_WIDTH}px !important; 
            transform: translateX(${isMobileMenuOpen ? 0 : -SIDEBAR_WIDTH}px);
          }
        }
        
        /* --- Style Màu Mới --- */
        .nav-link { color: #ECF0F1 !important; }
        .nav-link.active-custom { 
            font-weight: 600; 
            /* Dùng Primary Green làm màu nền nhẹ */
            background: rgba(0, 255, 76, 0.15) !important;
            border-left: 4px solid ${PRIMARY_BRIGHT_GREEN}; /* Thanh màu Active */
            padding-left: 11px !important; /* bù cho border-left */
        }
        .nav-link:hover { 
            background: rgba(0, 255, 76, 0.05) !important; 
        }
        .admin-main-header { 
            background-color: #fff; 
            border-bottom: 1px solid #ddd;
        }
        /* Admin-scoped overrides: remove heavy decorative typography from global card/title rules */
        .admin-main .card-title,
        .admin-main h1,
        .admin-main h2,
        .admin-main h3,
        .admin-main h4,
        .admin-main h5,
        .admin-main h6 {
          text-shadow: none !important;
          font-family: inherit !important;
          font-weight: 400 !important;
          color: inherit !important;
        }
        /* also clear any drop-shadow filters on icons within admin headers */
        .admin-main .card-title *,
        .admin-main .page-header * {
          filter: none !important;
        }

        /* Admin table header styling to match sample: light green background, green text, subtle border
           Scoped to .admin-main to avoid affecting other sections */
        .admin-main table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          overflow: hidden;
          border-radius: 8px;
          background: #fff;
        }

        .admin-main table thead th {
          background: #f6fbf6; /* very light green */
          color: #2e7d32; /* green text */
          font-weight: 600;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.06);
          text-align: left;
          vertical-align: middle;
          font-size: 14px;
          white-space: nowrap;
        }

        /* Ant Design specific overrides - ensure AntD tables in admin use the same green header style */
        .admin-main .ant-table thead > tr > th {
          background: #f6fbf6 !important;
          color: #2e7d32 !important;
          font-weight: 600 !important;
          padding: 12px 16px !important;
          border-bottom: 1px solid rgba(0,0,0,0.06) !important;
        }

        .admin-main .ant-table thead > tr > th .ant-table-cell-scroll {
          background: transparent !important;
        }

        /* Make content area page titles uppercase for admin pages (h1/h2/h3) */
        .admin-main .content-wrapper h1,
        .admin-main .content-wrapper h2,
        .admin-main .content-wrapper h3 {
          text-transform: uppercase;
          letter-spacing: 0.2px;
          color: inherit;
        }

        /* Normalize title sizes across admin pages (keep headings visually consistent) */
        .admin-main .content-wrapper h1,
        .admin-main .content-wrapper h2,
        .admin-main .content-wrapper h3,
        .admin-main .content-wrapper h4 {
          font-size: 24px;
          line-height: 1.15;
          font-weight: 600;
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .admin-main .content-wrapper h1,
          .admin-main .content-wrapper h2,
          .admin-main .content-wrapper h3,
          .admin-main .content-wrapper h4 {
            font-size: 20px;
          }
        }

        .admin-main table thead th:first-child {
          border-top-left-radius: 8px;
        }
        .admin-main table thead th:last-child {
          border-top-right-radius: 8px;
        }

        /* Slight shadow/separation for header row */
        .admin-main table thead tr {
          box-shadow: inset 0 -1px 0 rgba(0,0,0,0.02);
        }

        /* Make sure sort icons or small controls inside headers stay aligned */
        .admin-main table thead th .sort-indicator {
          margin-left: 8px;
          color: rgba(0,0,0,0.45);
        }
      `}</style>

      {/* Overlay cho mobile */}
      <div className="admin-sidebar-overlay" onClick={toggleMobileMenu}></div>

      <aside
        className="admin-sidebar d-flex flex-column text-white"
        // Màu nền sidebar: Dark Base Green
        style={{
          width: currentWidth,
          background: DARK_BASE_GREEN,
          color: "#ecf0f1",
        }}
      >
        {/* Sidebar Header/Logo */}
        <div
          className="d-flex align-items-center px-3 py-3 border-bottom border-white border-opacity-10"
          style={{
            minHeight: 60,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <NavLink
            to="/admin/dashboard"
            className="admin-logo d-flex align-items-center gap-2"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity .15s",
              cursor: "pointer",
              textDecoration: "none",
            }}
            title="Trang quản trị"
          >
            {/* Logo image removed per request — show text-only logo */}
            <div style={{ lineHeight: 1 }}>
              <h2 className="mb-0 fw-bold">
                <span className="text-white">FarmHub</span>
              </h2>
            </div>
          </NavLink>

          {isMobile && (
            <button
              className="admin-hamburger text-white"
              onClick={toggleMobileMenu}
              style={{ position: "absolute", right: 10 }}
            >
              <FaTimes size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="nav flex-column py-2 flex-grow-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                linkBase + (isActive ? activeExtra : "")
              }
              onClick={isMobile ? toggleMobileMenu : undefined}
              style={{
                fontSize: ".95rem",
                padding: collapsed ? "10px 0" : "8px 15px",
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <span
                className="me-2"
                style={{ width: 22, textAlign: "center", color: "#fff" }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="admin-nav-label flex-grow-1">
                  {item.label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer/Logout */}
        <div className="p-3 mt-auto border-top border-white border-opacity-10">
          <div className="d-grid gap-2">
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => navigate("/")}
              title="Xem trang chủ"
            >
              {collapsed ? <FaHome size={16} /> : "Xem Trang Chủ"}
            </button>
            <button
              className="btn btn-sm"
              onClick={doLogout}
              title="Đăng xuất"
              // Đổi màu Đăng xuất thành màu Đỏ/Nguy hiểm
              style={{
                backgroundColor: "#073909ff",
                borderColor: "#111010ff",
                color: "#fff",
              }}
            >
              {collapsed ? <FaSignOutAlt size={16} /> : "Đăng xuất"}
            </button>
          </div>
          {!collapsed && (
            <div
              className="mt-3"
              style={{
                color: "#BDC3C7",
                fontSize: "0.8rem",
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} FarmHub
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="admin-main"
        style={{ marginLeft: isMobile ? 0 : currentWidth, padding: "0" }}
      >
        {/* Main Header/Navbar */}

        <header
          className="admin-main-header d-flex align-items-center justify-content-between px-4"
          style={{
            minHeight: 60,
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <button
              className="admin-hamburger d-none d-md-block"
              onClick={toggleDesktop}
              title={collapsed ? "Mở rộng" : "Thu nhỏ"}
              style={{
                padding: collapsed ? 0 : "0 5px",
                color: DARK_BASE_GREEN,
              }}
            >
              {collapsed ? <FaBars size={18} /> : <FaAngleLeft size={18} />}
            </button>
            <div className="d-flex align-items-center gap-3">
              {/* Toggle button cho Mobile */}
              {isMobile && (
                <button
                  className="admin-hamburger text-dark"
                  onClick={toggleMobileMenu}
                  title="Menu"
                  style={{ color: DARK_BASE_GREEN }}
                >
                  <FaBars size={20} />
                </button>
              )}

              {/* Breadcrumb/Tiêu đề */}
              <div>
                <h1 className="h6 mb-0 text-muted">Bảng quản trị</h1>
                <small className="text-secondary d-none d-sm-block">
                  Quản lý nội dung nền tảng
                </small>
              </div>
            </div>
          </div>
          {/* User Profile / Info */}
          <div className="d-flex align-items-center gap-3">
            <div className="small text-muted d-none d-sm-block">Chào Admin</div>
            <NavLink
              to="/admin/profile"
              title="Hồ sơ admin"
              style={{ textDecoration: "none" }}
            >
              {profile?.avatar ? (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img
                  src={profile.avatar}
                  alt="avatar"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: PRIMARY_BRIGHT_GREEN,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: DARK_BASE_GREEN,
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  {(profile?.fullName || "A")[0]?.toUpperCase()}
                </div>
              )}
            </NavLink>
          </div>
        </header>

        {/* Content Wrapper */}
        <div
          className="content-wrapper container-fluid"
          style={{ padding: "1.5rem" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
