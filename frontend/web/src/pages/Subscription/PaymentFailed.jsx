import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import vnpayService from "../../api/vnpayService";
import "./PaymentResult.css";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  const errorCode = searchParams.get("code");

  // Map error codes to Vietnamese messages
  const getErrorMessage = (code) => {
    const errorMessages = {
      "07": "Giao dịch bị nghi ngờ gian lận",
      "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
      10: "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Đã hết hạn chờ thanh toán",
      12: "Thẻ/Tài khoản bị khóa",
      13: "Sai mật khẩu xác thực giao dịch (OTP)",
      24: "Khách hàng hủy giao dịch",
      51: "Tài khoản không đủ số dư",
      65: "Tài khoản vượt quá hạn mức giao dịch",
      75: "Ngân hàng đang bảo trì",
      79: "Giao dịch vượt quá số lần nhập sai mật khẩu",
      default: "Giao dịch thất bại. Vui lòng thử lại sau.",
    };
    return errorMessages[code] || errorMessages.default;
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await vnpayService.getOrderById(orderId);

        if (response.success && response.order) {
          setOrderDetails(response.order);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    // Xóa pending plan từ localStorage
    localStorage.removeItem("pendingPlan");
    localStorage.removeItem("orderId");
  }, [orderId]);

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-card">
          <div className="loading-spinner"></div>
          <h3>Đang kiểm tra giao dịch...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-card failed">
        <div className="icon-wrapper failed-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="title failed-title">Thanh toán thất bại</h1>

        <p className="subtitle error-message">{getErrorMessage(errorCode)}</p>

        {errorCode && <p className="error-code">Mã lỗi: {errorCode}</p>}

        {orderDetails && (
          <div className="order-details">
            <h3>Thông tin đơn hàng</h3>
            <div className="detail-row">
              <span className="label">Mã đơn hàng:</span>
              <span className="value">{orderDetails.orderRef}</span>
            </div>
            <div className="detail-row">
              <span className="label">Gói dịch vụ:</span>
              <span className="value">
                {orderDetails.items?.[0]?.name || "Gói Premium"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Số tiền:</span>
              <span className="value">
                {orderDetails.totalAmount?.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Trạng thái:</span>
              <span className="value failed-badge">Thất bại</span>
            </div>
          </div>
        )}

        <div className="suggestions">
          <h3>Gợi ý giải quyết:</h3>
          <ul>
            <li>✓ Kiểm tra lại số dư tài khoản</li>
            <li>✓ Đảm bảo thẻ đã đăng ký Internet Banking</li>
            <li>✓ Kiểm tra hạn mức giao dịch</li>
            <li>✓ Thử lại sau vài phút</li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/pricing" className="btn btn-primary">
            Thử lại
          </Link>
          <Link to="/" className="btn btn-secondary">
            Về trang chủ
          </Link>
        </div>

        <p className="note">
          📞 Cần hỗ trợ? Liên hệ: support@farmhub.vn hoặc 1900-xxxx
        </p>
      </div>
    </div>
  );
};

export default PaymentFailed;
