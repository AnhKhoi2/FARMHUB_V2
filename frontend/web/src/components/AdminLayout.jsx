import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutThunk } from "../redux/authThunks";
import { FaTachometerAlt, FaUsers, FaBug, FaFolderOpen, FaCloudSun, FaTrophy, FaSeedling, FaShoppingCart, FaBook, FaAngleLeft, FaBars, FaTimes, FaSignOutAlt, FaHome } from 'react-icons/fa';
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
const DARK_BASE_GREEN = "#23622B";     // Màu nền Sidebar rất đậm
const LIGHT_GREY_BG = "#F4F6F9";       // Màu nền nội dung chính
const ACTIVE_HOVER_COLOR = PRIMARY_BRIGHT_GREEN; // Dùng cho Active/Hover effect


export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [collapsed, setCollapsed] = useState(
    window.innerWidth <= 768 ? true : (localStorage.getItem(STORAGE_KEY) === "true")
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true" && window.innerWidth > 768) setCollapsed(true);
    } catch (e) { console.warn('AdminLayout: failed to read sidebar state', e); }
    
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDesktop = () => {
    setCollapsed((c) => {
      const nv = !c;
      try {
        localStorage.setItem(STORAGE_KEY, String(nv));
      } catch (e) { console.warn('AdminLayout: failed to persist sidebar state', e); }
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

  const linkBase = "nav-link text-white py-2 px-3 d-flex align-items-center gap-2";
  
  // Custom class cho màu hover/active: Primary Green với opacity
  const activeExtra = " active-custom bg-white bg-opacity-10 rounded";

  const navItems = [
    { to: "/admin/dashboard", label: "Bảng điều khiển", icon: <FaTachometerAlt /> },
    { to: "/admin/users", label: "Người dùng", icon: <FaUsers /> },
    { to: "/admin/diseases", label: "Bệnh", icon: <FaBug /> },
    { to: "/admin/categories", label: "Danh mục", icon: <FaFolderOpen /> },
    { to: "/admin/weather", label: "Thời tiết", icon: <FaCloudSun /> },
    { to: "/admin/models", label: "Mô hình trồng", icon: <FaSeedling /> },
    { to: "/admin/managerguides", label: "Hướng dẫn", icon: <FaBook /> },
    { to: "/admin/leaderboard", label: "Bảng xếp hạng", icon: <FaTrophy /> },
    { to: "/admin/experts", label: "Chuyên gia", icon: <FaUsers /> },
    { to: "/admin/expert-applications", label: "Đơn ứng tuyển", icon: <FaUsers /> },
  ];

  return (
    <div>
      <style>{`
        /* Giữ nguyên các style layout chung */
        .admin-sidebar-overlay { position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,.5); z-index:1030; display: ${isMobile && isMobileMenuOpen ? 'block' : 'none'}; }
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
      `}</style>

      {/* Overlay cho mobile */}
      <div className="admin-sidebar-overlay" onClick={toggleMobileMenu}></div>

      <aside
        className="admin-sidebar d-flex flex-column text-white"
        // Màu nền sidebar: Dark Base Green
        style={{ width: currentWidth, background: DARK_BASE_GREEN, color: '#ecf0f1' }}
      >
        {/* Sidebar Header/Logo */}
        <div className="d-flex align-items-center px-3 py-3 border-bottom border-white border-opacity-10" style={{ minHeight: 60, justifyContent: collapsed ? 'center' : 'space-between' }}>
          <div className="admin-logo d-flex align-items-center gap-2" style={{ opacity: collapsed ? 0 : 1, transition: "opacity .15s" }}>
            <img src="/logo192.png" alt="FarmHub Logo" style={{ width: 30, height: 30, borderRadius: 4 }} />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontWeight: 700, color: PRIMARY_BRIGHT_GREEN }}>FarmHub</div> {/* Logo Text: Primary Bright Green */}
              <small style={{ color: '#BDC3C7', fontSize: '0.8rem' }}>Admin Panel</small>
            </div>
          </div>
          
          {isMobile && (
              <button 
                className="admin-hamburger text-white" 
                onClick={toggleMobileMenu}
                style={{ position: 'absolute', right: 10 }}
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
              className={({ isActive }) => linkBase + (isActive ? activeExtra : "")}
              onClick={isMobile ? toggleMobileMenu : undefined}
              style={{ fontSize: ".95rem", padding: collapsed ? '10px 0' : '8px 15px', justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <span className="me-2" style={{ width: 22, textAlign: "center", color: '#fff' }}>
                {item.icon}
              </span>
              {!collapsed && <span className="admin-nav-label flex-grow-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer/Logout */}
        <div className="p-3 mt-auto border-top border-white border-opacity-10">
          <div className="d-grid gap-2">
            <button className="btn btn-sm btn-outline-light" onClick={() => navigate("/")} title="Xem trang chủ">
              {collapsed ? <FaHome size={16} /> : "Xem Trang Chủ"}
            </button>
            <button 
              className="btn btn-sm" 
              onClick={doLogout} 
              title="Đăng xuất"
              // Đổi màu Đăng xuất thành màu Đỏ/Nguy hiểm
              style={{ backgroundColor: '#FF4D4F', borderColor: '#FF4D4F', color: '#fff' }}
            >
              {collapsed ? <FaSignOutAlt size={16} /> : "Đăng xuất"}
            </button>
          </div>
          {!collapsed && <div className="mt-3" style={{ color: '#BDC3C7', fontSize: '0.8rem', textAlign: 'center' }}>© {new Date().getFullYear()} FarmHub</div>}
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ marginLeft: isMobile ? 0 : currentWidth, padding: "0" }}>
        {/* Main Header/Navbar */}
        
        <header 
            className="admin-main-header d-flex align-items-center justify-content-between px-4" 
            style={{ 
                minHeight: 60, 
                position: 'sticky',
                top: 0,
                zIndex: 1000
            }}
        >
        <div className="d-flex align-items-center gap-3">
        <button 
            className="admin-hamburger d-none d-md-block" 
            onClick={toggleDesktop} 
            title={collapsed ? "Mở rộng" : "Thu nhỏ"}
            style={{ padding: collapsed ? 0 : '0 5px', color: DARK_BASE_GREEN }}
          >
            {collapsed ? <FaBars size={18} /> : <FaAngleLeft size={18} />}
          </button>
          <div className="d-flex align-items-center gap-3">
            {/* Toggle button cho Mobile */}
            {isMobile && (
                <button className="admin-hamburger text-dark" onClick={toggleMobileMenu} title="Menu" style={{ color: DARK_BASE_GREEN }}>
                    <FaBars size={20} />
                </button>
            )}

            {/* Breadcrumb/Tiêu đề */}
            <div>
              <h1 className="h6 mb-0 text-muted">Bảng quản trị</h1>
              <small className="text-secondary d-none d-sm-block">Quản lý nội dung nền tảng</small>
            </div>
          </div>
          </div>
          {/* User Profile / Info */}
          <div className="d-flex align-items-center gap-3">
            <div className="small text-muted d-none d-sm-block">Chào, **Admin**</div>
            <div 
                style={{ 
                    width:36, height:36, borderRadius:18, 
                    background:PRIMARY_BRIGHT_GREEN, // Ảnh đại diện dùng Primary Bright Green
                    display:'inline-flex', alignItems:'center', justifyContent:'center', 
                    color:DARK_BASE_GREEN, fontWeight: 'bold' // Chữ trong avatar dùng Dark Base Green
                }}
            >
                A
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="content-wrapper container-fluid" style={{ padding: "1.5rem" }}>
          {children}
        </div>
      </main>
    </div>
  );
}