import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/register_v1.jsx";
import Home from "../pages/farmer/Home";
import PrivateRoute from "./shared/PrivateRoute";
import AdminRoute from "./admin/AdminRoute";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminDiseases from "../pages/admin/AdminDiseases";
import AdminLeaderboard from "../pages/admin/AdminLeaderboard";
import AdminWeather from "../pages/admin/AdminWeather";

// Expert Pages
import ExpertHome from "../pages/expert/ExpertHome";
import ManagerGuides from "../pages/expert/ManagerGuides";
import GuideDetail from "../pages/expert/GuideDetail";
import GuideEdit from "../pages/expert/GuideEdit";
import TrashGuides from "../pages/expert/TrashGuides";

// 🔹 NEW: import AdminLayout để dùng Outlet
import AdminLayout from "../components/AdminLayout.jsx";

// Expert nested routes
import ExpertRoutes from "./expert/ExpertRoutes.jsx";

// 🔹 NEW: import trang Experts bạn vừa copy
// Nếu bạn đặt file ở vị trí khác (ví dụ: ../pages/Admin/Expert/ExpertContent.jsx),
// hãy đổi đường dẫn import này cho khớp.
import ExpertContent from "../pages/ExpertContent.jsx";
import Market from "../pages/market.jsx";
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang Login */}
        <Route path="/login" element={<Login />} />

        {/* Trang Register */}
        <Route path="/register" element={<Register />} />
        {/* Trang xác thực email */}
        <Route path="/auth/verify/:token" element={<VerifyEmail />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminRoute>
              <AdminCategories />
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
          path="/admin/leaderboard"
          element={
            <AdminRoute>
              <AdminLeaderboard />
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

        {/* Expert Routes */}
        <Route
          path="/expert/home"
          element={
            <PrivateRoute>
              <ExpertHome />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides"
          element={
            <PrivateRoute>
              <ManagerGuides />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/create"
          element={
            <PrivateRoute>
              <GuideEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/edit/:id"
          element={
            <PrivateRoute>
              <GuideEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/detail/:id"
          element={
            <PrivateRoute>
              <GuideDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/trash"
          element={
            <PrivateRoute>
              <TrashGuides />
            </PrivateRoute>
          }
        />

        {/* 🔹 NEW: Cụm /admin có AdminLayout để gắn trang Experts (nested route) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* chỉ thêm experts ở đây để không ảnh hưởng route cũ */}
          <Route path="experts" element={<ExpertContent />} />
        </Route>

        {/* Expert area (nested routes under /expert) */}
        <Route path="/expert/*" element={<ExpertRoutes />} />

        {/* Direct expert home route for quick access/testing */}
        <Route path="/experthome" element={<ExpertHome />} />

        {/* Manager guides page (protected) */}
        <Route
          path="/managerguides"
          element={
            <PrivateRoute>
              <ManagerGuides />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/create"
          element={
            <PrivateRoute>
              <GuideEdit />
            </PrivateRoute>
          }
        />
        <Route path="/guides/:id" element={<GuideDetail />} />
        <Route
          path="/managerguides/trash"
          element={
            <PrivateRoute>
              <TrashGuides />
            </PrivateRoute>
          }
        />
        <Route
          path="/managerguides/edit/:id"
          element={
            <PrivateRoute>
              <GuideEdit />
            </PrivateRoute>
          }
        />
<Route
          path="/market"
          element={
            <PrivateRoute>
              <Market />
            </PrivateRoute>
          }
        />

        {/* legacy/shortcut route to support /createguides if linked elsewhere */}
        <Route path="/createguides" element={<Navigate to="/managerguides/create" replace />} />

        {/* Bắt mọi route khác về /login (tuỳ chọn) */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
