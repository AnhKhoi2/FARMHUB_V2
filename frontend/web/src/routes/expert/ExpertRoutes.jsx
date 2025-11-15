import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ExpertProfile from "../../pages/expert/ExpertProfile"; // NEW
import ExpertHome from "../../pages/expert/ExpertHome"; // corrected path to pages
import PlantTemplateManager from "../../pages/expert/PlantTemplateManager";
import PlantTemplateForm from "../../pages/expert/PlantTemplateForm";
import PlantTemplateDetail from "../../pages/expert/PlantTemplateDetail";

export default function ExpertRoutes() {
  return (
    <Routes>
      {/* /expert → /expert/home */}
      <Route index element={<Navigate to="home" replace />} />

      {/* Trang chính chuyên gia */}
      <Route path="home" element={<ExpertHome />} />

      {/* Trang hồ sơ chuyên gia (nhẹ, chỉ thông tin cơ bản) */}
      <Route path="profile" element={<ExpertProfile />} />

      {/* fallback */}
      {/* Plant Template Management */}
      <Route path="plant-templates" element={<PlantTemplateManager />} />
      <Route
        path="plant-templates/create"
        element={<PlantTemplateForm mode="create" />}
      />
      <Route path="plant-templates/:id" element={<PlantTemplateDetail />} />
      <Route
        path="plant-templates/edit/:id"
        element={<PlantTemplateForm mode="edit" />}
      />

      {/* mọi path lạ dưới /expert → /expert/home */}
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
