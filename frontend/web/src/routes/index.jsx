import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/register_v1.jsx";
import Home from "../pages/Home";
import ExpertRoutes from "./ExpertRoutes";
import ExpertHome from "../pages/ExpertHome";
import ManagerGuides from "../pages/ManagerGuides";
import GuideEdit from "../pages/GuideEdit";
import GuideDetail from "../pages/GuideDetail";
import TrashGuides from "../pages/TrashGuides";
import ExpertPlantModels from "../pages/ExpertPlantModels.jsx";
import PlantModelForm from "../pages/PlantModelForm.jsx";
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

        {/* Manager guides (expert) */}
        <Route path="/managerguides" element={<ManagerGuides />} />

        <Route path="/managerguides/create" element={<GuideEdit />} />

        <Route path="/managerguides/edit/:id" element={<GuideEdit />} />

        <Route path="/managerguides/trash" element={<TrashGuides />} />

        {/* Guide detail */}
        <Route
          path="/guides/:id"
          element={
            <PrivateRoute>
              <GuideDetail />
            </PrivateRoute>
          }
        />

        {/* Plant models manager */}
        <Route path="/plantmodels" element={<ExpertPlantModels />} />
  <Route path="/plantmodels/create" element={<PlantModelForm />} />
        {/* Expert area (mounted at /expert/*) */}
        <Route
          path="/expert/*"
          element={
            <PrivateRoute>
              <ExpertRoutes />
            </PrivateRoute>
          }
        />

        {/* Shortcut: /experthome -> expert/home (temporarily public for UI testing) */}
        <Route path="/experthome" element={<ExpertHome />} />

      </Routes>
    </BrowserRouter>
  );
}
