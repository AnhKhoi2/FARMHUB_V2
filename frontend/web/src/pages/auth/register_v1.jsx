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

  const [agree, setAgree] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    // gọi API như cũ
    const result = await dispatch(
      registerThunk({ username, email, password, agreedToTerms: agree })
    );

    setLoading(false);

    if (result?.success) {
      const msg =
        result.message ||
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.";

      setSuccessMessage(msg);
      setError(null);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } else if (result?.message) {
      setError(result.message);
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
          <h2>Đăng ký</h2>

          {/* Thông báo thành công */}
          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          {/* Thông báo lỗi */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleRegister} noValidate>
            <div className="input-box">
              <span className="icon">
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                value={username}
                placeholder=" "
                onChange={(e) => setUsername(e.target.value)}
              />
              <label>Tên người dùng</label>
            </div>

            <div className="input-box">
              <span className="icon">
                <ion-icon name="mail"></ion-icon>
              </span>
              <input
                type="email"
                value={email}
                placeholder=" "
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <div className="input-box" style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder=" "
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
                  color: "#f5f7f8ff",
                }}
              >
                <ion-icon name={showPassword ? "eye-off" : "eye"}></ion-icon>
              </span>

              <label>Mật khẩu</label>
            </div>

            <div className="remember-forgot">
              <label>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                Tôi đồng ý với các điều khoản và điều kiện
              </label>
            </div>

            <button className="btn-register" type="submit" disabled={loading}>
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </button>

            <div className="login-register">
              <p>
                Bạn đã có tài khoản? <Link to="/login">Đăng nhập</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
