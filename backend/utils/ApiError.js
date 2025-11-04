// src/utils/ApiError.js
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

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
