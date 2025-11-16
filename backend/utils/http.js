import axios from "axios";

export const http = axios.create({
  timeout: 15000
});

// nhỏ gọn lỗi
export function unwrapAxiosError(err) {
  if (err.response) {
    return { status: err.response.status, data: err.response.data };
  }
  return { status: 500, data: { error: err.message } };
}
