import jwt from "jsonwebtoken";

export const isBypass = () => String(process.env.AUTH_BYPASS).toLowerCase() === "true";

export function signAccessToken(payload, opts = {}) {
  return jwt.sign(payload, process.env.JWT_ACCESS_KEY, { expiresIn: "1h", ...opts });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_KEY);
}

export function extractBearerToken(authorization = "") {
  const h = String(authorization || "");
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}
