// src/redux/authThunks.js
import { loginStart, loginSuccess, loginFailure, logout } from "./authSlice";
import authApi from "../api/shared/authApi.js";
import { createAsyncThunk } from "@reduxjs/toolkit";

// =========================
// LOGIN – chỉ dùng username
// =========================
export const loginThunk = (credentials) => async (dispatch) => {
  try {
    dispatch(loginStart());

    const res = await authApi.loginApi(credentials);

    // BE: ok(res, { user: userSafe, accessToken, refreshToken })
    const base = res?.data;
    const data = base?.data || base || {};

    const user = data.user;
    const accessToken = data.accessToken;

    if (!user || !accessToken) {
      throw new Error("Phản hồi đăng nhập không hợp lệ từ server");
    }

    // Cập nhật Redux
    dispatch(loginSuccess({ user, accessToken }));

    // Lưu LocalStorage
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("accessToken", accessToken);

    return { success: true, role: user.role };
  } catch (err) {
    console.error("Login error:", err?.response?.data || err);

    const data = err?.response?.data;
    const backendMessage =
      data?.message ||
      data?.error?.message ||
      data?.errorMessage ||
      data?.errors?.[0]?.msg ||
      err.message ||
      "Đăng nhập thất bại. Vui lòng thử lại.";

    dispatch(loginFailure(backendMessage));
    return { success: false };
  }
};

// =========================
// LOGOUT
// =========================
export const logoutThunk = () => async (dispatch) => {
  try {
    await authApi.logout();
  } catch (err) {
    console.warn(
      "logout API failed:",
      err?.response?.data || err?.message || err
    );
  }

  dispatch(logout());
  localStorage.removeItem("user");
  localStorage.removeItem("accessToken");
  try {
    sessionStorage.removeItem("modelSuggestionShownAtLogin");
  } catch (e) {}
};
// =========================
// REGISTER – bản nâng cấp HOÀN CHỈNH
// =========================
export const registerThunk = (formData) => async () => {
  try {
    const res = await authApi.registerApi(formData);

    const data = res?.data || {};
    const message =
      data.message ||
      data.msg ||
      "Đăng ký thành công! Vui lòng kiểm tra email xác nhận.";

    return {
      success: true,
      message,
      data,
      code: data.code || null,
      status: res.status,
    };
  } catch (err) {
    console.error("Register error:", err?.response?.data || err);

    const data = err?.response?.data || {};

    const message =
      data.message ||
      data.error?.message ||
      data.errorMessage ||
      data.errors?.[0]?.msg ||
      "Đăng ký thất bại. Vui lòng thử lại.";

    return {
      success: false,
      message,
      code: data.code || null,          // ⬅ lấy đúng error code từ BE
      status: err?.response?.status || null, // ⬅ lấy status (429, 400, 409…)
    };
  }
};


// =========================
/* GOOGLE LOGIN */
// =========================
export const loginWithGoogleThunk = createAsyncThunk(
  "auth/loginWithGoogle",
  async (idToken, { rejectWithValue }) => {
    try {
      const res = await authApi.loginWithGoogle(idToken);

      const base = res?.data;
      const inner = base?.data || base || {};

      const user = inner?.user;
      const accessToken = inner?.accessToken;

      if (!user || !accessToken) {
        throw new Error("Phản hồi Google login không hợp lệ");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);

      return { user, accessToken };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data || { message: "Google login failed" }
      );
    }
  }
);
