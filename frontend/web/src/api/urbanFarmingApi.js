// src/api/urbanFarmingApi.js
import axiosClient from "../api/shared/axiosClient.js";

const UrbanFarmingApi = {
  /** Tạo gợi ý mới (gọi AI + lưu vào DB) */
  createPlan: (body) => {
    return axiosClient.post("/api/urban-farming/plan", body);
  },

  /** Lấy danh sách gợi ý */
  getPlans: (params) => {
    return axiosClient.get("/api/urban-farming/plans", { params });
  },

  /** Lấy chi tiết 1 gợi ý */
  getPlanDetail: (id) => {
    return axiosClient.get(`/api/urban-farming/plans/${id}`);
  },

  /** Xóa mềm */
  softDelete: (id) => {
    return axiosClient.delete(`/api/urban-farming/plans/${id}`);
  },

  /** Khôi phục gợi ý đã xóa mềm */
  restore: (id) => {
    return axiosClient.patch(`/api/urban-farming/plans/${id}/restore`);
  },
};

export default UrbanFarmingApi;
