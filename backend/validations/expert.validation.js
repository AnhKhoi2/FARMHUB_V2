import Joi from "joi";

// -----------------------------
// Certificate schema
// -----------------------------
const certificate = Joi.alternatives().try(
  Joi.string().uri(),
  Joi.object({ url: Joi.string().uri().required() })
);

// -----------------------------
// Tạo mới chuyên gia
// -----------------------------
export const createExpertSchema = Joi.object({
  body: Joi.object({
    full_name: Joi.string().required().messages({
      "string.empty": "Họ tên không được để trống",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Email không hợp lệ",
      "string.empty": "Email không được để trống",
    }),
    phone_number: Joi.string()
      .pattern(/^(0|\+84)[0-9]{9}$/)
      .required()
      .messages({
        "string.empty": "Số điện thoại không được để trống",
        "string.pattern.base": "Số điện thoại không hợp lệ",
      }),
    password: Joi.string().min(6).required().messages({
      "string.empty": "Mật khẩu không được để trống",
      "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    }),
    expertise_area: Joi.string().required(),
    experience_years: Joi.number().integer().min(0).required(),
    certificates: Joi.array().items(certificate).default([]),
    description: Joi.string().allow("").default(""),
  }),
});

// -----------------------------
// Cập nhật chuyên gia
// -----------------------------
export const updateExpertSchema = Joi.object({
  body: Joi.object({
    full_name: Joi.string(),
    email: Joi.string().email().messages({
      "string.email": "Email không hợp lệ",
    }),
    phone_number: Joi.string().pattern(/^(0|\+84)[0-9]{9}$/).messages({
      "string.pattern.base": "Số điện thoại không hợp lệ",
    }),
    password: Joi.string().min(6).messages({
      "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    }),
    expertise_area: Joi.string(),
    experience_years: Joi.number().integer().min(0),
    certificates: Joi.array().items(certificate),
    description: Joi.string().allow(""),
    avg_score: Joi.number().min(0).max(5),
    total_reviews: Joi.number().integer().min(0),
    status: Joi.string().valid("active", "inactive"),
  }),
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

// -----------------------------
// Lấy chi tiết chuyên gia theo ID
// -----------------------------
export const getByIdSchema = Joi.object({
  params: Joi.object({
    id: Joi.string().required(),
  }),
});

// -----------------------------
// Xóa chuyên gia theo ID (soft delete)
// -----------------------------
export const deleteSchema = getByIdSchema;
