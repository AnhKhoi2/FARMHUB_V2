// backend/src/controllers/authController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCode.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateTokens.js";


import { OAuth2Client } from "google-auth-library";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// =========================
// Email helpers (inlined)
// =========================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(user) {
  const verifyToken = jwt.sign(
    { email: user.email },
    process.env.JWT_VERIFY_KEY,
    { expiresIn: "1h" }
  );
  const verifyLink = `${process.env.CLIENT_URL}/auth/verify/${verifyToken}`;

  await transporter.sendMail({
    from: `"Auth App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Xác nhận tài khoản của bạn",
    html: `
      <h2>Chào ${user.username}!</h2>
      <p>Nhấn vào link sau để xác nhận tài khoản của bạn:</p>
      <a href="${verifyLink}">Xác nhận tài khoản</a>
      <p>Link này sẽ hết hạn sau 1 giờ.</p>
    `,
  });

  return verifyLink;
}

async function sendPasswordResetEmail(email, token) {
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
  await transporter.sendMail({
    from: `"Auth App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Yêu cầu Đặt lại Mật khẩu",
    html: `
      <h2>Xin chào!</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản này.</p>
      <p>Vui lòng nhấp vào liên kết dưới đây để tạo mật khẩu mới:</p>
      <a href="${resetLink}">Đặt lại Mật khẩu</a>
      <p>Liên kết này có hiệu lực trong 15 phút.</p>
      <p>Nếu bạn không yêu cầu thay đổi mật khẩu, vui lòng bỏ qua email này.</p>
    `,
  });
  console.log(`[EMAIL] Sent password reset link to: ${email} (Link: ${resetLink})`);
  return resetLink;
}

