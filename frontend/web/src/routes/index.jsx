import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import ExpertHome from "../pages/ExpertHome";
import PrivateRoute from "./PrivateRoute";
import ExpertRoutes from "./ExpertRoutes";

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

        {/* Bắt mọi route khác về /login (tuỳ chọn) */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
