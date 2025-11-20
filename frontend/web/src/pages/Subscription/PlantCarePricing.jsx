import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./PlantCarePricing.css";
import vnpayService from "../../api/vnpayService";

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
      "Chẩn đoán bệnh cây bằng AI (3 lần/tháng)",
      "Nhắc nhở tưới nước, bón phân tự động",
      "Lịch trồng cây cá nhân hóa theo thời tiết",
      "Ưu đãi 10% tại cửa hàng FarmHub",
    ],
    buttonText: "Nâng cấp lên Thông Minh",
    popular: true,
  },
  {
    key: "pro",
    name: "Chuyên Gia",
    price: 199000,
    unit: "VNĐ/tháng",
    description: "Toàn quyền truy cập, hỗ trợ chuyên sâu và thương mại",
    features: [
      "Tất cả tính năng gói Thông Minh",
      "Chẩn đoán bệnh cây AI không giới hạn",
      "Hỏi đáp với chuyên gia trong 24h",
      "Tư vấn cá nhân & phân tích tiến độ cây trồng",
      "Ưu đãi 20% tại cửa hàng FarmHub",
      "Hỗ trợ kỹ thuật 1-1",
    ],
    buttonText: "Nâng cấp lên Chuyên Gia",
    popular: false,
  },
];

const PlantCarePricing = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPlan, setCurrentPlan] = useState("basic");

  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (user && user.plan) setCurrentPlan(user.plan);
  }, [user]);

  const handleUpgrade = async (planKey) => {
    // Nếu là gói basic (miễn phí), không cần thanh toán
    if (planKey === "basic") {
      alert("Bạn đang sử dụng gói miễn phí!");
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
    <div className="pricing-page bg-dark text-white p-4">
      <div className="text-center mb-4">
        <h1 className="display-4 text-success">Nâng cấp gói của bạn</h1>
        {!user && (
          <p className="text-warning">
            Vui lòng <Link to="/login">đăng nhập</Link> để nâng cấp gói
          </p>
        )}
      </div>

      {error && <div className="alert alert-danger text-center">{error}</div>}

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.key}
            className={`plan-card ${plan.popular ? "popular" : ""} ${
              plan.key === currentPlan ? "current" : ""
            }`}
          >
            {plan.popular && <div className="badge-popular">PHỔ BIẾN</div>}
            <h3>{plan.name}</h3>
            <p className="price">
              {plan.price.toLocaleString("vi-VN")}{" "}
              <span className="unit">{plan.unit}</span>
            </p>
            <p className="desc">{plan.description}</p>
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
            <ul className="features">
              {plan.features.map((f, i) => (
                <li key={i}>✓ {f}</li>
              ))}
            </ul>
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
  );
};

export default PlantCarePricing;
