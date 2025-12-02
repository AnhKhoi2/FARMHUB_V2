import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { loginThunk, loginWithGoogleThunk } from "../../redux/authThunks.js";
import { GoogleLogin } from "@react-oauth/google";
import "../../css/auth/Login.css";

import streakApi from "../../api/shared/streakApi.js";
import StreakPopup from "../../components/shared/StreakPopup";

const EyeIcon = ({ open }) => (
  open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#234" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="#234" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="#234" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.58 10.58A3 3 0 0113.42 13.42" stroke="#234" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
);

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const { status, error } = useSelector((s) => s.auth);
  const loading = status === "loading";

  const [streakData, setStreakData] = useState(null);
  const [redirectTo, setRedirectTo] = useState("/");

  const params = new URLSearchParams(location.search);
  const sessionExpired = params.get("expired") === "1";

  const nextRouteByRole = (role) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "moderator") return "/moderator";
    if (role === "expert") return "/expert/home";
    return "/";
  };

  const afterLogin = async (role = "user") => {
    const dest = nextRouteByRole(role);
    setRedirectTo(dest);

    if (role === "user") {
      try {
        const { data } = await streakApi.record();
        const streak = data?.data?.streak || data?.streak || null;
        if (streak) {
          setStreakData(streak);
          return;
        }
      } catch (e) {
        console.warn("streak record failed:", e?.message || e);
      }
    }

    navigate(dest);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const cleanedUsername = username.trim();

    const result = await dispatch(
      loginThunk({
        username: cleanedUsername,
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
    <div className="login-page" aria-live="polite">
      <div className="login-card-simple">
        <h1 className="login-title">Đăng nhập</h1>

        <form onSubmit={handleLogin} noValidate className="login-form-simple">
          {sessionExpired && <div className="alert-simple error">Phiên đã hết hạn. Đăng nhập lại.</div>}
          {error && <div className="alert-simple error">{error}</div>}

          <label className="label-simple">Tên đăng nhập</label>
          <input
            className="input-simple"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tên đăng nhập"
            required
            autoComplete="username"
          />

          <label className="label-simple">Mật khẩu</label>
          <div className="input-with-icon">
  <input
    className="input-simple"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    placeholder="Mật khẩu"
    required
    autoComplete="current-password"
  />

  <button
    type="button"
    className="icon-btn"
    onClick={() => setShowPassword((p) => !p)}
    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
  >
    {showPassword ? (
      <ion-icon name="eye-off-outline"></ion-icon>
    ) : (
      <ion-icon name="eye-outline"></ion-icon>
    )}
  </button>
</div>


          <button type="submit" className="btn-primary-simple" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          <div className="links-row">
            <Link to="/forgot-password" className="link-simple">Quên mật khẩu?</Link>
            <Link to="/register" className="link-simple">Đăng ký</Link>
          </div>

          <div className="divider-simple"><span>hoặc</span></div>

          <div className="google-wrap">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google login error")} />
          </div>
        </form>
      </div>

      {streakData && <StreakPopup streak={streakData} onClose={handleClosePopup} />}
    </div>
  );
};

export default Login;
