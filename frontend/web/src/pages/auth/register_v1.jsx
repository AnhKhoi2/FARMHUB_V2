// src/pages/auth/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../../redux/authThunks.js";

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");

    const result = await dispatch(
      registerThunk({ username, email, password })
    );

    setLoading(false);

    if (result?.success) {
      // Lấy message từ BE: "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản."
      const msg =
        result.message ||
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.";

      setSuccessMessage(msg);
      setError(null);

      // Tự động chuyển sang trang login sau 2 giây
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else if (result?.message) {
      setError(result.message); // in đúng message lỗi từ BE
    } else {
      setError("Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <span className="icon-close">
          <ion-icon name="close"></ion-icon>
        </span>

        <div className="form-box register">
          <h2>Registration</h2>

          {/* Thông báo thành công */}
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {/* Thông báo lỗi */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister}>
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
                <ion-icon name="mail"></ion-icon>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <div className="input-box" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Nút toggle show/hide password */}
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
                  color: "#666",
                }}
              >
                <ion-icon name={showPassword ? "eye-off" : "eye"}></ion-icon>
              </span>

              <label>Password</label>
            </div>

            <div className="remember-forgot">
              <label>
                <input type="checkbox" required /> I agree to terms & conditions
              </label>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </button>

            <div className="login-register">
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
