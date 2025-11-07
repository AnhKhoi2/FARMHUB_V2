import { verifyAccessToken, isBypass } from "../utils/jwt.js";

export function socketAuth(io) {
  io.use((socket, next) => {
    try {
      if (isBypass()) {
        socket.user = { id: "bypass", role: "admin", email: "bypass@local" };
        return next();
      }
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization || "").replace("Bearer ", "");
      if (!token) return next(new Error("Missing token"));
      const payload = verifyAccessToken(token);
      socket.user = { id: payload.id, role: payload.role, email: payload.email };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });
}
