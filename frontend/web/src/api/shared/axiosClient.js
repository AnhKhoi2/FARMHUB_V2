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
  withCredentials: true,
});

// ===== REQUEST INTERCEPTOR =====
axiosClient.interceptors.request.use(
  (config) => {
    // Support both current key and legacy 'token' key
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

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

    // ===== Handle FormData =====
    try {
      if (config.data instanceof FormData) {
        if (config.headers && config.headers["Content-Type"]) {
          delete config.headers["Content-Type"];
        }
      }
    } catch (err) {
      // ignore
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== RESPONSE INTERCEPTOR =====
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu token hết hạn / invalid → BE trả 401
    if (error.response && error.response.status === 401) {
      console.warn("Token hết hạn → chuyển về trang login");

      // Xoá token khỏi localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");

      // Điều hướng về login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
