// validators/expertApplication.validate.js
import Joi from "joi";

export const createExpertApplicationSchema = Joi.object({
  full_name: Joi.string().trim().min(3).max(100).required(),
  expertise_area: Joi.string().trim().min(3).max(200).required(),
  experience_years: Joi.number().integer().min(0).max(80).default(0),
  description: Joi.string().allow("").max(2000),
  phone_number: Joi.string().allow("").pattern(/^(0|\+84)[0-9]{9}$/)
    .message("Số điện thoại không hợp lệ"),
  certificates: Joi.array().items(
    Joi.alternatives().try(
      Joi.string().uri(),
      Joi.object({ url: Joi.string().uri().required() })
    )
  ).default([]),
});
