// src/utils/ApiError.js
class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}


export default ApiError;

export const BadRequest = (message = "Bad Request", details) =>
  new ApiError(400, "BAD_REQUEST", message, details);

export const Unauthorized = (message = "Unauthorized", details) =>
  new ApiError(401, "UNAUTHORIZED", message, details);

export const Forbidden = (message = "Forbidden", details) =>
  new ApiError(403, "FORBIDDEN", message, details);

export const NotFound = (message = "Not Found", details) =>
  new ApiError(404, "NOT_FOUND", message, details);

export const Conflict = (message = "Conflict", details) =>
  new ApiError(409, "CONFLICT", message, details);
