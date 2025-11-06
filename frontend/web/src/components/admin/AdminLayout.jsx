import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";

export default function AdminLayout({ children }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const doLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside
        className="p-3 text-white"
        style={{
          width: 260,
          background: "linear-gradient(180deg,#0d6efd 0%, #6f42c1 100%)",
        }}
      >
        <div className="d-flex align-items-center mb-4">
          <div className="fs-4 fw-bold">FarmHub Admin</div>
        </div>

        <nav className="nav flex-column mb-3">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              "nav-link text-white py-2" +
              (isActive ? " active bg-white bg-opacity-10 rounded" : "")
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/diseases"
            className={({ isActive }) =>
              "nav-link text-white py-2" +
              (isActive ? " active bg-white bg-opacity-10 rounded" : "")
            }
          >
            Diseases
          </NavLink>
          <NavLink
            to="/admin/disease-categories"
            className={({ isActive }) =>
              "nav-link text-white py-2" +
              (isActive ? " active bg-white bg-opacity-10 rounded" : "")
            }
          >
            Categories
          </NavLink>
          <NavLink
            to="/admin/weather"
            className={({ isActive }) =>
              "nav-link text-white py-2" +
              (isActive ? " active bg-white bg-opacity-10 rounded" : "")
            }
          >
            Weather
          </NavLink>
          <NavLink
            to="/admin/leaderboard"
            className={({ isActive }) =>
              "nav-link text-white py-2" +
              (isActive ? " active bg-white bg-opacity-10 rounded" : "")
            }
          >
            Leaderboard
          </NavLink>
        </nav>

        <div className="mt-auto pt-3">
          <button
            className="btn btn-sm btn-light w-100 mb-2"
            onClick={() => navigate("/")}
          >
            Visit site
          </button>
          <button
            className="btn btn-sm btn-outline-light w-100"
            onClick={doLogout}
          >
            Logout
          </button>
          <div className="mt-3 text-white-50 small">© FarmHub</div>
        </div>
      </aside>

      <main className="flex-fill p-4 bg-light">
        <header className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="h5 mb-0">Admin Panel</h2>
            <small className="text-muted">Manage diseases and categories</small>
          </div>
        </header>

        <div>{children}</div>
      </main>
    </div>
  );
}
