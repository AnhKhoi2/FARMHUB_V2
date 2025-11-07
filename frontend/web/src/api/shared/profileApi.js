import axiosClient from "./axiosClient";

export const profileApi = {
  getProfile() {
    return axiosClient.get("/profile");
  },
  updateProfile(data) {
    return axiosClient.put("/profile", data);
  },
};
