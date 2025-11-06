import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

/*
  Fixed sidebar layout with collapsible (hamburger) toggle.
  - Sidebar fixed at left; main content gets left margin so it never sits underneath.
  - Collapse state persisted in localStorage (key: adminSidebarCollapsed).
  - When collapsed: width 72px, hides labels (shows first letter) with tooltip via title attribute.
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
    } catch (_) {}
  }, []);

  const toggle = () => {
    setCollapsed(c => {
      const nv = !c;
      try { localStorage.setItem(STORAGE_KEY, String(nv)); } catch (_) {}
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
    { to: "/admin/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/admin/users", label: "Users", icon: "👥" },
    { to: "/admin/diseases", label: "Diseases", icon: "🦠" },
    { to: "/admin/disease-categories", label: "Categories", icon: "📂" },
    { to: "/admin/guides", label: "Guides", icon: "📘" },
    { to: "/admin/weather", label: "Weather", icon: "🌦" },
    { to: "/admin/leaderboard", label: "Leaderboard", icon: "🏆" },
  ];

  return (
    <div>
      {/* Inline minimal CSS for layout (could be moved to global stylesheet) */}
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
          /* Still fixed; user can collapse to gain space */
          .admin-main { font-size: 0.92rem; }
        }
      `}</style>

      <aside
        className="admin-sidebar d-flex flex-column text-white"
        style={{ width, background: "linear-gradient(180deg,#0d6efd 0%, #6f42c1 100%)" }}
      >
        <div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-white border-opacity-25" style={{minHeight:60}}>
          <div className="admin-logo d-flex align-items-center gap-2" style={{opacity: collapsed?0:1, transition:'opacity .15s'}}>
            <span>FarmHub Admin</span>
          </div>
          <button className="admin-hamburger text-white" onClick={toggle} title={collapsed?"Expand":"Collapse"}>
            {collapsed ? "☰" : "✕"}
          </button>
        </div>
        <nav className="nav flex-column py-2 small flex-grow-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({isActive}) => linkBase + (isActive ? activeExtra : "")}
              style={{ fontSize: ".9rem" }}
            >
              <span className="me-1" style={{width:18, textAlign:'center'}}>{item.icon}</span>
              {!collapsed && <span className="admin-nav-label flex-grow-1">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 mt-auto border-top border-white border-opacity-25">
          <div className="d-grid gap-2">
            <button className="btn btn-sm btn-light" onClick={() => navigate("/")}>{collapsed?"🏠":"Visit site"}</button>
            <button className="btn btn-sm btn-outline-light" onClick={doLogout}>{collapsed?"⏻":"Logout"}</button>
          </div>
          {!collapsed && <div className="mt-3 text-white-50 small text-center">© {new Date().getFullYear()} FarmHub</div>}
        </div>
      </aside>

      <main className="admin-main" style={{ marginLeft: width, padding: "1.5rem 1.25rem" }}>
        <header className="d-flex align-items-center justify-content-between mb-4" style={{minHeight:50}}>
          <div>
            <h1 className="h5 mb-0">Admin Panel</h1>
            <small className="text-muted">Manage platform content</small>
          </div>
          {/* Duplicate toggle for convenience when scrolled (optional) */}
          <button className="btn btn-outline-secondary btn-sm d-md-none" onClick={toggle}>{collapsed?"Mở":"Đóng"}</button>
        </header>
        <div className="container-fluid px-0">
          {children}
        </div>
      </main>
    </div>
  );
}
