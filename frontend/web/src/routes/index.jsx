import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import PrivateRoute from "./PrivateRoute";
import VerifyEmail from "../pages/VerifyEmail";
import ForgotPassword from "../pages/ForgotPassword";
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
        {/* Trang cần đăng nhập */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } 
        />

      </Routes>
    </BrowserRouter>
  );
}
