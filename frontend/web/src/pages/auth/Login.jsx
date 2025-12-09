import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginThunk, loginWithGoogleThunk } from "../../redux/authThunks.js";
import { GoogleLogin } from "@react-oauth/google";
import "../../css/auth/Login.css";

// NEW
import streakApi from "../../api/shared/streakApi.js";
import StreakPopup from "../../components/shared/StreakPopup";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ Dùng chung cho username hoặc email
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const { status, error } = useSelector((s) => s.auth);
  const loading = status === "loading";

  // NEW: quản lý popup & đích điều hướng
  const [streakData, setStreakData] = useState(null);
  const [redirectTo, setRedirectTo] = useState("/");

  // 👉 đọc query ?expired=1
  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("expired") === "1";

  const nextRouteByRole = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "moderator") return "/moderator";
    if (role === "expert") return "/expert/home";
    return "/";
  };

  const afterLogin = async (role = "user") => {
    // xác định đích
    const dest = nextRouteByRole(role);
    setRedirectTo(dest);

    // Chỉ ghi streak cho user thường
    if (role === "user") {
      try {
        const { data } = await streakApi.record(); // { success, data: { streak } } tuỳ cấu trúc
        const streak = data?.data?.streak || data?.streak || null;
        if (streak) {
          setStreakData(streak); // mở popup, chờ user đóng rồi mới navigate
          return;
        }
      } catch (e) {
        console.warn("streak record failed:", e?.message || e);
      }
    }

    // Nếu không phải user hoặc không có streak → đi luôn
    navigate(dest);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    const cleanedLoginId = loginId.trim();

    const result = await dispatch(
      loginThunk({
        emailOrUsername: cleanedLoginId, // ✅ BE sẽ tự hiểu là username hoặc email
        password,
      })
    );

    const { success, role } = result || {};
    if (success) {
      await afterLogin(role || "user");
    }
  };

  const handleGoogleSuccess = async (cred) => {
    const idToken = cred?.credential;
    if (!idToken) return alert("Không lấy được Google credential");
    try {
      const res = await dispatch(loginWithGoogleThunk(idToken)).unwrap();
      const { user } = res || {};
      await afterLogin(user?.role || "user");
    } catch (e) {
      alert(e?.message || "Đăng nhập Google thất bại");
    }
  };

  const handleClosePopup = () => {
    setStreakData(null);
    navigate(redirectTo);
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box login">
          <h2>Đăng nhập</h2>
          <form onSubmit={handleLogin} noValidate>
            {/* Thông báo phiên hết hạn */}
            {sessionExpired && (
              <div className="error-message" style={{ marginBottom: "10px" }}>
                Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
              </div>
            )}

            {/* Lỗi login từ Redux */}
            {error && <div className="error-message">{error}</div>}

            <div className="input-box">
              <span className="icon">
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                value={loginId}
                placeholder=" "
                onChange={(e) => setLoginId(e.target.value)}
              />
              <label>Tên đăng nhập hoặc Email</label>
            </div>

            <div className="input-box" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
              />

              {/* Nút toggle icon */}
              <span
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                <ion-icon name={showPassword ? "eye-off" : "eye"}></ion-icon>
              </span>

              <label>Mật khẩu</label>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            {/* Forgot password */}
            <div className="login-register">
              <p>
                Quên mật khẩu?{" "}
                <Link to="/forgot-password" className="register-link">
                  Đặt lại
                </Link>
              </p>
            </div>

            {/* Register */}
            <div className="login-register">
              <p>
                Chưa có tài khoản?{" "}
                <Link to="/register" className="register-link">
                  Đăng ký
                </Link>
              </p>
            </div>
          </form>

          <div className="divider">
            <div className="line" />
            <span>hoặc</span>
            <div className="line" />
          </div>

          <div className="google-btn">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => alert("Google login error")}
            />
          </div>

          {/* Popup streak */}
          {streakData && (
            <StreakPopup streak={streakData} onClose={handleClosePopup} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
