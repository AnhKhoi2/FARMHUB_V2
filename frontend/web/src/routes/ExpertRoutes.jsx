// src/routes/ExpertRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ExpertHome from "../pages/ExpertHome"; // corrected path to pages

export default function ExpertRoutes() {
  return (
    <Routes>
      {/* /expert → /expert/home */}
      <Route index element={<Navigate to="home" replace />} />

      {/* /expert/home */}
      <Route path="home" element={<ExpertHome />} />

      {/* mọi path lạ dưới /expert → /expert/home */}
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
