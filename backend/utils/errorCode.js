// backend/src/utils/errorCodes.js
export const ERROR_CODES = {
  // AUTH
  USER_EXISTS: {
    message: "Email đã tồn tại, vui lòng sử dụng email khác.",
    statusCode: 409,
  },
  USER_NOT_FOUND: {
    message: "Không tìm thấy người dùng.",
    statusCode: 404,
  },
  EMAIL_ALREADY_VERIFIED: {
    message: "Email đã được xác thực trước đó.",
    statusCode: 400,
  },
  INVALID_CREDENTIALS: {
    message: "Tên đăng nhập hoặc mật khẩu không đúng.",
    statusCode: 401,
  },
  ACCOUNT_NOT_VERIFIED: {
    message: "Tài khoản chưa được xác thực, vui lòng kiểm tra email.",
    statusCode: 403,
  },

  // TOKEN
  TOKEN_EXPIRED: {
    message: "Token đã hết hạn, vui lòng đăng nhập lại.",
    statusCode: 401,
  },
  INVALID_TOKEN: {
    message: "Token không hợp lệ.",
    statusCode: 401,
  },
  NO_TOKEN: {
    message: "Không tìm thấy token xác thực.",
    statusCode: 400,
  },

  // VALIDATION
  MISSING_FIELDS: {
    message: "Thiếu thông tin bắt buộc.",
    statusCode: 400,
  },
  INVALID_EMAIL: {
    message: "Định dạng email không hợp lệ.",
    statusCode: 400,
  },
  WEAK_PASSWORD: {
    message:
      "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ, số và ký tự đặc biệt.",
    statusCode: 400,
  },
  INVALID_USERNAME: {
    message:
      "Tên người dùng chỉ được chứa chữ, số, dấu gạch dưới và từ 3–20 ký tự.",
    statusCode: 400,
  },

  // DB / MONGOOSE
  DUPLICATE_KEY: {
    message: "Dữ liệu đã tồn tại trong hệ thống.",
    statusCode: 409,
  },
  VALIDATION_ERROR: {
    message: "Dữ liệu đầu vào không hợp lệ.",
    statusCode: 400,
  },
  CAST_ERROR: {
    message: "Định dạng ID không hợp lệ.",
    statusCode: 400,
  },

  // SYSTEM
  INTERNAL_ERROR: {
    message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
    statusCode: 500,
  },
};
