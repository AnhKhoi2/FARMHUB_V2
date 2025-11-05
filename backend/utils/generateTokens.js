// backend/src/utils/generateTokens.js (Updated with defensive checks)
import jwt from "jsonwebtoken";

const getRequiredEnv = (key) => {
    const value = process.env[key];
    if (!value) {
        // Ném lỗi rõ ràng nếu khóa bí mật cơ bản bị thiếu
        throw new Error(`Cấu hình lỗi: Khóa bí mật '${key}' (trong .env) bị thiếu.`);
    }
    return value;
};

// Khóa cơ bản, BẮT BUỘC phải tồn tại
const ACCESS_SECRET = getRequiredEnv('JWT_ACCESS_KEY');
const REFRESH_SECRET = getRequiredEnv('JWT_REFRESH_KEY');
// Khóa RESET: ưu tiên khóa riêng, nếu thiếu thì dùng khóa ACCESS
const RESET_SECRET = process.env.JWT_RESET_KEY || ACCESS_SECRET;
export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      // ✅ ĐẢM BẢO LẤY ID TỪ _id HOẶC id (user._id là chuẩn Mongoose)
      id: user._id || user.id, 
      role: user.role, 
      email: user.email,
      subscriptionTier: user.subscriptionTier, 
    },
    ACCESS_SECRET, 
    { expiresIn: "1h" }
  );
};
export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id || user.id, role: user.role },
    REFRESH_SECRET, // Dùng REFRESH_SECRET
    { expiresIn: "365d" }
  );
};

export const generatePasswordResetToken = (user) => {
  const token = jwt.sign(
    { id: user._id || user.id, email: user.email, purpose: "password_reset" },
    RESET_SECRET, // Dùng RESET_SECRET
    { expiresIn: "15m" } 
  );

  const expires = Date.now() + 15 * 60 * 1000; 
  
  return { token, expires: new Date(expires) };
};