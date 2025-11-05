// backend/services/emailService.js
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

// ✅ Tạo transporter DÙNG CHUNG cho mọi hàm
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // ví dụ: you@gmail.com
    pass: process.env.EMAIL_PASS, // App password (không phải mật khẩu thường)
  },
});

// (không bắt buộc) Kiểm tra cấu hình SMTP một lần khi khởi tạo
// await transporter.verify().catch(console.error);

export const sendVerificationEmail = async (user) => {
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
};

/**
 * Gửi email Đặt lại Mật khẩu (Password Reset)
 */
export const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  const mailOptions = {
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
  };

  await transporter.sendMail(mailOptions);
  console.log(`[EMAIL] Sent password reset link to: ${email} (Link: ${resetLink})`);
  return resetLink;
};
