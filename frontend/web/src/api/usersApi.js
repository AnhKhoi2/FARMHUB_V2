import axiosClient from "./shared/axiosClient";

const base = "/admin/users";

export const usersApi = {
  list: async (params = {}) => {
    const res = await axiosClient.get(base, { params });
    return res.data?.data;
  },
  detail: async (id) => {
    const res = await axiosClient.get(`${base}/${id}`);
    return res.data?.data;
  },
  updateRole: async (id, role) => {
    const res = await axiosClient.patch(`${base}/${id}/role`, { role });
    return res.data?.data;
  },
  softDelete: async (id) => {
    const res = await axiosClient.delete(`${base}/${id}`);
    return res.data?.data;
  },
  restore: async (id) => {
    const res = await axiosClient.patch(`${base}/${id}/restore`);
    return res.data?.data;
  },
};

export default usersApi;