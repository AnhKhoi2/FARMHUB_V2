import React from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";

export default function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const doLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `nav-link text-white py-2${isActive ? " active bg-white bg-opacity-10 rounded" : ""}`;

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside
        className="p-3 text-white d-flex flex-column"
        style={{ width: 260, background: "linear-gradient(180deg,#0d6efd 0%, #6f42c1 100%)" }}
      >
        <div className="d-flex align-items-center mb-4">
          <div className="fs-4 fw-bold">FarmHub Admin</div>
        </div>

        <nav className="nav flex-column mb-3">
          <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/diseases" className={linkClass}>Diseases</NavLink>
          <NavLink to="/admin/disease-categories" className={linkClass}>Categories</NavLink>
          <NavLink to="/admin/weather" className={linkClass}>Weather</NavLink>
          <NavLink to="/admin/leaderboard" className={linkClass}>Leaderboard</NavLink>
          <NavLink to="/admin/experts" className={linkClass}>Experts</NavLink>
        </nav>

        <div className="mt-auto pt-3">
          <button className="btn btn-sm btn-light w-100 mb-2" onClick={() => navigate("/")}>Visit site</button>
          <button className="btn btn-sm btn-outline-light w-100" onClick={doLogout}>Logout</button>
          <div className="mt-3 text-white-50 small">© FarmHub</div>
        </div>
      </aside>

      <main className="flex-fill p-4 bg-light">
        <header className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h5 mb-0">Admin Panel</h2>
            <small className="text-muted">Manage diseases, categories, experts…</small>
          </div>
        </header>

        {/* Quan trọng: render route con ở đây */}
        <Outlet />
      </main>
    </div>
  );
}
