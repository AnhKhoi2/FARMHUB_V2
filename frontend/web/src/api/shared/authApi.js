// authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  loginApi(payload) {
    // Accept either { emailOrUsername, password } or { username, password }
    const emailOrUsername = payload?.emailOrUsername || payload?.username || payload?.email || "";
    const password = payload?.password;
    return axiosClient.post("/auth/login", { emailOrUsername, password });
  },

  registerApi(data) {
    return axiosClient.post("/auth/register", data);
  },

  requestPasswordReset(email) {
    return axiosClient.post("/auth/password/forgot", { email });
  },

  resetPassword(token, newPassword) {
    return axiosClient.post(`/auth/password/reset/${token}`, { newPassword });
  },
  changePassword(oldPassword, newPassword) {
  return axiosClient.put("/auth/password/change", { oldPassword, newPassword });
},
loginWithGoogle(idToken) {
  return axiosClient.post("/auth/google", { idToken });
},
  logout() {
    return axiosClient.post('/auth/logout');
  },
};

export default authApi;
