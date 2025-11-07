// src/routes/AppRoutes.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/register_v1.jsx";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword"; // <- thêm từ code 2

// Guards
import PrivateRoute from "./shared/PrivateRoute"; // dùng path kiểu code 1
import AdminRoute from "./admin/AdminRoute";

// Common/Feature pages
import Home from "../pages/farmer/Home"; // giữ nguyên path kiểu code 1
import ProfilePage from "../pages/auth/ProfilePage.jsx"; // <- thêm từ code 2
import Market from "../pages/market.jsx";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminDiseases from "../pages/admin/AdminDiseases";
import AdminLeaderboard from "../pages/admin/AdminLeaderboard";
import AdminWeather from "../pages/admin/AdminWeather";
import AdminExperts from "../pages/admin/AdminExperts";
import AdminExpertApplications from "../pages/admin/AdminExpertApplications";
// lazy load để tránh require() trên browser
const AdminUsers = React.lazy(() => import("../pages/admin/AdminUsers"));

// Admin layout + nested
import AdminLayout from "../components/AdminLayout.jsx";

// Expert area
import ExpertHome from "../pages/expert/ExpertHome";
import ManagerGuides from "../pages/expert/ManagerGuides";
import GuideDetail from "../pages/expert/GuideDetail";
import GuideEdit from "../pages/expert/GuideEdit";
import TrashGuides from "../pages/expert/TrashGuides";
import ExpertRoutes from "./expert/ExpertRoutes.jsx";

// Trang Experts bạn đã copy (đặt ở đâu thì chỉnh import tương ứng)
import ExpertContent from "../pages/ExpertContent.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Public Auth ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* <- từ code 2 */}

        {/* ===== Protected app (từ code 2) ===== */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* ===== Admin (giữ nguyên + bổ sung nested) ===== */}
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
          path="/admin/users"
          element={
            <AdminRoute>
              <React.Suspense fallback={<div>Loading...</div>}>
                <AdminUsers />
              </React.Suspense>
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
        <Route
          path="/admin/experts"
          element={
            <AdminRoute>
              <AdminExperts />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/expert-applications"
          element={
            <AdminRoute>
              <AdminExpertApplications />
            </AdminRoute>
          }
        />

        {/* Cụm /admin có layout + nested Experts Content (không ảnh hưởng route cũ) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="experts" element={<ExpertContent />} />
        </Route>

        {/* ===== Expert area ===== */}
        <Route
          path="/expert/home"
          element={
            <PrivateRoute>
              <ExpertHome />
            </PrivateRoute>
          }
        />

        {/* Gom cụm Manager Guides, tránh trùng lặp */}
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

        {/* Route xem chi tiết guide theo id (nếu nơi khác có dùng) */}
        <Route path="/guides/:id" element={<GuideDetail />} />

        {/* Expert nested bundle (nếu bạn có thêm nhiều trang con dưới /expert) */}
        <Route path="/expert/*" element={<ExpertRoutes />} />

        {/* Lối tắt kiểm thử */}
        <Route
          path="/experthome"
          element={
            <PrivateRoute>
              <ExpertHome />
            </PrivateRoute>
          }
        />

        {/* Marketplace (giữ nguyên từ code 1) */}
        <Route
          path="/market"
          element={
            <PrivateRoute>
              <Market />
            </PrivateRoute>
          }
        />

        {/* Legacy/shortcut */}
        <Route
          path="/createguides"
          element={<Navigate to="/managerguides/create" replace />}
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
