// backend/src/services/authService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateAccessToken, generateRefreshToken , generatePasswordResetToken } from "../utils/generateTokens.js";
import { AppError } from "../utils/AppError.js";
import { ERROR_CODES } from "../utils/errorCode.js";

// NOTE: storing refresh tokens in memory is NOT for production.
// Replace with DB or Redis for production.


export const registerUser = async (email, password, username) => {
  try {
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

    const saved = await newUser.save();
    const userToReturn = { ...saved._doc };
    delete userToReturn.password;

    return userToReturn;
  } catch (err) {
    if (err.code === 11000) {
      const { message, statusCode } = ERROR_CODES.DUPLICATE_KEY;
      throw new AppError(message, statusCode, "DUPLICATE_KEY");
    }

    if (err.name === "ValidationError") {
      const { message, statusCode } = ERROR_CODES.VALIDATION_ERROR;
      throw new AppError(message, statusCode, "VALIDATION_ERROR");
    }

    console.error("registerUser Error:", err);
    const { message, statusCode } = ERROR_CODES.INTERNAL_ERROR;
    throw new AppError(message, statusCode, "REGISTER_ERROR");
  }
};

export const verifyEmailToken = async (token) => {
  try {
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

    return { success: true, message: "Xác thực email thành công!" };
  } catch (err) {
    if (err instanceof AppError) throw err;
    console.error("verifyEmailToken Error:", err);
    const { message, statusCode } = ERROR_CODES.INTERNAL_ERROR;
    throw new AppError(message, statusCode, "VERIFY_ERROR");
  }
};

export const loginUser = async (username, password) => {
  try {
    // Kiểm tra dữ liệu đầu vào ngay từ đầu
    if (!username || !password) {
      throw new AppError("Thiếu thông tin đăng nhập", 400, "MISSING_CREDENTIALS");
    }

    // Kiểm tra username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/; // Đã sửa regex cho phù hợp hơn
    if (!usernameRegex.test(username)) {
      throw new AppError("Tên đăng nhập không hợp lệ", 400, "INVALID_USERNAME");
    }

    // Tìm user
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

    // save refresh token (in-memory here)
    await User.findByIdAndUpdate(user._id, {
    $push: { refreshTokens: refreshToken }
    });

    const { password: _, ...userInfo } = user._doc;
    return {
      user: userInfo,
      accessToken,
      refreshToken,
    };
  } catch (err) {
    // Chỉ throw lỗi một lần
    if (err instanceof AppError) {
      throw err;
    }
    
    console.error("[Login Error]:", err.message);
    throw new AppError("Lỗi server", 500, "SERVER_ERROR");
  }
};

export const refreshToken = async (oldToken) => {
  if (!oldToken) {
    throw new AppError("Không tìm thấy refresh token", 401, "NO_REFRESH_TOKEN");
  }

  // Tìm user đang sở hữu token này
  const user = await User.findOne({ refreshTokens: oldToken });
  if (!user) {
    throw new AppError("Refresh token không hợp lệ", 401, "INVALID_REFRESH_TOKEN");
  }

  try {
    // Kiểm tra hạn token
    const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_KEY);

    // Xóa token cũ
    await User.findByIdAndUpdate(user._id, {
      $pull: { refreshTokens: oldToken },
    });

    // Tạo token mới
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Lưu token mới vào DB
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: newRefreshToken },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401, "INVALID_REFRESH_TOKEN");
  }
};

export const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        // Trả về thành công để tránh lộ thông tin email nào tồn tại
        console.warn(`Attempted password reset for non-existent email: ${email}`);
        return null; 
    }
    
    // Tạo token và thời hạn
    const { token, expires } = generatePasswordResetToken(user);
    
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    await user.save();

    return token; // Token để gửi qua email
};

export const resetPassword = async (token, newPassword) => {
    // 1. Tìm user bằng token và đảm bảo token chưa hết hạn
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() } // $gt: greater than
    });

    if (!user) {
        throw BadRequest("Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.");
    }
    
    // 2. Hash mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    
    // 3. Cập nhật mật khẩu và xóa token reset
    user.password = hashed;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
};



export const logout = async (token) => {
  if (!token) return;

  await User.updateOne(
    { refreshTokens: token },
    { $pull: { refreshTokens: token } }
  );
};

