// src/api/plantApi.js
import axiosClient from "../api/shared/axiosClient.js"; // ❗ Sửa lại đường dẫn cho đúng dự án của bạn

const plantApi = {
  /**
   * Chẩn đoán từ ảnh
   *
   * Cách dùng 1 (mới - khuyến nghị):
   *   plantApi.diagnose(file, { userId, plantId })
   *
   * Cách dùng 2 (giữ tương thích cũ):
   *   plantApi.diagnose({ base64, userId, plantId })
   */
  diagnose(input, options = {}) {
    // Nếu input là File hoặc Blob -> dùng FormData
    if (
      typeof window !== "undefined" &&
      (input instanceof File || input instanceof Blob)
    ) {
      const { userId, plantId } = options;

      const formData = new FormData();
      formData.append("image", input);
      if (userId) formData.append("userId", userId);
      if (plantId) formData.append("plantId", plantId);

      return axiosClient.post("/api/plant/diagnose", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    // Ngược lại: giả định là payload JSON cũ { base64, userId, plantId }
    const payload = input || {};
    return axiosClient.post("/api/plant/diagnose", payload);
  },

  /**
   * Chẩn đoán từ mô tả text
   * payload: { description, plantType?, environment?, userId? }
   */
  aiTextDiagnose(payload) {
    return axiosClient.post("/api/plant/ai-text-diagnose", payload);
  },
};

export default plantApi;
