import { createSlice } from "@reduxjs/toolkit";

// ✅ Hàm parse JSON an toàn
const loadUserFromStorage = () => {
  try {
    const data = localStorage.getItem("user");
    // Nếu chưa có hoặc từng bị ghi là "undefined"/"null" thì trả về null
    if (!data || data === "undefined" || data === "null") return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

// ✅ Trạng thái ban đầu (initial state)
const initialState = {
  user: loadUserFromStorage(),
  token: localStorage.getItem("token") || null,
};

// ✅ Slice quản lý user
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // 🟢 Khi đăng nhập thành công
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem("user", JSON.stringify(state.user));
      localStorage.setItem("token", state.token);
    },

    // 🔴 Khi đăng xuất
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
  },
});

// ✅ Xuất reducer & actions
export default userSlice.reducer;
export const { loginSuccess, logout } = userSlice.actions;
