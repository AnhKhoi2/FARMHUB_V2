import ApiError, { BadRequest, Unauthorized } from "../utils/ApiError.js";


/**
 * Middleware để validate request data bằng Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {String} source - 'body' | 'query' | 'params' - nguồn dữ liệu cần validate
 */
export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    try {
      // Chọn data source để validate (body, query, hoặc params)
      let dataToValidate;
      switch (source) {
        case "query":
          dataToValidate = req.query;
          break;
        case "params":
          dataToValidate = req.params;
          break;
        case "body":
        default:
          dataToValidate = req.body;
          break;
      }

      // Validate với Joi
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Trả về tất cả lỗi, không dừng ở lỗi đầu tiên
        stripUnknown: true, // Loại bỏ các field không được định nghĩa trong schema
      });

      if (error) {
        // Format lỗi từ Joi
        const issues = error.details.map((detail) => ({
          path: detail.path.join("."),
          message: detail.message,
        }));
        return next(
          new ApiError(400, "VALIDATION_ERROR", "Invalid request", issues)
        );
      }

      // Lưu validated data vào request
      req.validated = value;
      next();
    } catch (e) {
      next(
        new ApiError(500, "VALIDATION_ERROR", "Validation middleware error", [
          { message: e.message },
        ])
      );
    }
  };
// middlewares/validate.js
export const validateBody = (schema) => (req, _res, next) => {
  const { value, error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(error);
  req.body = value;
  next();
};
