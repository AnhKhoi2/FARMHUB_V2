import axiosClient from "./axiosClient";

const guidesApi = {
  /**
   * Lấy danh sách guides với filter
   * @param {Object} params - { page, limit, search, category, plant_group }
   */
  getAllGuides: (params = {}) => {
    return axiosClient.get("/guides", { params });
  },

  /**
   * Lấy guide theo ID
   */
  getGuideById: (guideId) => {
    return axiosClient.get(`/guides/${guideId}`);
  },

  /**
   * Tạo guide mới
   */
  createGuide: (guideData) => {
    return axiosClient.post("/guides", guideData);
  },

  /**
   * Cập nhật guide
   */
  updateGuide: (guideId, updateData) => {
    return axiosClient.put(`/guides/${guideId}`, updateData);
  },

  /**
   * Xóa guide
   */
  deleteGuide: (guideId) => {
    return axiosClient.delete(`/guides/${guideId}`);
  },
};

export default guidesApi;
