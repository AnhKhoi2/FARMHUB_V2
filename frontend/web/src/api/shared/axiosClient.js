// axiosClient.js
import axios from "axios";

// In development (frontend dev server) the backend runs on :5000.
// In production the frontend and backend are usually served from same origin.
const isDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" && window.location.hostname === "localhost");
const defaultBase = isDev
  ? "http://localhost:5000"
  : (typeof window !== "undefined" &&
      window.location &&
      window.location.origin) ||
    "http://localhost:5000";

const axiosClient = axios.create({
  baseURL: defaultBase,
  headers: { "Content-Type": "application/json" },
  // Nếu backend dùng cookie session, bật thêm: withCredentials: true,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  // Support both current key and legacy 'token' key
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");

  // Chỉ coi là "public auth" cho 4 endpoint dưới (KHÔNG gồm /auth/password/change)
  const publicAuthPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/password/forgot",
    "/auth/password/reset",
    "/auth/google",
  ];
  const isPublicAuth = publicAuthPaths.some((p) =>
    (config.url || "").startsWith(p)
  );

  if (token && !isPublicAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
