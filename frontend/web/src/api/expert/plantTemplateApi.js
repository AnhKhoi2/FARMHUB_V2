import axiosClient from "../shared/axiosClient";

const plantTemplateApi = {
  /**
   * Tạo plant template mới
   */
  createTemplate: (templateData) => {
    return axiosClient.post("/api/plant-templates", templateData);
  },

  /**
   * Lấy tất cả templates với filter
   * @param {Object} params - { plant_group, status, created_by }
   */
  getAllTemplates: (params = {}) => {
    return axiosClient.get("/api/plant-templates", { params });
  },

  /**
   * Lấy template theo ID
   */
  getTemplateById: (templateId) => {
    return axiosClient.get(`/api/plant-templates/${templateId}`);
  },

  /**
   * Lấy templates theo plant_group
   */
  getTemplatesByGroup: (plantGroup) => {
    return axiosClient.get(`/api/plant-templates/group/${plantGroup}`);
  },

  /**
   * Cập nhật template
   */
  updateTemplate: (templateId, updateData) => {
    return axiosClient.put(`/api/plant-templates/${templateId}`, updateData);
  },

  /**
   * Xóa template
   */
  deleteTemplate: (templateId) => {
    return axiosClient.delete(`/api/plant-templates/${templateId}`);
  },

  /**
   * Kích hoạt template
   */
  activateTemplate: (templateId) => {
    return axiosClient.patch(`/api/plant-templates/${templateId}/activate`);
  },

  /**
   * Lấy stage theo ngày
   */
  getStageByDay: (templateId, day) => {
    return axiosClient.get(`/api/plant-templates/${templateId}/stage/${day}`);
  },
};

export default plantTemplateApi;
