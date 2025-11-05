import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import ExpertHome from "../pages/ExpertHome";
import PrivateRoute from "./PrivateRoute";
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
