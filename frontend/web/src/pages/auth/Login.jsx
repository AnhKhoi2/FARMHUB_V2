import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginThunk, loginWithGoogleThunk } from "../../redux/authThunks.js";
import { GoogleLogin } from "@react-oauth/google"; // 👈 nút Google
import "../../css/auth/Login.css";
const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // lấy status/error từ store để hiển thị
  const { status, error } = useSelector((s) => s.auth);
  const loading = status === "loading";

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await dispatch(loginThunk({ username, password }));
    if (ok) navigate("/"); // ✅ chuyển trang ngay khi thunk báo OK
  };

  const handleGoogleSuccess = async (cred) => {
    const idToken = cred?.credential;
    if (!idToken) return alert("Không lấy được Google credential");
    try {
      const res = await authApi.loginApi({ username, password });
      // Backend responses use the ApiResponse wrapper: { success: true, data: { user, accessToken } }
      const { user, accessToken } = res.data?.data || {};
      if (!accessToken)
        throw new Error("Không nhận được access token từ server");

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
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "expert") {
          navigate("/expert/home");
        } else {
          navigate("/");
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Sai tài khoản hoặc mật khẩu!");
    } finally {
      setLoading(false);
      const res = await dispatch(loginWithGoogleThunk(idToken)).unwrap();
      console.log("Google login success:", res.user);
      navigate("/");
    } catch (e) {
      alert(e?.message || "Đăng nhập Google thất bại");
    }
  };

  const handleGoogleError = () => {
    alert("Google login error");
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <span className="icon-close">
          <ion-icon name="close"></ion-icon>
        </span>

        <div className="form-box login">
          <h2>Login</h2>
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
              />
              <label>Username</label>
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
              />
              <label>Password</label>
            </div>

            <div className="remember-forgot">
              <label>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="/forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="login-register">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="register-link">
                  Register
                </Link>
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
              if (role === "admin") {
                navigate("/admin/dashboard");
              } else if (role === "expert") {
                navigate("/expert/home");
              } else {
                navigate("/");
              }

          {/* --- Divider nhỏ --- */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <div style={{ height: 1, background: "#e5e7eb", flex: 1 }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>or</span>
            <div style={{ height: 1, background: "#e5e7eb", flex: 1 }} />
          </div>

          {/* --- Nút Google --- */}
          <div
            style={{ marginTop: 16, display: "flex", justifyContent: "center" }}
          >
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
