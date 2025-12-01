// src/pages/auth/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../../redux/authThunks.js";
import "../../css/auth/Register.css";

const EyeIcon = ({ open }) =>
  open ? (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.58 10.58A3 3 0 0113.42 13.42"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [agree, setAgree] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const result = await dispatch(
        registerThunk({ username, email, password, agreedToTerms: agree })
      );

      if (result?.success) {
        const msg =
          result.message || "Đăng ký thành công! Kiểm tra email để xác thực.";
        setSuccessMessage(msg);
        setError(null);
        setTimeout(() => navigate("/login"), 1600);
      } else {
        setError(result?.message || "Đăng ký thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      setError(err?.message || "Có lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="register-card" role="main" aria-live="polite">
        <h2 className="reg-title">Đăng ký</h2>

        {successMessage && <div className="reg-success">{successMessage}</div>}
        {error && <div className="reg-error">{error}</div>}

        <form className="reg-form" onSubmit={handleRegister} noValidate>
          <label className="reg-label">Tên tài khoản</label>
          <div className="input-box">
            <input
              type="text"
              value={username}
              placeholder="Tên tài khoản"
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="reg-input"
            />
          </div>

          <label className="reg-label">Email</label>
          <div className="input-box">
            <input
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="reg-input"
            />
          </div>

          <label className="reg-label">Mật khẩu</label>
          <div className="input-box input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              placeholder="Mật khẩu"
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="reg-input"
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

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="reg-checkbox"
            />
            Tôi đồng ý với điều khoản
          </label>

          <button className="reg-btn" type="submit" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>

          <div className="reg-bottom">
            <span>Bạn đã có tài khoản? </span>
            <Link to="/login" className="reg-link">
              Đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
