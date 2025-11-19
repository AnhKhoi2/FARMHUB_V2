// axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000",
  // Do not force a default Content-Type here so browser/axios can set
  // the correct header (including multipart boundary) when sending FormData.
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
  } catch (e) {
    // ignore
  }
  return config;
});


export default axiosClient;
