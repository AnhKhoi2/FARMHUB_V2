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
import Profile from "../models/Profile.js";

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
    { expiresIn: "5m" }
  );
  const verifyLink = `${process.env.CLIENT_URL}/auth/verify/${verifyToken}`;

  await transporter.sendMail({
    from: `"Farmhub" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Xác nhận tài khoản của bạn",
    html: `
      <h2>Chào ${user.username},</h2>
      <p>Cảm ơn bạn đã đăng ký tài khoản tại Farmhub. Chúng tôi rất vui mừng được chào đón bạn.</p>
      <p>Để đảm bảo an toàn và bắt đầu sử dụng các dịch vụ trên hệ thống, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào đường dẫn bên dưới:</p>
      <p><a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Xác nhận tài khoản</a></p>
      <p><strong>Lưu ý:</strong> Đường dẫn này sẽ hết hạn trong vòng 5 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
      <p>Trân trọng,<br>Đội ngũ Farmhub</p>
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
  console.log(
    `[EMAIL] Sent password reset link to: ${email} (Link: ${resetLink})`
  );
  return resetLink;
}

// =========================
// Controller
// =========================
export const authController = {
  // Đăng ký + gửi email xác thực
  register: asyncHandler(async (req, res) => {
    const { email, password, username, agreedToTerms } = req.body;

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
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(password)) {
      const { message, statusCode } = ERROR_CODES.WEAK_PASSWORD;
      throw new AppError(message, statusCode, "WEAK_PASSWORD");
    }
    const usernameRegex = /^[\p{L}\p{N}_ ]{3,20}$/u;
if (!usernameRegex.test(username)) {
  const { message, statusCode } = ERROR_CODES.INVALID_USERNAME;
  throw new AppError(message, statusCode, "INVALID_USERNAME");
}

    if (!agreedToTerms) {
      const { message, statusCode } = ERROR_CODES.TERMS_NOT_ACCEPTED;
      throw new AppError(message, statusCode, "TERMS_NOT_ACCEPTED");
    }
    const existingUser = await User.findOne({ email });

    // =======================================
    // 1️⃣ EMAIL TỒN TẠI NHƯNG CHƯA XÁC THỰC
    // → Áp dụng Giới Hạn 3 lần / 1 giờ
    // =======================================
    if (existingUser && !existingUser.isVerified) {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;
      const MAX_VERIFY_PER_HOUR = 3;
      if (agreedToTerms) {
        existingUser.acceptedTerms = true;
        existingUser.acceptedTermsAt = new Date();
      }

      // Nếu đã từng gửi email trước đó
      if (existingUser.lastVerifyEmailAt) {
        const diff = now - existingUser.lastVerifyEmailAt.getTime();

        // Nếu còn trong 1 giờ và count >= MAX
        if (
          diff < ONE_HOUR &&
          existingUser.verifyEmailCount >= MAX_VERIFY_PER_HOUR
        ) {
          throw new AppError(
            "Bạn đã yêu cầu gửi lại email xác thực quá nhiều lần. Vui lòng thử lại sau 1 giờ.",
            429,
            "VERIFY_TOO_OFTEN"
          );
        }

        // Nếu đã qua 1 giờ → reset counter
        if (diff >= ONE_HOUR) {
          existingUser.verifyEmailCount = 0;
        }
      }

      // Tăng số lần gửi mail và cập nhật thời điểm gửi
      existingUser.verifyEmailCount =
        (existingUser.verifyEmailCount || 0) + 1;
      existingUser.lastVerifyEmailAt = new Date(now);

      // Cập nhật username/password (nếu người dùng nhập lại)
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.username = username;

      await existingUser.save();

      // Gửi lại email xác thực
      const verifyLink = await sendVerificationEmail({
        _id: existingUser._id,
        email: existingUser.email,
        username: existingUser.username,
      });

      const userToReturn = { ...existingUser._doc };
      delete userToReturn.password;

      return ok(res, {
        message:
          "Email này đã được đăng ký nhưng chưa xác thực. Chúng tôi đã gửi lại email xác thực, vui lòng kiểm tra hộp thư.",
        needVerify: true,
        verifyLink,
        user: userToReturn,
      });
    }

    // =======================================
    // 2️⃣ EMAIL ĐÃ TỒN TẠI + ĐÃ XÁC THỰC
    // =======================================
    if (existingUser) {
      const { message, statusCode } = ERROR_CODES.USER_EXISTS;
      throw new AppError(message, statusCode, "USER_EXISTS");
    }

    // =======================================
    // 3️⃣ TẠO USER MỚI + GỬI EMAIL VERIFY
    // =======================================
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const now = new Date();
    const newUser = new User({
      username,
      email,
      password: hashed,
      isVerified: false,
      verifyEmailCount: 1,
      lastVerifyEmailAt: now,

      // ✅ Lưu thông tin đã đồng ý điều khoản
      acceptedTerms: true,
      acceptedTermsAt: now,
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
        // ✅ Riêng luồng xác thực email: dùng status 410 + code khác
        // để FE biết là "phiên đăng kí" chứ không phải "phiên đăng nhập"
        throw new AppError(
          "Phiên đăng kí đã hết hạn, vui lòng đăng kí lại.",
          410, // HTTP 410 Gone
          "VERIFY_TOKEN_EXPIRED"
        );
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

    return ok(res, {
      message: "Xác thực email thành công! Bạn có thể đăng nhập.",
    });
  }),

  // Đăng nhập CHỈ bằng username
  // Đăng nhập bằng username hoặc email
login: asyncHandler(async (req, res) => {
  const { username, emailOrUsername, password } = req.body;

  // Cho phép dùng username hoặc email
  const identifier = (username || emailOrUsername || "").trim();

  if (!identifier || !password) {
    throw new AppError(
      ERROR_CODES.MISSING_FIELDS.message,
      ERROR_CODES.MISSING_FIELDS.statusCode,
      "MISSING_FIELDS"
    );
  }

  // ✅ Tìm theo username HOẶC email
  const user = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  });

  if (!user) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS.message,
      ERROR_CODES.INVALID_CREDENTIALS.statusCode,
      "INVALID_CREDENTIALS"
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(
      ERROR_CODES.INVALID_CREDENTIALS.message,
      ERROR_CODES.INVALID_CREDENTIALS.statusCode,
      "INVALID_CREDENTIALS"
    );
  }

  if (!user.isVerified) {
    const { message, statusCode } = ERROR_CODES.ACCOUNT_NOT_VERIFIED;
    throw new AppError(message, statusCode, "ACCOUNT_NOT_VERIFIED");
  }

  if (user.isDeleted) {
    const { message, statusCode } = ERROR_CODES.ACCOUNT_DELETED;
    throw new AppError(message, statusCode, "ACCOUNT_DELETED");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Ẩn password cho sạch dữ liệu trả về
  const userSafe = user.toObject ? user.toObject() : { ...user._doc };
  delete userSafe.password;

  // Attach profile (avatar, fullName, etc.) so FE sees avatar immediately after login
  try {
    const profileDoc = await Profile.findOne({ userId: user._id }).lean();
    if (profileDoc) {
      userSafe.profile = profileDoc;
    } else {
      userSafe.profile = { avatar: "" };
    }
  } catch (e) {
    // non-fatal: continue without profile
    userSafe.profile = userSafe.profile || { avatar: "" };
  }

  return ok(res, { user: userSafe, accessToken, refreshToken });
}),


  // Refresh token
  refresh: asyncHandler(async (req, res) => {
    const oldToken = req.cookies?.refreshToken;
    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy refresh token trong cookie",
      });
    }

    // tìm user sở hữu token
    const user = await User.findOne({ refreshTokens: oldToken });
    if (!user) {
      throw new AppError(
        "Refresh token không hợp lệ",
        401,
        "INVALID_REFRESH_TOKEN"
      );
    }

    try {
      jwt.verify(oldToken, process.env.JWT_REFRESH_KEY);

      // xóa token cũ
      await User.findByIdAndUpdate(user._id, {
        $pull: { refreshTokens: oldToken },
      });

      // tạo token mới
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      await User.findByIdAndUpdate(user._id, {
        $push: { refreshTokens: newRefreshToken },
      });

      // ghi cookie mới
      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });

      return ok(res, { accessToken: newAccessToken });
    } catch {
      throw new AppError(
        "Refresh token không hợp lệ hoặc đã hết hạn",
        401,
        "INVALID_REFRESH_TOKEN"
      );
    }
  }),

  // Đăng xuất
  logout: asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
      await User.updateOne(
        { refreshTokens: token },
        { $pull: { refreshTokens: token } }
      );
    }
    res.clearCookie("refreshToken");
    return ok(res, "Đăng xuất thành công");
  }),

  // Thông tin "me"
  me: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
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

    // 🔒 Không để lộ email có tồn tại hay không
    if (!user) {
      return ok(res, {
        message:
          "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.",
      });
    }

    // 🔒 Không cho đặt lại mật khẩu nếu tài khoản chưa xác thực email
    if (!user.isVerified) {
      const { message, statusCode } = ERROR_CODES.ACCOUNT_NOT_VERIFIED;
      throw new AppError(message, statusCode, "ACCOUNT_NOT_VERIFIED");
    }

    const resetToken = jwt.sign(
      { id: user._id, email: user.email, purpose: "password_reset" },
      process.env.JWT_RESET_KEY || process.env.JWT_ACCESS_KEY,
      { expiresIn: "15m" }
    );

    await sendPasswordResetEmail(user.email, resetToken);

    return ok(res, {
      message:
        "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.",
      // ⚠️ Production nên bỏ resetToken khỏi response
      // resetToken,
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

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
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

    const user = await User.findOne({
      _id: decoded.id,
      email: decoded.email,
    });
    if (!user) {
      const { message, statusCode } = ERROR_CODES.USER_NOT_FOUND;
      throw new AppError(message, statusCode, "USER_NOT_FOUND");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    return ok(res, {
      message:
        "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.",
    });
  }),

  // Đổi mật khẩu (yêu cầu đã đăng nhập)
  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!newPassword) {
      throw new AppError("Thiếu mật khẩu mới", 400, "MISSING_FIELDS");
    }
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new AppError(
        "Mật khẩu phải ≥8 ký tự, gồm chữ, số và ký tự đặc biệt",
        400,
        "WEAK_PASSWORD"
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        "USER_NOT_FOUND"
      );
    }

    // Nếu user CHƯA có password (đăng nhập Google lần đầu) → cho set thẳng
    if (!user.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      return ok(res, {
        message:
          "Tạo mật khẩu thành công. Từ lần sau bạn có thể đăng nhập bằng username/password.",
      });
    }

    // Nếu user ĐÃ có password → bắt buộc kiểm tra oldPassword
    if (!oldPassword) {
      throw new AppError("Thiếu mật khẩu cũ", 400, "MISSING_FIELDS");
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      throw new AppError(
        "Mật khẩu cũ không đúng",
        400,
        "INCORRECT_OLD_PASSWORD"
      );
    }

    // Không cho đặt trùng y như mật khẩu cũ
    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      throw new AppError(
        "Mật khẩu mới không được trùng mật khẩu cũ",
        400,
        "SAME_PASSWORD"
      );
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
    const { sub: googleId, email, name, picture, email_verified } =
      payload;

    if (!email || !googleId) {
      throw new AppError(
        "Token Google không hợp lệ",
        400,
        "INVALID_GOOGLE_TOKEN"
      );
    }

    // 2) Tìm hoặc tạo user
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: email.split("@")[0],
        email,
        password: null, // đăng nhập Google
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

    // Kiểm tra tài khoản đã bị xóa
    if (user.isDeleted) {
      const { message, statusCode } = ERROR_CODES.ACCOUNT_DELETED;
      throw new AppError(message, statusCode, "ACCOUNT_DELETED");
    }

    // 3) Cấp token như login thường
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: refreshToken },
    });

    const { password: _pw, ...userInfo } = user._doc;

    // Attach profile for Google-login as well
    try {
      const profileDoc = await Profile.findOne({ userId: user._id }).lean();
      if (profileDoc) userInfo.profile = profileDoc;
      else userInfo.profile = { avatar: picture || "" };
    } catch (e) {
      userInfo.profile =
        userInfo.profile || { avatar: picture || "" };
    }

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
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new AppError(
        "Mật khẩu phải ≥8 ký tự, gồm chữ, số và ký tự đặc biệt",
        400,
        "WEAK_PASSWORD"
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(
        "Người dùng không tồn tại",
        404,
        "USER_NOT_FOUND"
      );
    }

    // Chỉ cho phép "tạo mật khẩu" nếu trước đó chưa có
    if (user.password) {
      throw new AppError(
        "Tài khoản đã có mật khẩu. Hãy dùng 'Đổi mật khẩu'",
        400,
        "PASSWORD_ALREADY_SET"
      );
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // Có thể giữ provider = "google" (đa phương thức) hoặc chuyển "local" tuỳ chính sách của bạn
    await user.save();

    return ok(res, {
      message:
        "Tạo mật khẩu thành công. Bạn có thể đăng nhập bằng username/password.",
    });
  }),
};
