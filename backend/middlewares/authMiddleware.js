// backend/src/middlewares/authMiddleware.js (Updated)
import jwt from "jsonwebtoken";
import { Unauthorized, Forbidden } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"; // ✅ Đảm bảo đã import

// ✅ Helper: bật/tắt xác minh bằng ENV (AUTH_BYPASS=true)
const isBypass = () => String(process.env.AUTH_BYPASS).toLowerCase() === "true";

// Bọc bằng asyncHandler để bắt lỗi JWT.
export const verifyToken = asyncHandler((req, _res, next) => {
  if (isBypass()) {
    // ⚠️ Gắn role thay vì admin: true
    req.user = { id: "bypass", role: "admin", email: "bypass@local" };
    return next();
  }

  const h = req.headers.authorization || req.headers.Authorization;
  if (!h?.startsWith("Bearer ")) throw Unauthorized("Missing Bearer token");

  const token = h.split(" ")[1];
  
  jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, payload) => {
    // Lỗi JWT sẽ được catch bởi asyncHandler hoặc throw ApiError
    if (err) {
      if (err.name === "TokenExpiredError") {
        throw Unauthorized("Token đã hết hạn, vui lòng đăng nhập lại.");
      }
      throw Forbidden("Token không hợp lệ hoặc đã hết hạn");
    }
    // Payload lúc này phải chứa { id, role, email }
    req.user = payload; 
    next();
  });
});

// Yêu cầu role là Admin
export const requireAdmin = (req, _res, next) => {
  if (isBypass()) return next();
  // ✅ Kiểm tra role thay vì admin: true
  return (req.user?.role === 'admin')
    ? next()
    : next(Forbidden("Chỉ Admin mới có quyền truy cập"));
};

// Yêu cầu một trong các role
export const requireRoles = (roles = []) => (req, _res, next) => {
    if (isBypass()) return next();
    
    const userRole = req.user?.role;
    const requiredRoles = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : [String(roles).toLowerCase()];
    
    // Admin luôn được phép
    if (userRole === 'admin') return next();

    if (requiredRoles.includes(userRole)) {
        return next();
    }
    
    next(Forbidden(`Bạn không có đủ quyền (${requiredRoles.join(', ')}) để thực hiện thao tác này.`));
};

// Yêu cầu là chủ sở hữu HOẶC Admin
export const requireOwnerOrAdmin = (param = "id") => (req, _res, next) => {
  if (isBypass()) return next();
  
  const userIdFromToken = req.user?.id;
  const targetId = req.validated?.params?.[param] ?? req.params?.[param]; 

  if (!targetId) return next(Forbidden(`Lỗi cấu hình middleware: Thiếu ID (${param}) trong request.`));
  
  // ✅ Kiểm tra role hoặc id trùng khớp
  if (req.user?.role === 'admin' || String(userIdFromToken) === String(targetId)) {
    return next();
  }

  return next(Forbidden("Bạn chỉ có thể thực hiện thao tác này trên tài khoản của chính mình hoặc phải là Admin"));
};
// ✅ Tối ưu hóa: Định nghĩa các middleware cụ thể dựa trên requireRoles
export const requireExpertOrAdmin = requireRoles(['expert']);
export const requireModeratorOrAdmin = requireRoles(['moderator'])