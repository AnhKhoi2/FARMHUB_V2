import axiosClient from "./axiosClient";


const authApi = {
loginApi(data) {
return axiosClient.post("/auth/login", data);
},
registerApi(data) {
return axiosClient.post("/auth/register", data);
},
};


export default authApi;