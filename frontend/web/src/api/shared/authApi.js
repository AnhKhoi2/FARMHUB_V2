// authApi.js
import axiosClient from "./axiosClient";

const authApi = {
  loginApi(credentials) {
    // ✅ chỉ gửi đúng 2 trường backend yêu cầu
    return  axiosClient.post("/auth/login", credentials);
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
