import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginThunk, loginWithGoogleThunk } from "../../redux/authThunks.js";
import { GoogleLogin } from "@react-oauth/google";
import "../../css/auth/Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { status, error } = useSelector((s) => s.auth);
  const loading = status === "loading";

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginThunk({ username, password }));
    const { success, role } = result || {};
    if (success) {
      if (role === "admin") navigate("/admin");
      else if (role === "expert") navigate("/expert/home");
      else navigate("/");
    }
  };

  const handleGoogleSuccess = async (cred) => {
    const idToken = cred?.credential;
    if (!idToken) return alert("Không lấy được Google credential");
    try {
      const res = await dispatch(loginWithGoogleThunk(idToken)).unwrap();
      const { user } = res;
      if (user?.role === "admin") navigate("/admin");
      else if (user?.role === "expert") navigate("/expert/home");
      else navigate("/");
    } catch (e) {
      alert(e?.message || "Đăng nhập Google thất bại");
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
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

          <div className="divider">
            <div className="line" />
            <span>or</span>
            <div className="line" />
          </div>

          <div className="google-btn">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => alert("Google login error")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
