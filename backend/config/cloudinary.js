// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";

// ⚙️ Cấu hình Cloudinary bằng biến môi trường trong .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,   // Tên cloud của bạn
  api_key: process.env.CLOUDINARY_KEY,      // API key
  api_secret: process.env.CLOUDINARY_SECRET // API secret
});

// export để file khác dùng
export default cloudinary;
