// validators/profile.validator.js
import Joi from "joi";

// VN phone: 0x… hoặc +84x… (đầu số 3/5/7/8/9), tổng 10 số với dạng 0xxxx…
export const PHONE_REGEX_VN = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

export const updateProfileSchema = Joi.object({
  fullName: Joi.string().trim().max(100).allow("", null),
  avatar: Joi.string().uri({ scheme: ["http", "https"] }).allow("", null),
  phone: Joi.string().trim().pattern(PHONE_REGEX_VN)
    .message("Số điện thoại không hợp lệ (VD: 090xxxxxxx hoặc +8490xxxxxxx)")
    .allow("", null),
  dob: Joi.date().max("now").messages({
    "date.base": "Ngày sinh không hợp lệ",
    "date.max": "Ngày sinh không thể ở tương lai",
  }).allow("", null),
  gender: Joi.string().valid("male", "female", "other").default("other"),
  address: Joi.string().trim().max(255).allow("", null),
  bio: Joi.string().trim().max(1000).allow("", null),
}).unknown(false); // chặn field lạ

export function validateUpdateProfile(req, res, next) {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
  if (!error) {
    req.validated = value; // đưa dữ liệu đã chuẩn hoá sang controller
    return next();
  }
  // Gom lỗi theo field
  const errors = {};
  for (const d of error.details) {
    const key = d.path.join(".") || "__root";
    errors[key] = d.message;
  }
  return res.status(422).json({
    success: false,
    message: "Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.",
    errors,
  });
}
