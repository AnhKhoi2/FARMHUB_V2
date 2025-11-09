import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { FaTachometerAlt, FaUsers, FaBug, FaFolderOpen, FaCloudSun, FaTrophy, FaSeedling, FaShoppingCart, FaBook } from 'react-icons/fa';

/*
  AdminLayout: fixed sidebar with collapsible state persisted to localStorage.
  - Accepts `children` and renders them in the main area.
*/

const STORAGE_KEY = "adminSidebarCollapsed";

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") setCollapsed(true);
    } catch (e) { console.warn('AdminLayout: failed to read sidebar state', e); }
  }, []);

  const toggle = () => {
      setCollapsed((c) => {
      const nv = !c;
      try {
        localStorage.setItem(STORAGE_KEY, String(nv));
      } catch (e) { console.warn('AdminLayout: failed to persist sidebar state', e); }
      return nv;
    });
  };

  const doLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const width = collapsed ? 72 : 250;

  const linkBase = "nav-link text-white py-2 px-3 d-flex align-items-center gap-2";
  const activeExtra = " active bg-white bg-opacity-10 rounded";

  const navItems = [
    { to: "/admin/dashboard", label: "Bảng điều khiển", icon: <FaTachometerAlt /> },
    { to: "/admin/users", label: "Người dùng", icon: <FaUsers /> },
    { to: "/admin/diseases", label: "Bệnh", icon: <FaBug /> },
    { to: "/admin/categories", label: "Danh mục", icon: <FaFolderOpen /> },
    { to: "/admin/weather", label: "Thời tiết", icon: <FaCloudSun /> },
  { to: "/admin/models", label: "Mô hình trồng", icon: <FaSeedling /> },
  { to: "/admin/managerpost", label: "Bài viết", icon: <FaShoppingCart /> },
  { to: "/admin/managerguides", label: "Hướng dẫn", icon: <FaBook /> },
    { to: "/admin/leaderboard", label: "Bảng xếp hạng", icon: <FaTrophy /> },
    { to: "/admin/experts", label: "Chuyên gia", icon: <FaUsers /> },
    { to: "/admin/expert-applications", label: "Đơn ứng tuyển", icon: <FaUsers /> },
  ];

  return (
    <div>
      <style>{`
        .admin-sidebar { position: fixed; top:0; left:0; bottom:0; overflow-y:auto; z-index:1040; transition: width .2s ease; }
        .admin-main { min-height:100vh; background:#f5f6fa; transition: margin-left .2s ease; }
        .admin-hamburger { border:0; background:transparent; font-size:1.25rem; line-height:1; }
        .admin-hamburger:focus { outline: none; }
        .admin-logo { font-weight:600; font-size:1.05rem; letter-spacing:.5px; }
        .admin-nav-label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .admin-sidebar::-webkit-scrollbar { width:6px; }
        .admin-sidebar::-webkit-scrollbar-thumb { background:rgba(255,255,255,.25); border-radius:3px; }
        @media (max-width: 768px) {
          .admin-main { font-size: 0.92rem; }
        }
      `}</style>

      <aside
        className="admin-sidebar d-flex flex-column text-white"
        style={{ width, background: '#222d32', color: '#c2c7d0' }}
      >
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-white border-opacity-25" style={{ minHeight: 60 }}>
          <div className="admin-logo d-flex align-items-center gap-2" style={{ opacity: collapsed ? 0 : 1, transition: "opacity .15s" }}>
            <img src="/logo192.png" alt="logo" style={{ width: 30, height: 30, borderRadius: 6 }} />
            <div style={{ lineHeight: 1 }}>
              <div style={{ fontWeight: 700, color: '#fff' }}>FarmHub</div>
              <small style={{ color: '#9ca3b3' }}>Admin Panel</small>
            </div>
          </div>
          <button className="admin-hamburger text-white" onClick={toggle} title={collapsed ? "Mở rộng" : "Thu nhỏ"}>
            {collapsed ? "☰" : "✕"}
          </button>
        </div>
        <nav className="nav flex-column py-2 small flex-grow-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) => linkBase + (isActive ? activeExtra : "")}
              style={{ fontSize: ".9rem" }}
            >
              <span className="me-1" style={{ width: 22, textAlign: "center", color: '#c2c7d0' }}>
                {item.icon}
              </span>
              {!collapsed && <span className="admin-nav-label flex-grow-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto border-top border-white border-opacity-25">
          <div className="d-grid gap-2">
            <button className="btn btn-sm btn-light" onClick={() => navigate("/")}>{collapsed ? "🏠" : "Xem trang"}</button>
            <button className="btn btn-sm btn-outline-light" onClick={doLogout}>{collapsed ? "⏻" : "Đăng xuất"}</button>
          </div>
          {!collapsed && <div className="mt-3 text-white-50 small text-center">© {new Date().getFullYear()} FarmHub</div>}
        </div>
      </aside>

      <main className="admin-main" style={{ marginLeft: width, padding: "1rem 1rem", background: '#f4f6f9' }}>
        <header className="d-flex align-items-center justify-content-between mb-4" style={{ minHeight: 56 }}>
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-outline-secondary d-none d-md-inline" onClick={toggle}>{collapsed ? 'Mở rộng' : 'Thu nhỏ'}</button>
            <div>
              <h1 className="h5 mb-0">Bảng quản trị</h1>
              <small className="text-muted">Quản lý nội dung nền tảng</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="small text-muted">Admin</div>
            <div style={{ width:36, height:36, borderRadius:18, background:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#444' }}>A</div>
          </div>
        </header>

        <div className="content-wrapper container-fluid px-0">
          {children}
        </div>
      </main>
    </div>
  );
}

