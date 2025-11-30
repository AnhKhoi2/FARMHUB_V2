import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authApi from "../../api/shared/authApi.js";
import "../../css/Auth.css";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  // Regex giống backend: ≥8 ký tự, có chữ, số, ký tự đặc biệt
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;

  const scorePassword = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[@$!%*#?&]/.test(pw)) score++;
    return score; // 0..4
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      return toast.error('Mật khẩu xác nhận không khớp');
    }

    if (!passwordRegex.test(newPassword)) {
      return toast.error(
        'Mật khẩu phải ≥ 8 ký tự, gồm chữ, số và ký tự đặc biệt.'
      );
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, newPassword);
      toast.success('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.');
      navigate('/login');
    } catch (error) {
      const apiError = error.response?.data;
      const code = apiError?.code;

      console.error('Reset password error:', apiError || error);

      if (code === 'TOKEN_EXPIRED') {
        toast.error(
          'Liên kết đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.'
        );
        setTimeout(() => {
          navigate('/forgot-password');
        }, 2500);
      } else if (code === 'INVALID_TOKEN' || code === 'INVALID_TOKEN_PURPOSE') {
        toast.error(
          'Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu gửi lại email mới.'
        );
      } else if (code === 'WEAK_PASSWORD') {
        toast.error(
          apiError?.message ||
          'Mật khẩu không đáp ứng yêu cầu bảo mật. Vui lòng thử lại.'
        );
      } else {
        toast.error(
          apiError?.message || 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại sau.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = scorePassword(newPassword);
  const strengthLabel = ["Rất yếu","Yếu","Trung bình","Tốt","Rất tốt"][strength];

  return (
    <div className="reset-wrap" role="main">
      <div className="reset-card" aria-live="polite">
        <h1 className="reset-title">Đặt lại mật khẩu</h1>
        <p className="reset-sub">Nhập mật khẩu mới — tối thiểu 8 ký tự, gồm chữ, số và ký tự đặc biệt.</p>

        <form onSubmit={handleSubmit} className="reset-form">
          <label className="field-label" htmlFor="newPassword">Mật khẩu mới</label>
          <div className="field-row">
            <input
              id="newPassword"
              type={showNew ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-lg"
              minLength={8}
              aria-describedby="pw-help pw-strength"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              title={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNew ? (
                // eye-off
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.58 10.58A3 3 0 0113.42 13.42" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2.05 12.56C3.93 7.94 8.36 5 12 5c1.75 0 3.41.52 4.85 1.43" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                // eye
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span className="visually-hidden">{showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
            </button>
          </div>
          <div id="pw-help" className="hint">Ví dụ: Abc@1234</div>

          <div id="pw-strength" className="pw-strength">
            <div className={`strength-bar s-${strength}`} aria-hidden="true" />
            <div className="strength-label">Độ mạnh: {newPassword ? strengthLabel : '—'}</div>
          </div>

          <label className="field-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
          <div className="field-row">
            <input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-lg"
              minLength={8}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
              title={showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
            >
              {showConfirm ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M3 3l18 18" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.58 10.58A3 3 0 0113.42 13.42" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="#114b2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <span className="visually-hidden">{showConfirm ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-lg"
          >
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>

          <div className="reset-footer">
            <Link to="/forgot-password" className="link-help">Gửi lại yêu cầu đặt lại mật khẩu</Link>
            <Link to="/login" className="link-help">Quay lại đăng nhập</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
