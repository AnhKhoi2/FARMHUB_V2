import axiosClient from "../shared/axiosClient";

const base = "/api/expert-applications";

export const expertApplicationApi = {
  create: async (data) => {
    const res = await axiosClient.post(base, data);
    return res.data;
  },
  getMine: async () => {
    const res = await axiosClient.get(`${base}/mine`);
    return res.data?.data;
  },
  list: async (params = {}) => {
    const res = await axiosClient.get(base, { params });
    return res.data?.data;
  },
  getById: async (id) => {
    const res = await axiosClient.get(`${base}/${id}`);
    return res.data?.data;
  },
};

export default expertApplicationApi;
