// src/redux/authThunks.js
import { loginStart, loginSuccess, loginFailure, logout } from "./authSlice";
import authApi from "../api/shared/authApi.js";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const loginThunk = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const res = await authApi.loginApi(credentials);
    const payload = res?.data?.data || {};
    const { user, accessToken } = payload;

    if (!user || !accessToken) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ server");
    }

    dispatch(loginSuccess({ user, accessToken }));

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);
    // ❌ Không điều hướng ở đây nữa
    return { success: true, role: user.role };
  } catch (err) {
    const message = err?.response?.data?.message || err.message || "Login failed";
    dispatch(loginFailure(message));
    return { success: false };
  }
};

export const logoutThunk = () => (dispatch) => {
  dispatch(logout());
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
};

export const registerThunk = (formData) => async () => {
  try {
    const res = await authApi.registerApi(formData);
    const message =
      res?.data?.message || "Đăng ký thành công! Vui lòng kiểm tra email xác nhận.";
    alert(message);
    return true;
  } catch (err) {
    const message = err?.response?.data?.message || "Đăng ký thất bại!";
    alert(message);
    return false;
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
