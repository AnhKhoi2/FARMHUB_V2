// src/api/pesticideApi.js
import axiosClient from "../api/shared/axiosClient.js";

const pesticideApi = {
  /**
   * Gọi AI (Gemini) để mô tả thông tin thuốc BVTV theo tên người dùng nhập
   * @param {string} name - Tên thuốc BVTV (tên thương phẩm)
   * @returns {Promise<Object>} - dữ liệu JSON AI trả về
   */
  getAiInfoByName(name) {
    return axiosClient.post("/api/pesticides/ai-info", { name });
  },
};

export default pesticideApi;