// =========================
// Controller
// =========================
export const authController = {
  // Đăng ký + gửi email xác thực
  register: asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    // --- validate (giữ nguyên như service) ---
    if (!email || !password || !username) {
      const { message, statusCode } = ERROR_CODES.MISSING_FIELDS;
      throw new AppError(message, statusCode, "MISSING_FIELDS");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const { message, statusCode } = ERROR_CODES.INVALID_EMAIL;
      throw new AppError(message, statusCode, "INVALID_EMAIL");
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      const { message, statusCode } = ERROR_CODES.WEAK_PASSWORD;
      throw new AppError(message, statusCode, "WEAK_PASSWORD");
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      const { message, statusCode } = ERROR_CODES.INVALID_USERNAME;
      throw new AppError(message, statusCode, "INVALID_USERNAME");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const { message, statusCode } = ERROR_CODES.USER_EXISTS;
      throw new AppError(message, statusCode, "USER_EXISTS");
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashed,
      isVerified: false,
    });

    try {
      const saved = await newUser.save();

      // Tạo profile mặc định
      const Profile = (await import("../models/Profile.js")).default;
      await Profile.create({
        userId: saved._id,
        fullName: username,
        avatar: "",
      });

      // gửi email xác thực
      const verifyLink = await sendVerificationEmail({
        _id: saved._id,
        email: saved.email,
        username: saved.username,
      });

      const userToReturn = { ...saved._doc };
      delete userToReturn.password;

      return ok(res, {
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.",
        verifyLink,
        user: userToReturn,
      });
    } catch (err) {
      if (err.code === 11000) {
        const { message, statusCode } = ERROR_CODES.DUPLICATE_KEY;
        throw new AppError(message, statusCode, "DUPLICATE_KEY");
      }
      if (err.name === "ValidationError") {
        const { message, statusCode } = ERROR_CODES.VALIDATION_ERROR;
        throw new AppError(message, statusCode, "VALIDATION_ERROR");
      }
      console.error("register Error:", err);
      const { message, statusCode } = ERROR_CODES.INTERNAL_ERROR;
      throw new AppError(message, statusCode, "REGISTER_ERROR");
    }
  }),

  // Xác thực email
  verifyEmail: asyncHandler(async (req, res) => {
    const { token } = req.params;
    if (!token) {
      const { message, statusCode } = ERROR_CODES.NO_TOKEN;
      throw new AppError(message, statusCode, "NO_TOKEN");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_VERIFY_KEY);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        const { message, statusCode } = ERROR_CODES.TOKEN_EXPIRED;
        throw new AppError(message, statusCode, "TOKEN_EXPIRED");
      }
      const { message, statusCode } = ERROR_CODES.INVALID_TOKEN;
      throw new AppError(message, statusCode, "INVALID_TOKEN");
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      const { message, statusCode } = ERROR_CODES.USER_NOT_FOUND;
      throw new AppError(message, statusCode, "USER_NOT_FOUND");
    }
    if (user.isVerified) {
      const { message, statusCode } = ERROR_CODES.EMAIL_ALREADY_VERIFIED;
      throw new AppError(message, statusCode, "EMAIL_ALREADY_VERIFIED");
    }

    user.isVerified = true;
    await user.save();

    return ok(res, { message: "Xác thực email thành công! Bạn có thể đăng nhập." });
  }),

  // Đăng nhập
  login: asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError("Thiếu thông tin đăng nhập", 400, "MISSING_CREDENTIALS");
    }
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new AppError("Tên đăng nhập không hợp lệ", 400, "INVALID_USERNAME");
    }

    const user = await User.findOne({ username });
    if (!user) {
      throw new AppError("Thông tin đăng nhập không chính xác", 401, "INVALID_CREDENTIALS");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const { message, statusCode } = ERROR_CODES.INVALID_CREDENTIALS;
      throw new AppError(message, statusCode, "INVALID_CREDENTIALS");
    }

    if (!user.isVerified) {
      const { message, statusCode } = ERROR_CODES.ACCOUNT_NOT_VERIFIED;
      throw new AppError(message, statusCode, "ACCOUNT_NOT_VERIFIED");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

    const { password: _pw, ...userInfo } = user._doc;

    // set cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return ok(res, { user: userInfo, accessToken });
  }),

  // Refresh token
  refresh: asyncHandler(async (req, res) => {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      return res
        .status(401)
        .json({ success: false, message: "Không tìm thấy refresh token trong cookie" });
    }

    // tìm user sở hữu token
    const user = await User.findOne({ refreshTokens: oldToken });
    if (!user) {
      throw new AppError("Refresh token không hợp lệ", 401, "INVALID_REFRESH_TOKEN");
    }

    try {
      jwt.verify(oldToken, process.env.JWT_REFRESH_KEY);

      // xóa token cũ
      await User.findByIdAndUpdate(user._id, { $pull: { refreshTokens: oldToken } });

      // tạo token mới
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: newRefreshToken } });

      // ghi cookie mới
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      return ok(res, { accessToken: newAccessToken });
    } catch {
      throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401, "INVALID_REFRESH_TOKEN");
    }
  }),

  // Đăng xuất
  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
      await User.updateOne({ refreshTokens: token }, { $pull: { refreshTokens: token } });
    }
    res.clearCookie("refreshToken");
    return ok(res, "Đăng xuất thành công");
  }),

  // Thông tin "me"
  me: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const user = await User.findById(userId).select("-password");
    return res.status(200).json({ success: true, data: user });
  }),

  // Gửi mail yêu cầu đặt lại mật khẩu
  requestPasswordReset: asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      const { message, statusCode } = ERROR_CODES.MISSING_FIELDS;
      throw new AppError(message, statusCode, "MISSING_FIELDS");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const { message, statusCode } = ERROR_CODES.INVALID_EMAIL;
      throw new AppError(message, statusCode, "INVALID_EMAIL");
    }

    const user = await User.findOne({ email });
    if (!user) {
      // tránh lộ email
      const { message, statusCode } = ERROR_CODES.USER_NOT_FOUND;
      throw new AppError(message, statusCode, "USER_NOT_FOUND");
    }

    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "password_reset" },
      process.env.JWT_RESET_KEY || process.env.JWT_ACCESS_KEY,
      { expiresIn: "15m" }
    );

    await sendPasswordResetEmail(email, resetToken);

    return ok(res, {
      message: "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.",
      // Có thể ẩn resetToken ở production
      resetToken,
    });
  }),

  // Đặt lại mật khẩu bằng token
  resetPassword: asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!token || !newPassword) {
      const { message, statusCode } = ERROR_CODES.MISSING_FIELDS;
      throw new AppError(message, statusCode, "MISSING_FIELDS");
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      const { message, statusCode } = ERROR_CODES.WEAK_PASSWORD;
      throw new AppError(message, statusCode, "WEAK_PASSWORD");
    }

    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_RESET_KEY || process.env.JWT_ACCESS_KEY
      );
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        const { message, statusCode } = ERROR_CODES.TOKEN_EXPIRED;
        throw new AppError(message, statusCode, "TOKEN_EXPIRED");
      }
      const { message, statusCode } = ERROR_CODES.INVALID_TOKEN;
      throw new AppError(message, statusCode, "INVALID_TOKEN");
    }

    if (decoded.purpose !== "password_reset") {
      const { message, statusCode } = ERROR_CODES.INVALID_TOKEN;
      throw new AppError(message, statusCode, "INVALID_TOKEN_PURPOSE");
    }

    const user = await User.findOne({ _id: decoded.id, email: decoded.email });
    if (!user) {
      const { message, statusCode } = ERROR_CODES.USER_NOT_FOUND;
      throw new AppError(message, statusCode, "USER_NOT_FOUND");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return ok(res, { message: "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay." });
  }),

  // Đổi mật khẩu (yêu cầu đã đăng nhập)
