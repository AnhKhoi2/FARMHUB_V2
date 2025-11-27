// authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  // Đăng nhập CHỈ dùng username (FE có thể truyền username hoặc emailOrUsername, nhưng BE luôn nhận username)
  loginApi(payload) {
    // Ưu tiên username, fallback từ emailOrUsername / email cho tương thích cũ
    const username =
      payload?.username ||
      payload?.emailOrUsername ||
      payload?.email ||
      "";
    const password = payload?.password || "";

    return axiosClient.post("/auth/login", { username, password });
  },

  registerApi(data) {
    return axiosClient.post("/auth/register", data);
  },

  requestPasswordReset(email) {
    return axiosClient.post("/auth/password/forgot", { email });
  },

  resetPassword(token, newPassword) {
    return axiosClient.post(`/auth/password/reset/${token}`, {
      newPassword,
    });
  },

  changePassword(oldPassword, newPassword) {
    return axiosClient.put("/auth/password/change", {
      oldPassword,
      newPassword,
    });
  },

  loginWithGoogle(idToken) {
    return axiosClient.post("/auth/google", { idToken });
  },

  logout() {
    return axiosClient.post("/auth/logout");
  },
};

export default authApi;
