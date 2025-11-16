// axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ===== REQUEST INTERCEPTOR =====
axiosClient.interceptors.request.use((config) => {
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

  return config;
});

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
