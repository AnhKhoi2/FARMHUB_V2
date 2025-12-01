// backend/middleware/uploadImage.js
import multer from "multer";

// Lưu file vào RAM (buffer) để dễ convert base64 gửi qua Plant.id
const storage = multer.memoryStorage();

// Giới hạn 50MB cho mỗi file ảnh (muốn nữa thì tăng số này)
export const uploadImage = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});
