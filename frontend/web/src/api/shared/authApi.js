import axiosClient from "./axiosClient";

function loginApi(payload) {
  // payload: { username, password }
  return axiosClient.post("/auth/login", payload);
}

function registerApi(payload) {
  // payload: { username, email, password }
  return axiosClient.post("/auth/register", payload);
}

function refreshToken() {
  return axiosClient.post("/auth/refresh");
}

function logoutApi() {
  return axiosClient.post("/auth/logout");
}

function me() {
  return axiosClient.get("/auth/me");
}

const authApi = {
  loginApi,
  registerApi,
  refreshToken,
  logoutApi,
  me,
};

export default authApi;