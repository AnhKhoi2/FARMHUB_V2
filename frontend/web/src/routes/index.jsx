// src/routes/AppRoutes.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/register_v1.jsx";
import VerifyEmail from "../pages/auth/VerifyEmail";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword"; // <- thêm từ code 2
import WeatherPage from "../pages/WeatherPage.jsx";
import PlantDiagnosisPage from "../pages/PlantDiagnosisPage";

// Guards
import PrivateRoute from "./shared/PrivateRoute"; // dùng path kiểu code 1
import AdminRoute from "./admin/AdminRoute";
import ModeratorRoute from "./moderator/ModeratorRoute";

// Common/Feature pages
import Home from "../pages/farmer/Home"; // giữ nguyên path kiểu code 1
import ProfilePage from "../pages/auth/ProfilePage.jsx"; // <- thêm từ code 2
import Post from "../pages/post.jsx";
import ExpertsList from "../pages/expert/ExpertsList";
// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminCategories from "../pages/admin/AdminCategories";
import AdminDiseases from "../pages/admin/AdminDiseases";
import AdminLeaderboard from "../pages/admin/AdminLeaderboard";
import AdminWeather from "../pages/admin/AdminWeather";
import AdminExperts from "../pages/admin/AdminExperts";
import AdminExpertApplications from "../pages/admin/AdminExpertApplications";
import AdminProfile from "../pages/admin/AdminProfile";
import AdminModels from "../pages/admin/Models";
import AdminPost from "../pages/admin/AdminPost";
import AdminGuides from "../pages/admin/AdminGuides";
// lazy load để tránh require() trên browser
const AdminUsers = React.lazy(() => import("../pages/admin/AdminUsers"));

// Admin layout + nested
import AdminLayout from "../components/AdminLayout.jsx";

// Moderator pages
import ModeratorHome from "../pages/moderator/ModeratorHome";
import ManagerPost from "../pages/moderator/ManagerPost";
import ManagerReport from "../pages/moderator/ManagerReport";

// Expert area
import ExpertHome from "../pages/expert/ExpertHome";
import ApplyExpert from "../pages/expert/ApplyExpert";
import ExpertModels from "../pages/expert/Models";
import ManagerGuides from "../pages/expert/ManagerGuides";
import GuideDetail from "../pages/expert/GuideDetail";
import FarmerGuideDetail from "../pages/farmer/GuideDetail";
import Guides from "../pages/farmer/Guides";
import GuideEdit from "../pages/expert/GuideEdit";
import TrashGuides from "../pages/expert/TrashGuides";
import PostDetail from "../pages/PostDetail";

// Farmer Pages - Notebook
import NotebookList from "../pages/farmer/NotebookList";
import NotebookDetail from "../pages/farmer/NotebookDetail";
import NotebookCreate from "../pages/farmer/NotebookCreate";
import NotebookEdit from "../pages/farmer/NotebookEdit";
import OverdueDetail from "../pages/farmer/OverdueDetail";
import NotebookStatsPage from "../pages/farmer/NotebookStatsPage";

// Farmer Pages - Collections
import Collections from "../pages/farmer/Collections";
import CollectionDetail from "../pages/farmer/CollectionDetail";

// Farmer Pages - Diseases
import Diseases from "../pages/farmer/Diseases";

// Expert nested routes
import ExpertRoutes from "./expert/ExpertRoutes.jsx";

// Trang Experts bạn đã copy (đặt ở đâu thì chỉnh import tương ứng)
import ExpertContent from "../pages/ExpertContent.jsx";
import AIChatWidget from "../components/shared/AIChatWidget";
import StreakScreen from "../pages/farmer/StreakScreen.jsx";

import { useLocation } from 'react-router-dom';
import AdminDetailGuides from "../pages/admin/AdminDetailGuides.jsx";

import PlantCarePricing from "../pages/Subscription/PlantCarePricing";
import PaymentSuccess from "../pages/Subscription/PaymentSuccess";
import PaymentFailed from "../pages/Subscription/PaymentFailed";


