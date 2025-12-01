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
      // Gửi request lên backend
      const res = await authApi.requestPasswordReset(email);

      // Ưu tiên dùng message từ server (nếu có)
      const serverMessage =
        res?.data?.message ||
        'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi liên kết đặt lại mật khẩu.';

      toast.success(serverMessage);
    } catch (error) {
      const apiError = error.response?.data;
      const code = apiError?.code;

      if (code === 'INVALID_EMAIL') {
        toast.error('Email không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (code === 'ACCOUNT_NOT_VERIFIED') {
        toast.error(
          'Email này chưa được xác thực. Vui lòng kiểm tra hộp thư để xác thực tài khoản trước khi đặt lại mật khẩu.'
        );
      } else {
        toast.error(apiError?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
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
                Quay lại đăng nhập?{' '}
                <Link to="/login" className="register-link">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