// Đổi mật khẩu hoặc tạo mật khẩu lần đầu
changePassword: asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword) {
    throw new AppError("Thiếu mật khẩu mới", 400, "MISSING_FIELDS");
  }
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new AppError("Mật khẩu phải ≥8 ký tự, gồm chữ, số và ký tự đặc biệt", 400, "WEAK_PASSWORD");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404, "USER_NOT_FOUND");
  }

  // Nếu user CHƯA có password (đăng nhập Google lần đầu) → cho set thẳng
  if (!user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return ok(res, { message: "Tạo mật khẩu thành công. Từ lần sau bạn có thể đăng nhập bằng username/password." });
  }

  // Nếu user ĐÃ có password → bắt buộc kiểm tra oldPassword
  if (!oldPassword) {
    throw new AppError("Thiếu mật khẩu cũ", 400, "MISSING_FIELDS");
  }

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    throw new AppError("Mật khẩu cũ không đúng", 400, "INCORRECT_OLD_PASSWORD");
  }

  // Không cho đặt trùng y như mật khẩu cũ
  const sameAsOld = await bcrypt.compare(newPassword, user.password);
  if (sameAsOld) {
    throw new AppError("Mật khẩu mới không được trùng mật khẩu cũ", 400, "SAME_PASSWORD");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return ok(res, { message: "Đổi mật khẩu thành công" });
}),


// ...
loginWithGoogle: asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new AppError("Thiếu idToken", 400, "MISSING_FIELDS");
  }

  // 1) Verify ID token từ Google
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload(); // sub, email, name, picture, email_verified...
  const { sub: googleId, email, name, picture, email_verified } = payload;

  if (!email || !googleId) {
    throw new AppError("Token Google không hợp lệ", 400, "INVALID_GOOGLE_TOKEN");
  }

  // 2) Tìm hoặc tạo user
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      username: email.split("@")[0],
      email,
      password: null,       // đăng nhập Google
      provider: "google",
      googleId,
      isVerified: email_verified ?? true,
    });
    // (tuỳ chọn) tạo Profile mặc định tương tự luồng register
    try {
      const Profile = (await import("../models/Profile.js")).default;
      await Profile.create({
        userId: user._id,
        fullName: name || user.username,
        avatar: picture || "",
      });
    } catch {}
  } else {
    // nếu user local trước đó → gán googleId để liên kết (không ép buộc)
    if (!user.googleId) {
      user.googleId = googleId;
      user.provider = "google";
      await user.save();
    }
  }

  // 3) Cấp token như login thường
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await User.findByIdAndUpdate(user._id, { $push: { refreshTokens: refreshToken } });

  const { password: _pw, ...userInfo } = user._doc;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return ok(res, { user: userInfo, accessToken });
}),

// Tạo mật khẩu lần đầu cho user đăng nhập Google
setPassword: asyncHandler(async (req, res) => {
  const userId = req.user.id; // từ verifyToken
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new AppError("Thiếu mật khẩu mới", 400, "MISSING_FIELDS");
  }
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    throw new AppError("Mật khẩu phải ≥8 ký tự, gồm chữ, số và ký tự đặc biệt", 400, "WEAK_PASSWORD");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("Người dùng không tồn tại", 404, "USER_NOT_FOUND");
  }

  // Chỉ cho phép "tạo mật khẩu" nếu trước đó chưa có
  if (user.password) {
    throw new AppError("Tài khoản đã có mật khẩu. Hãy dùng 'Đổi mật khẩu'", 400, "PASSWORD_ALREADY_SET");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  // Có thể giữ provider = "google" (đa phương thức) hoặc chuyển "local" tuỳ chính sách của bạn
  await user.save();

  return ok(res, { message: "Tạo mật khẩu thành công. Bạn có thể đăng nhập bằng username/password." });
}),


};



