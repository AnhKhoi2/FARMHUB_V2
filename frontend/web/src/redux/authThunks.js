// src/redux/authThunks.js
import { loginStart, loginSuccess, loginFailure, logout } from "./authSlice";
import authApi from "../api/shared/authApi.js";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginThunk = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const res = await authApi.loginApi(credentials);

    // BE có thể trả nhiều dạng: { data: { user, accessToken } } hoặc { user, accessToken }
    // Hãy parse một cách an toàn và log role để debug nếu cần.
    const data = res?.data;
    let user = null;
    let accessToken = null;
    if (data) {
      if (data.data) {
        user = data.data.user ?? data.data;
        accessToken = data.data.accessToken ?? data.data.token ?? null;
      } else {
        user = data.user ?? data;
        accessToken = data.accessToken ?? data.token ?? null;
      }
    }

    // Sanity: if payload nested unexpectedly (e.g., user.user)
    if (user && user.user) user = user.user;

    // Debug log (dev only)
    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("[auth] login response user role:", user?.role, "user:", user);
      }
    } catch (e) {}

    if (!user || !accessToken) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ server");
    }

    dispatch(loginSuccess({ user, accessToken }));

    // Persist an toàn
    localStorage.setItem("user", JSON.stringify(user));
    if (accessToken) localStorage.setItem("accessToken", accessToken);

    return { success: true, role: user?.role };
  } catch (err) {
    console.error("Login error:", err?.response?.data || err);

    const data = err?.response?.data;

    // ƯU TIÊN lấy message từ BE
    const backendMessage =
      data?.message ||              // { message: "..." }
      data?.error?.message ||       // { error: { message: "..." } }
      data?.errorMessage ||         // một số API dùng key này
      data?.errors?.[0]?.msg ||     // trường hợp validation kiểu array
      err.message;

    const backendCode =
      data?.code ||                 // { code: "INVALID_CREDENTIALS" }
      data?.error?.code;

    // text hiển thị cho user
    let uiMessage =
      backendMessage ||
      "Đăng nhập thất bại. Vui lòng thử lại.";

    // Nếu muốn, có thể show code để debug
    // ví dụ: [INVALID_CREDENTIALS] Tên đăng nhập hoặc mật khẩu không đúng.
    if (backendCode) {
      uiMessage = ` ${uiMessage}`;
    }

    dispatch(loginFailure(uiMessage));
    return { success: false };
  }
};

// các thunk khác giữ nguyên...
export const logoutThunk = () => async (dispatch) => {
  try {
    // Attempt server-side logout to clear refresh cookie
    await authApi.logout();
  } catch (err) {
    // ignore network errors but continue to clear client state
    console.warn("logout API failed:", err?.response?.data || err?.message || err);
  }

  dispatch(logout());
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
};

// src/redux/authThunks.js

export const registerThunk = (formData) => async () => {
  try {
    const res = await authApi.registerApi(formData);

    // Ưu tiên lấy message từ BE
    const data = res?.data;
    const message =
      data?.message || 
      data?.msg ||
      "Đăng ký thành công! Vui lòng kiểm tra email xác nhận.";

    return { success: true, message };
  } catch (err) {
    console.error("Register error:", err?.response?.data || err);

    const data = err?.response?.data;

    // CHỈ LẤY MESSAGE, KHÔNG DÙNG CODE
    const uiMessage =
      data?.message ||
      data?.error?.message ||
      data?.errorMessage ||
      data?.errors?.[0]?.msg ||
      "Đăng ký thất bại. Vui lòng thử lại.";

    return { success: false, message: uiMessage };
  }
};


export const loginWithGoogleThunk = createAsyncThunk(
  "auth/loginWithGoogle",
  async (idToken, { rejectWithValue }) => {
    try {
      const res = await authApi.loginWithGoogle(idToken);
      const { data } = res || {};
      const { data: inner } = data || {};
      if (!inner?.user || !inner?.accessToken) {
        throw new Error("Phản hồi Google login không hợp lệ");
      }
      return { user: inner.user, accessToken: inner.accessToken };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: "Google login failed" });
    }
  }
);
