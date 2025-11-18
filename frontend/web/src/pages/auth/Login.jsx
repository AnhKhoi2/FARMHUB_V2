


import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginThunk, loginWithGoogleThunk } from "../../redux/authThunks.js";
import { GoogleLogin } from "@react-oauth/google";
import "../../css/auth/Login.css";

// NEW
import streakApi from "../../api/shared/streakApi.js";     // ← thêm
import StreakPopup from "../../components/shared/StreakPopup"; // ← path theo dự án của bạn


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const { status, error } = useSelector((s) => s.auth);
  const loading = status === "loading";

  // NEW: quản lý popup & đích điều hướng
  const [streakData, setStreakData] = useState(null);
  const [redirectTo, setRedirectTo] = useState("/");

  const nextRouteByRole = (role) => {
    if (role === "admin") return "/admin";
    if (role === "moderator") return "/moderator";
    if (role === "expert") return "/expert/home";
    return "/";
  };

  const afterLogin = async (role) => {
    // xác định đích
    const dest = nextRouteByRole(role);
    setRedirectTo(dest);

    // Only record streak for farmers (do not record for experts, admins, moderators)
    if (role === "user") {
      try {
        const { data } = await streakApi.record(); // { success, data: { streak } }
        const streak = data?.data?.streak || data?.streak || null;
        if (streak) {
          setStreakData(streak); // open popup and wait for user
          return; // wait for popup close before navigating
        }
      } catch (e) {
        // errors recording streak shouldn't block navigation
        console.warn("streak record failed:", e?.message || e);
      }
    }

    // For non-farmers or if no streak, navigate immediately
    navigate(dest);
  };

  const handleLogin = async (e) => {
  e.preventDefault();

  const cleanedIdentifier = emailOrUsername.trim();

  const result = await dispatch(
    loginThunk({
      emailOrUsername: cleanedIdentifier, // send as `emailOrUsername` to match API
      password,
    })
  );
  let { success, role } = result || {};
  // If backend response shape didn't include role for some reason,
  // fall back to persisted user in localStorage or redux state.
  if (!role) {
    try {
      const persisted = JSON.parse(localStorage.getItem("user") || "null");
      if (persisted?.role) role = persisted.role;
    } catch (e) {
      // ignore parse errors
    }
  }

  if (success) {
    await afterLogin(role);
  }
};


  const handleGoogleSuccess = async (cred) => {
    const idToken = cred?.credential;
    if (!idToken) return alert("Không lấy được Google credential");
    try {
      const res = await dispatch(loginWithGoogleThunk(idToken)).unwrap();
      const { user } = res || {};
      await afterLogin(user?.role);
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
      {/* ...giữ nguyên UI form cũ... */}
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
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
              <label>Email or Username</label>
            </div>

            <div className="input-box">
  {/* <span className="icon">
    <ion-icon name="lock-closed"></ion-icon>
  </span> */}

  <input
    type={showPassword ? "text" : "password"}     // 👈 đổi type
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
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

      {/* NEW: Popup */}
      {streakData && <StreakPopup streak={streakData} onClose={handleClosePopup} />}
      </div>
      </div>
    </div>
  );
};

export default Login;
