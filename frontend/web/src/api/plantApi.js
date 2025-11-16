// src/api/plantApi.js
import axiosClient from "../api/shared/axiosClient.js"; // ❗ Sửa lại đường dẫn cho đúng dự án của bạn

const plantApi = {
  /**
   * Gửi base64 ảnh lên BE để chẩn đoán
   * payload: { base64: string, plantId?: string, userId?: string }
   */
  diagnose(payload) {
    return axiosClient.post("/api/plant/diagnose", payload);
  },
};

export default plantApi;
