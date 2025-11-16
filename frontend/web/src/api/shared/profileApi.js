import axiosClient from "./axiosClient";

function sanitizePayload(obj) {
  if (!obj || typeof obj !== "object") return obj;
  // shallow clone
  const copy = { ...obj };
  // remove server-managed fields that validation rejects
  ["_id", "userId", "createdAt", "updatedAt", "__v"].forEach((k) => {
    if (k in copy) delete copy[k];
  });
  return copy;
}

export const profileApi = {
  getProfile() {
    return axiosClient.get("/profile");
  },
  updateProfile(data) {
    const payload = sanitizePayload(data);
    return axiosClient.put("/profile", payload);
  },
};
