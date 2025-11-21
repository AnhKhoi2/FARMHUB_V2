// streakApi.js
import axiosClient from "./axiosClient";

function getTop(limit = 10, sortBy = "total_points") {
  const params = { limit, sortBy };
  return axiosClient.get("/admin/streaks/top", { params });
}

function list(opts = {}) {
  // opts: { page, limit, q }
  return axiosClient.get("/admin/streaks", { params: opts });
}

function getById(id) {
  return axiosClient.get(`/admin/streaks/${id}`);
}

function record() {
  // backend mounts streak routes under /admin/streaks (route requires auth token)
  return axiosClient.post("/admin/streaks/record");
}

export default {
  getTop,
  list,
  getById,
  record,
};
