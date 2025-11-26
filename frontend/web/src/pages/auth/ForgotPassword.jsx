import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authApi from '../../api/shared/authApi.js';
import '../../css/auth/Login.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      toast.success('Vui lòng kiểm tra email của bạn để đặt lại mật khẩu');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box login" style={{ padding: 30 }}>
          <h2>Quên mật khẩu</h2>
          <p style={{ textAlign: 'center', color: '#444', marginTop: 6 }}>
            Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div className="input-box" style={{ marginTop: 10 }}>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn"
            >
              {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
            </button>

            <div className="login-register" style={{ marginTop: 12 }}>
              <p>
                Quay lại đăng nhập? <Link to="/login" className="register-link">Đăng nhập</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}