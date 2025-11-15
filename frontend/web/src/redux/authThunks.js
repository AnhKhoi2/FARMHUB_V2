// src/redux/authThunks.js
import { loginStart, loginSuccess, loginFailure, logout } from "./authSlice";
import authApi from "../api/shared/authApi.js";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginThunk = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const res = await authApi.loginApi(credentials);

    // BE có thể trả { success, data: { user, accessToken } }
    // hoặc { user, accessToken } trực tiếp
    const payload = res?.data?.data || res?.data || {};
    const { user, accessToken } = payload;

    if (!user || !accessToken) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ server");
    }

    dispatch(loginSuccess({ user, accessToken }));

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);

    return { success: true, role: user.role };
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
export const logoutThunk = () => (dispatch) => {
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
