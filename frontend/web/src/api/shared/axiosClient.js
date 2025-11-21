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
  baseURL: "http://localhost:5000",
  // Do not force a default Content-Type here so browser/axios can set
  // the correct header (including multipart boundary) when sending FormDat
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

  if (token && !isPublicAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // If sending FormData, remove default JSON content-type so browser/axios can set multipart boundary
  try {
    if (config.data instanceof FormData) {
      // axios may expose headers with different casing depending on environment;
      // remove both common variants so the browser/axios can set multipart boundary.
      if (config.headers) {
        if (config.headers['Content-Type']) delete config.headers['Content-Type'];
        if (config.headers['content-type']) delete config.headers['content-type'];
        // also remove any common nested keys used by axios
        if (config.headers.common && config.headers.common['Content-Type']) delete config.headers.common['Content-Type'];
        if (config.headers.common && config.headers.common['content-type']) delete config.headers.common['content-type'];
      }
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
