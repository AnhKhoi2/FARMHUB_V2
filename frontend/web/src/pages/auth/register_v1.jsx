import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerThunk } from "../../redux/authThunks.js";

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // src/pages/auth/Register.jsx
const handleRegister = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const result = await dispatch(
    registerThunk({ username, email, password })
  );
  setLoading(false);

  if (result?.success) {
    // Có thể show toast sau này, giờ redirect luôn
    navigate("/login");
  } else if (result?.message) {
    setError(result.message); // in đúng message từ BE
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
          <form onSubmit={handleRegister}>
            {error && <div className="error-message">{error}</div>}

            <div className="input-box">
              <span className="icon"><ion-icon name="person"></ion-icon></span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label>Username</label>
            </div>

            <div className="input-box">
              <span className="icon"><ion-icon name="mail"></ion-icon></span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <div className="input-box">
              <span className="icon"><ion-icon name="lock-closed"></ion-icon></span>
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
