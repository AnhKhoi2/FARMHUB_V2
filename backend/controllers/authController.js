// backend/src/controllers/authController.js
import * as authService from "../services/authService.js";
import * as emailService from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;
    const user = await authService.registerUser(email, password, username);

    // send verification (returns verify link or similar)
    const verifyLink = await emailService.sendVerificationEmail(user);

    return ok(res, {
          message:
            "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
          verifyLink,
        });
  }),

  verifyEmail: asyncHandler(async (req, res) => {
    const { token } = req.params; // route: /verify/:token
    const result = await authService.verifyEmailToken(token);
    return ok(res, { message: "Xác thực email thành công! Bạn có thể đăng nhập." });
  }),

  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(username, password);

    // set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return ok(res, { user, accessToken });
  }),

  refresh: asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ success: false, message: "Không tìm thấy refresh token trong cookie" });
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(oldRefreshToken);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return ok(res, { accessToken });
  }),

  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    await authService.logout(token);
    res.clearCookie("refreshToken");
    return ok(res, "Đăng xuất thành công");
  }),

  me: asyncHandler(async (req, res) => {
    // verifyToken middleware should set req.user
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    // Assuming User model is accessible:
    const User = (await import("../models/User.js")).default;
    const user = await User.findById(userId).select("-password");
    return res.status(200).json({ success: true, data: user });
  }),
  // 📧 Yêu cầu đặt lại mật khẩu (Gửi email)
    requestPasswordReset: asyncHandler(async (req, res) => {
      const { email } = req.body;
      const resetToken = await authService.requestPasswordReset(email);
  
      // Giả định emailService.sendPasswordResetEmail tồn tại
      if (resetToken) {
          await emailService.sendPasswordResetEmail(email, resetToken);
      }
  
      // Trả về thông báo thành công chung để tránh lộ email
      return ok(res, { 
          message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.",
          // Trả về resetToken cho mục đích testing trong môi trường dev
          resetToken: resetToken 
      });
    }),
    
    // 🔄 Đặt lại mật khẩu (Dùng token)
    resetPassword: asyncHandler(async (req, res) => {
      const { token } = req.params;
      const { newPassword } = req.body;
  
      await authService.resetPassword(token, newPassword);
  
      return ok(res, { message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay." });
    }),
  };

