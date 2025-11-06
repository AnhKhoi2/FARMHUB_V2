import axiosClient from "../shared/axiosClient";

// diagnose: { description, symptoms, extra }
function diagnose(payload) {
  return axiosClient.post("/ai/diagnose", payload);
}

const aiApi = { diagnose };

export default aiApi;
