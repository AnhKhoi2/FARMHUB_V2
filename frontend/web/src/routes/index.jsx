import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import ExpertHome from "../pages/ExpertHome";
import PrivateRoute from "./PrivateRoute";
import AdminDashboard from "../pages/AdminDashboard";
import AdminRoute from "./AdminRoute";
import AdminDiseases from "../pages/AdminDiseases";
import AdminCategories from "../pages/AdminCategories";
import Diagnose from "../pages/Diagnose";
import AdminWeather from "../pages/AdminWeather";
import AdminLeaderboard from "../pages/AdminLeaderboard";
import ExpertRoutes from "./ExpertRoutes";
import ManagerGuides from "../pages/ManagerGuides";
import GuideDetail from "../pages/GuideDetail";
import GuideEdit from "../pages/GuideEdit";
import TrashGuides from "../pages/TrashGuides";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* root -> chuyển về login (luôn hiển thị login tại /) */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Trang Login */}
        <Route path="/login" element={<Login />} />

        {/* Trang Register */}
        <Route path="/register" element={<Register />} />

        {/* Trang cần đăng nhập (đổi sang /home) */}
        <Route
          path="/home"
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
        {/* Expert area (nested routes under /expert) */}
        <Route path="/expert/*" element={<ExpertRoutes />} />

  {/* Direct expert home route for quick access/testing */}
  <Route path="/experthome" element={<ExpertHome />} />
  {/* Manager guides page (protected) */}
  <Route path="/managerguides" element={<PrivateRoute><ManagerGuides /></PrivateRoute>} />
  <Route path="/managerguides/create" element={<PrivateRoute><GuideEdit /></PrivateRoute>} />
  <Route path="/guides/:id" element={<GuideDetail />} />
  <Route path="/managerguides/trash" element={<PrivateRoute><TrashGuides /></PrivateRoute>} />
  <Route path="/managerguides/edit/:id" element={<PrivateRoute><GuideEdit /></PrivateRoute>} />
  {/* legacy/shortcut route to support /createguides if linked elsewhere */}
  <Route path="/createguides" element={<Navigate to="/managerguides/create" replace />} />

        {/* Bắt mọi route khác về /login (tuỳ chọn) */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
