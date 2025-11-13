import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ExpertHome from "../../pages/expert/ExpertHome";
import ExpertProfile from "../../pages/expert/ExpertProfile"; // NEW

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
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
