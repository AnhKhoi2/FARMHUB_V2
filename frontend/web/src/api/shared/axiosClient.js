// src/api/shared/axiosClient.js
import axios from "axios";

// In development (frontend dev server) the backend runs on :5000.
// In production the frontend and backend are usually served from same origin.
const isDev =
  process.env.NODE_ENV === "development" ||
  (typeof window !== "undefined" &&
    window.location.hostname === "localhost");

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
axiosClient.interceptors.request.use((config) => {
  let token = null;

  if (typeof window !== "undefined") {
    token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
  }

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

  // Gắn Bearer token cho các route cần auth
  if (token && !isPublicAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Nếu gửi FormData thì xoá Content-Type để axios tự set boundary
  try {
    if (config.data instanceof FormData) {
      if (config.headers && config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
      if (config.headers && config.headers["content-type"]) {
        delete config.headers["content-type"];
      }
    }
  } catch (err) {
    console.error("Error handling FormData:", err);
  }

  return config;
});

// ===== RESPONSE INTERCEPTOR =====
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data || {};
    const code = data?.code || data?.error?.code;
    const url = error.config?.url || "";

    // Các API auth public: login/register/forgot/reset/google
    const isAuthPath =
      url.startsWith("/auth/login") ||
      url.startsWith("/auth/register") ||
      url.startsWith("/auth/password/forgot") ||
      url.startsWith("/auth/password/reset") ||
      url.startsWith("/auth/google");

    if (status === 401) {
      // 1) Nếu là login / register / forgot / reset → KHÔNG redirect,
      // để form tự hiển thị "Tên đăng nhập hoặc mật khẩu không đúng", v.v.
      if (isAuthPath) {
        return Promise.reject(error);
      }

      // 2) Nếu BE nói rõ là TOKEN_EXPIRED → xoá token + đẩy về /login
      if (code === "TOKEN_EXPIRED" || code === "REFRESH_TOKEN_EXPIRED") {
        console.warn("Token hết hạn → chuyển về trang login");

        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("token");
          window.location.href = "/login?expired=1";
        }

        // Không cần reject nữa vì đã điều hướng
        return;
      }

      // 3) Các lỗi 401 khác (sai token, token không hợp lệ, thiếu token...)
      // → CHỈ trả lỗi, không tự redirect
      console.warn("401 với code khác:", code, "- chỉ hiển thị lỗi, không redirect");
      return Promise.reject(error);
    }

    // Các lỗi khác giữ nguyên
    return Promise.reject(error);
  }
);

export default axiosClient;
