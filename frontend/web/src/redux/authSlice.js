import { createSlice } from "@reduxjs/toolkit";
import { loginWithGoogleThunk } from "./authThunks";

// ---------------------------
// Safe parse & cleanup helpers
// ---------------------------
function safeJSONParse(raw) {
  if (!raw) return null; // null/empty
  const v = String(raw).trim();
  if (v === "undefined" || v === "null" || v === "") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function readToken() {
  const raw = localStorage.getItem("accessToken");
  if (!raw) return null;
  const v = String(raw).trim();
  return v && v !== "undefined" && v !== "null" ? v : null;
}

// Dọn rác 1 lần nếu trước đó lỡ lưu "undefined"
if (localStorage.getItem("user") === "undefined") {
  localStorage.removeItem("user");
}
if (localStorage.getItem("accessToken") === "undefined") {
  localStorage.removeItem("accessToken");
}

// ---------------------------
// Initial state (rehydrate)
// ---------------------------
const initialState = {
  user: safeJSONParse(localStorage.getItem("user")),
  accessToken: readToken(),
  status: "idle", // "idle" | "loading" | "succeeded" | "failed"
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Login (user/pass) flow if bạn dùng thunk tự viết: loginStart/loginSuccess/loginFailure
    loginStart(state) {
      state.status = "loading";
      state.error = null;
    },
    loginSuccess(state, action) {
      const { user, accessToken } = action.payload || {};
      state.status = "succeeded";
      state.user = user || null;
      state.accessToken = accessToken || null;
      state.error = null;

      // Persist an toàn
      if (user) localStorage.setItem("user", JSON.stringify(user));
      if (accessToken) localStorage.setItem("accessToken", accessToken);
    },
    loginFailure(state, action) {
      state.status = "failed";
      state.error = action.payload || "Login failed";
    },

    // Logout: xóa sạch storage + state
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "idle";
      state.error = null;

      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
    },
  },

  // ---------------------------
  // Extra reducers: Google Login
  // ---------------------------
  extraReducers: (builder) => {
    builder
      .addCase(loginWithGoogleThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginWithGoogleThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload?.user || null;
        state.accessToken = action.payload?.accessToken || null;

        // Persist an toàn
        if (action.payload?.user) {
          localStorage.setItem("user", JSON.stringify(action.payload.user));
        }
        if (action.payload?.accessToken) {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
      })
      .addCase(loginWithGoogleThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Google login failed";
      });
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
