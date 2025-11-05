import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import PrivateRoute from "./PrivateRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminRoute from "./AdminRoute";
import AdminDiseases from "../pages/AdminDiseases";
import AdminCategories from "../pages/AdminCategories";
import Diagnose from "../pages/Diagnose";
import AdminWeather from "../pages/AdminWeather";
import AdminLeaderboard from "../pages/AdminLeaderboard";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Trang Login */}
        <Route path="/login" element={<Login />} />

        {/* Trang Register */}
        <Route path="/register" element={<Register />} />

        {/* Trang cần đăng nhập */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />

        <Route
          path="/diagnose"
          element={
            <PrivateRoute>
              <Diagnose />
            </PrivateRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/diseases"
          element={
            <AdminRoute>
              <AdminDiseases />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/disease-categories"
          element={
            <AdminRoute>
              <AdminCategories />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/weather"
          element={
            <AdminRoute>
              <AdminWeather />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/leaderboard"
          element={
            <AdminRoute>
              <AdminLeaderboard />
            </AdminRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
