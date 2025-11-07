import { loginStart, loginSuccess, loginFailure, logout } from "./authSlice";
import authApi from "../api/shared/authApi.js";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const loginThunk = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());
    const res = await authApi.loginApi(credentials);
    // kỳ vọng API trả { data: { data: { user, accessToken } } }
    const payload = res?.data?.data || {};
    const { user, accessToken } = payload;

    if (!user || !accessToken) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ server");
    }

    // cập nhật store thuần
    dispatch(loginSuccess({ user, accessToken }));

    // persist ra localStorage (side-effect)
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);
    return true;
  } catch (err) {
    const message = err?.response?.data?.message || err.message || "Login failed";
    dispatch(loginFailure(message));
    return false;
  }
};

export const logoutThunk = () => (dispatch) => {
  dispatch(logout());                     // đặt user=null, accessToken=null, status="idle"
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
};



// REGISTER THUNK
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
     // backend trả { success, data: { user, accessToken } }
      const { data } = res || {};
      const { data: inner } = data || {};
      if (!inner?.user || !inner?.accessToken) {
        throw new Error("Phản hồi Google login không hợp lệ");
      }
      // normalize: trả { user, accessToken } cho slice
      return { user: inner.user, accessToken: inner.accessToken };
    } catch (err) {
      return rejectWithValue(err?.response?.data || { message: "Google login failed" });
    }
  }
);
