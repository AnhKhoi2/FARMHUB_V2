import axiosClient from "./axiosClient";

const expertApplicationApi = {
  getMine() {
    return axiosClient.get("/api/expert-applications/me");
  },
  create(payload) {
    return axiosClient.post("/api/expert-applications", payload);
  },
};

export default expertApplicationApi;
