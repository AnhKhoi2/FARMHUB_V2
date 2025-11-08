// middlewares/validate.js
export const validateBody = (schema) => (req, _res, next) => {
  const { value, error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(error);
  req.body = value;
  next();
};
