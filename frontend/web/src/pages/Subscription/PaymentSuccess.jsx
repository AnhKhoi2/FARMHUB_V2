import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import vnpayService from "../../api/vnpayService";
import "./PaymentResult.css";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const orderId = searchParams.get("orderId");
  const orderRef = searchParams.get("orderRef");

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

          // Lấy plan từ localStorage
          const pendingPlan = localStorage.getItem("pendingPlan");

          if (pendingPlan && response.order.paymentStatus === "paid") {
            // TODO: Cập nhật plan của user trong Redux store
            // dispatch(updateUserPlan(pendingPlan));

            // Xóa pending plan
            localStorage.removeItem("pendingPlan");
            localStorage.removeItem("orderId");

            console.log("Payment successful for plan:", pendingPlan);
          }
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, dispatch]);

  if (loading) {
    return (
      <div className="payment-result-container">
        <div className="payment-card">
          <div className="loading-spinner"></div>
          <h3>Đang xác nhận thanh toán...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-container">
      <div className="payment-card success">
        <div className="icon-wrapper success-icon">
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="title success-title">Thanh toán thành công! 🎉</h1>

        <p className="subtitle">
          Cảm ơn bạn đã nâng cấp gói dịch vụ. Tài khoản của bạn đã được kích
          hoạt!
        </p>

        {orderDetails && (
          <div className="order-details">
            <h3>Thông tin đơn hàng</h3>
            <div className="detail-row">
              <span className="label">Mã đơn hàng:</span>
              <span className="value">{orderDetails.orderRef || orderRef}</span>
            </div>
            <div className="detail-row">
              <span className="label">Gói dịch vụ:</span>
              <span className="value">
                {orderDetails.items?.[0]?.name || "Gói Premium"}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Số tiền:</span>
              <span className="value highlight">
                {orderDetails.totalAmount?.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Trạng thái:</span>
              <span className="value success-badge">Đã thanh toán</span>
            </div>
            <div className="detail-row">
              <span className="label">Thời gian:</span>
              <span className="value">
                {orderDetails.paidAt
                  ? new Date(orderDetails.paidAt).toLocaleString("vi-VN")
                  : "Vừa xong"}
              </span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <Link to="/" className="btn btn-primary">
            Về trang chủ
          </Link>
          <Link to="/pricing" className="btn btn-secondary">
            Xem gói dịch vụ
          </Link>
        </div>

        <p className="note">
          📧 Thông tin chi tiết đã được gửi đến email của bạn
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
