import axiosClient from "./axiosClient";

const aiApi = {
  diagnose: (payload) => axiosClient.post('/ai/diagnose', payload),
};

export default aiApi;
