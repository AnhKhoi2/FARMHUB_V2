import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./PlantCarePricing.css";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import vnpayService from "../../api/vnpayService";
import axiosClient from "../../api/shared/axiosClient";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/authSlice";

const plans = [
  {
    key: "basic",
    name: "Cơ Bản",
    price: 0,
    unit: "VNĐ/tháng",
    description: "Khởi đầu hành trình làm vườn với công cụ nền tảng",
    features: [
      "Truy cập hướng dẫn trồng cây cơ bản",
      "Sử dụng sổ tay ghi chép trồng cây",
      "Dự báo thời tiết cơ bản",
      "Chat AI hỗ trợ chăm sóc cây",
    ],
    buttonText: "Dùng gói Cơ Bản",
    popular: false,
  },
  {
    key: "smart",
    name: "Thông Minh",
    price: 99000,
    unit: "VNĐ/tháng",
    description: "Tự động hóa việc chăm sóc với công nghệ AI",
    features: [
      "Tất cả tính năng gói Cơ Bản",
      "Tạo sổ tay chăm sóc không giới hạn",
      "Chẩn đoán bệnh cây bằng AI không giới hạn",
    ],
    buttonText: "Nâng cấp lên Thông Minh",
    popular: true,
  },
];

const PlantCarePricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("basic");

  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();

  useEffect(() => {
    // Prefer backend field `subscriptionPlan`, fall back to older `plan` field
    if (user) setCurrentPlan(user.subscriptionPlan || user.plan || "basic");
  }, [user]);

  const handleUpgrade = async (planKey) => {
    // Nếu người dùng nhấn gói basic và hiện đang ở gói khác -> downgrade
    if (planKey === "basic") {
      if (currentPlan === "basic") {
        alert("Bạn đang sử dụng gói miễn phí!");
        return;
      }

      // Hỏi xác nhận
      const ok = window.confirm(
        "Bạn có chắc muốn hạ xuống gói Miễn Phí? Hành động này sẽ mất quyền lợi của các gói trả phí."
      );
      if (!ok) return;

      // Gọi API để hạ gói
      try {
        setLoading(true);
        const resp = await axiosClient.patch("/api/subscription/downgrade");
        // Cập nhật Redux user nếu backend trả về user
        const updatedUser = resp.data?.user;
        if (updatedUser) {
          dispatch(setUser(updatedUser));
        }
        setCurrentPlan("basic");
        alert("Bạn đã chuyển về gói Miễn Phí");
      } catch (err) {
        console.error("Downgrade error:", err);
        alert("Không thể hạ gói, vui lòng thử lại sau");
      } finally {
        setLoading(false);
      }

      return;
    }

    // Kiểm tra user đã đăng nhập chưa
    if (!user || !user._id) {
      alert("Vui lòng đăng nhập để nâng cấp gói!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const plan = plans.find((p) => p.key === planKey);

      // Tạo payment URL từ VNPay
      const paymentData = {
        amount: plan.price,
        orderDescription: `Nang cap goi ${plan.name}`,
        userId: user._id,
        items: [
          {
            itemType: "Subscription",
            name: `Gói ${plan.name}`,
            quantity: 1,
            price: plan.price,
          },
        ],
      };

      console.log("Creating payment for:", paymentData);

      const response = await vnpayService.createPaymentUrl(paymentData);

      if (response.code === "00" && response.paymentUrl) {
        // Lưu thông tin plan vào localStorage để xử lý sau khi thanh toán
        localStorage.setItem("pendingPlan", planKey);
        localStorage.setItem("orderId", response.orderId);

        // Redirect đến trang thanh toán VNPay
        window.location.href = response.paymentUrl;
      } else {
        throw new Error(response.message || "Không thể tạo thanh toán");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Có lỗi xảy ra khi tạo thanh toán");
      alert("Lỗi: " + (err.message || "Không thể tạo thanh toán"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="pricing-page p-4">
        {/* <button
          type="button"
          className="back-button"
          onClick={() => window.history.back()}
          aria-label="Quay lại"
        >
          ← Quay lại
        </button> */}
        <div className="pricing-hero text-center mb-4">
          <h1 className="display-4">Nâng cấp gói của bạn</h1>
          <p className="lead text-muted">
            Chọn gói phù hợp — đơn giản, trực quan và tiết kiệm thời gian chăm
            sóc vườn của bạn.
          </p>
          {!user && (
            <p className="text-danger">
              Vui lòng <Link to="/login">đăng nhập</Link> để nâng cấp gói
            </p>
          )}
        </div>

        {/* Hiển thị gói hiện tại */}
        {user && (
          <div className="current-plan-banner">
            📦 Gói hiện tại:{" "}
            <strong>
              {plans.find((p) => p.key === currentPlan)?.name || "Cơ Bản"}
            </strong>
          </div>
        )}

        {error && <div className="alert alert-danger text-center">{error}</div>}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`plan-card ${plan.popular ? "popular" : ""} ${
                plan.key === currentPlan ? "current" : ""
              }`}
            >
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                {plan.popular && <div className="badge-popular">PHỔ BIẾN</div>}
              </div>

              <div className="plan-price">
                <span className="price-number">
                  {plan.price.toLocaleString("vi-VN")}
                </span>
                <span className="price-unit">{plan.unit}</span>
              </div>

              <p className="desc text-muted">{plan.description}</p>

              <ul className="features">
                {plan.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>

              <div className="plan-actions">
                <button
                  disabled={plan.key === currentPlan || loading || !user}
                  onClick={() => handleUpgrade(plan.key)}
                  className={`btn ${
                    plan.key === currentPlan ? "btn-disabled" : "btn-upgrade"
                  }`}
                >
                  {loading
                    ? "Đang xử lý..."
                    : plan.key === currentPlan
                    ? "Gói hiện tại của bạn"
                    : plan.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="checkout-panel">
            <h4>Đang tạo thanh toán...</h4>
            <p>Vui lòng đợi, bạn sẽ được chuyển đến trang thanh toán VNPay</p>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default PlantCarePricing;
