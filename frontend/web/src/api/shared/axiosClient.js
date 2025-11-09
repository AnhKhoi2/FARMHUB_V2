// axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  // Nếu backend dùng cookie session, bật thêm: withCredentials: true,
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  // Support both current key and legacy 'token' key
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");

  // Chỉ coi là "public auth" cho 4 endpoint dưới (KHÔNG gồm /auth/password/change)
  const publicAuthPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/password/forgot",
    "/auth/password/reset",
     "/auth/google"
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
