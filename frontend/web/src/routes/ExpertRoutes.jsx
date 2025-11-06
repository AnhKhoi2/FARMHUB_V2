// src/routes/ExpertRoutes.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ExpertHome from "../pages/ExpertHome"; // corrected path to pages
import ExpertPlantModels from "../pages/ExpertPlantModels";
import PlantModelEdit from "../pages/PlantModelEdit";
import PlantModelDetail from "../pages/PlantModelDetail";

export default function ExpertRoutes() {
  return (
    <Routes>
      {/* /expert → /expert/home */}
      <Route index element={<Navigate to="home" replace />} />

      {/* /expert/home */}
      <Route path="home" element={<ExpertHome />} />
  <Route path="plantmodels" element={<ExpertPlantModels />} />
  <Route path="plantmodels/create" element={<PlantModelEdit />} />
  <Route path="plantmodels/edit/:id" element={<PlantModelEdit />} />
  <Route path="plantmodels/:id" element={<PlantModelDetail />} />

      {/* mọi path lạ dưới /expert → /expert/home */}
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}