export default function AppRoutes() {
  function ChatWrapper() {
    const location = useLocation();
    // don't show chat widget on admin paths
    if (location.pathname && location.pathname.startsWith("/admin"))
      return null;
    return <AIChatWidget />;
  }
  return (
    <BrowserRouter>
      <Routes>
        {/* ===== Public Auth ===== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Trang xác thực email */}
        <Route path="/auth/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Public home route */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/verify/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />{" "}
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/plant-diagnosis" element={<PlantDiagnosisPage />} />
        {/* <- từ code 2 */}
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
          path="/admin/disease-categories"
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
          path="/admin/profile"
          element={
            <AdminRoute>
              <AdminProfile />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/guides/:id"
          element={
            <AdminRoute>
              <AdminDetailGuides />
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
        {/* ===== Moderator area ===== */}
        <Route
          path="/moderator"
          element={
            // <ModeratorRoute>
            <ModeratorHome />
            // </ModeratorRoute>
          }
        />
        <Route
          path="/moderator/managerpost"
          element={
            <ModeratorRoute>
              <ManagerPost />
            </ModeratorRoute>
          }
        />
        <Route
          path="/moderator/managerreport"
          element={
            <ModeratorRoute>
              <ManagerReport />
            </ModeratorRoute>
          }
        />
        {/* ===== Expert area ===== */}
        <Route
          path="/expert/home"
          element={
            <PrivateRoute>
              <ExpertHome />
            </PrivateRoute>
          }
        />
        <Route
          path="/expert/apply"
          element={
            <PrivateRoute>
              <ApplyExpert />
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
          path="/admin/models"
          element={
            <AdminRoute>
              <AdminModels />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/managerpost"
          element={
            <AdminRoute>
              <AdminPost />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/managerguides"
          element={
            <AdminRoute>
              <AdminGuides />
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
        {/* Manager guides (public) */}
        <Route path="/managerguides" element={<ManagerGuides />} />
        <Route path="/managerguides/create" element={<GuideEdit />} />
        <Route path="/managerguides/edit/:id" element={<GuideEdit />} />
        <Route path="/managerguides/detail/:id" element={<GuideDetail />} />
        {/* Farmer-facing guides list */}
        <Route path="/guides" element={<Guides />} />
        <Route path="/managerguides/trash" element={<TrashGuides />} />
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
        {/* Route xem chi tiết guide cho farmer (public) */}
        <Route path="/guides/:id" element={<FarmerGuideDetail />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        {/* Expert nested bundle (nếu bạn có thêm nhiều trang con dưới /expert) */}
        <Route path="/expert/*" element={<ExpertRoutes />} />
        {/* Direct expert home route for quick access/testing */}
        <Route path="/experthome" element={<ExpertHome />} />
        <Route path="/experthome/models" element={<ExpertModels />} />
        <Route path="/experts" element={<ExpertsList />} />
        <Route path="/pricing" element={<PlantCarePricing />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
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
              <Post />
            </PrivateRoute>
          }
        />
        {/* Farmer Routes - Notebook */}
        <Route
          path="/farmer/notebooks"
          element={
            <PrivateRoute>
              <NotebookList />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/notebooks/stats"
          element={
            <PrivateRoute>
              <NotebookStatsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/notebooks/create"
          element={
            <PrivateRoute>
              <NotebookCreate />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/notebooks/:id"
          element={
            <PrivateRoute>
              <NotebookDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/notebooks/:id/edit"
          element={
            <PrivateRoute>
              <NotebookEdit />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/notebooks/:id/overdue"
          element={
            <PrivateRoute>
              <OverdueDetail />
            </PrivateRoute>
          }
        />
        {/* Farmer Routes - Collections */}
        <Route
          path="/farmer/collections"
          element={
            <PrivateRoute>
              <Collections />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/collections/:id"
          element={
            <PrivateRoute>
              <CollectionDetail />
            </PrivateRoute>
          }
        />
        {/* Farmer Routes - Diseases */}
        <Route
          path="/diseases"
          element={
            <PrivateRoute>
              <Diseases />
            </PrivateRoute>
          }
        />
        <Route
          path="/farmer/streak"
          element={
            <PrivateRoute>
              <StreakScreen />
            </PrivateRoute>
          }
        />
        {/* Home route for regular users (farmers) */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        {/* legacy/shortcut route to support /createguides if linked elsewhere */}
        {/* Legacy/shortcut */}
        <Route
          path="/createguides"
          element={<Navigate to="/managerguides/create" replace />}
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {/* Global AI chat widget (floating) - hidden on /admin */}
      <ChatWrapper />
    </BrowserRouter>
  );
}
