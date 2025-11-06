// ✅ Updated Login.jsx
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import authApi from "../api/authApi";
import { loginSuccess } from "../redux/authSlice.js";
import "../css/Login.css";
import StreakPopup from "../components/StreakPopup";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streakInfo, setStreakInfo] = useState(null);
  const [showStreak, setShowStreak] = useState(false);
  const [redirectRole, setRedirectRole] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.loginApi({ username, password });
      // Backend responses use the ApiResponse wrapper: { success: true, data: { user, accessToken } }
      const { user, accessToken } = res.data?.data || {};
      if (!accessToken) throw new Error("Không nhận được access token từ server");

      // Update redux + localStorage with correct shapes
      dispatch(loginSuccess({ user, token: accessToken }));
      localStorage.setItem("token", accessToken);

      // Check streak info returned from backend
      const streak = res.data?.data?.streak ?? null;
      if (streak) {
        // show popup first, then navigate after user closes
        setStreakInfo(streak);
        setShowStreak(true);
        setRedirectRole(user?.role || "user");
      } else {
        // no streak info: continue to redirect
        const role = user?.role || "user";
        if (role === "admin") navigate("/admin/dashboard"); else navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Sai tài khoản hoặc mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <span className="icon-close">
          <ion-icon name="close"></ion-icon>
        </span>

        <div className="form-box login">
          <h2>Đăng nhập</h2>
          <form onSubmit={handleLogin}>
            {error && <div className="error-message">{error}</div>}
            <div className="input-box">
              <span className="icon">
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=""
              />
              <label>Tên đăng nhập</label>
            </div>

            <div className="input-box">
              <span className="icon">
                <ion-icon name="lock-closed"></ion-icon>
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
              />
              <label>Mật khẩu</label>
            </div>

            

            <div className="remember-forgot">
              <label>
                <input type="checkbox" />
                Ghi nhớ đăng nhập
              </label>
              <a href="/forgot-password">Quên mật khẩu?</a>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <div className="login-register">
              <p>
                Chưa có tài khoản? <Link to="/register" className="register-link">Đăng ký</Link>
              </p>
            </div>
          </form>
        </div>
      {showStreak && (
        <StreakPopup
          streak={streakInfo}
          onClose={() => {
            setShowStreak(false);
            // after closing, navigate
            const role = redirectRole || "user";
            if (role === "admin") navigate("/admin/dashboard"); else navigate("/");
          }}
        />
      )}
      </div>
    </div>
  );
};

export default Login;
