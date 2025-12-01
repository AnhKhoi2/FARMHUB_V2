// routes/cloudinaryUpload.js
import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

// 📂 Multer lưu file tạm vào thư mục "tmp/"
const upload = multer({ dest: "tmp/" });

// POST /api/cloudinary-upload
router.post("/", upload.single("file"), async (req, res) => {
  try {
    // Nếu không có file gửi lên
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Không có file nào được upload",
      });
    }

    const filePath = req.file.path; // đường dẫn file tạm

    // 📤 Upload lên Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "farmhub", // bạn thích đặt folder tên gì cũng được
    });

    // 🗑 Xóa file tạm sau khi upload xong
    fs.unlinkSync(filePath);

    // Trả về URL ảnh cho FE
    return res.json({
      success: true,
      url: result.secure_url, // link ảnh
      public_id: result.public_id, // nếu sau này cần xóa ảnh
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({
      success: false,
      message: "Upload lên Cloudinary thất bại",
      error: err.message,
    });
  }
});

export default router;
