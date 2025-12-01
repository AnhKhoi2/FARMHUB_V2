import Joi from "joi";

export const createExpertApplicationSchema = Joi.object({
  full_name: Joi.string().max(50).required(),
  expertise_area: Joi.string().required(),
  experience_years: Joi.number().min(0).optional(),
  description: Joi.string().max(250).allow("").optional(),
  phone_number: Joi.string().allow("").optional(),

  // Accept array of strings OR single string (allow any string, not only URI)
  certificates: Joi.alternatives().try(
    Joi.array().items(Joi.string().allow("")),
    Joi.string().allow("")
  ).optional()
});

// default export for compatibility
export default { createExpertApplicationSchema };
