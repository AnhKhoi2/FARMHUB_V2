// backend/src/utils/asyncHandler.js
//wrapper cho route handlers (giúp ko lặp try/catch)
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
