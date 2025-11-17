import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "./PlantCarePricing.css";

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
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [currentPlan, setCurrentPlan] = useState("basic");

  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    if (user && user.plan) setCurrentPlan(user.plan);
  }, [user]);

  useEffect(() => {
    if (selectedPlan && !verified) {
      if (selectedPlan === "basic") {
        setVerified(true);
        return;
      }

      const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
      const autoVerify = setTimeout(() => {
        setVerified(true);
        alert("Xác thực thành công! Gói đã được kích hoạt.");
      }, 10000);

      return () => {
        clearInterval(timer);
        clearTimeout(autoVerify);
      };
    }
  }, [selectedPlan, verified]);

  useEffect(() => {
    if (verified && selectedPlan) {
      // update locally
      setCurrentPlan(selectedPlan);
      // TODO: call backend API to create payment / update user plan
    }
  }, [verified, selectedPlan]);

  const handleUpgrade = (planKey) => {
    setSelectedPlan(planKey);
    setVerified(false);
    setCountdown(10);
    // Payment functionality removed - placeholder for future implementation
  };

  return (
    <div className="pricing-page bg-dark text-white p-4">
      <div className="text-center mb-4">
        <h1 className="display-4 text-success">Nâng cấp gói của bạn</h1>
      </div>

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
              disabled={plan.key === currentPlan}
              onClick={() => handleUpgrade(plan.key)}
              className={`btn ${
                plan.key === currentPlan ? "btn-disabled" : "btn-upgrade"
              }`}
            >
              {plan.key === currentPlan
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

      {selectedPlan && selectedPlan !== "basic" && (
        <div className="checkout-panel">
          <h4>
            Thanh toán gói <strong>{selectedPlan}</strong>
          </h4>
          <div className="qr-placeholder">[QR CODE]</div>
          {!verified ? (
            <>
              <p>({countdown}s sẽ tự động xác thực sau thanh toán)</p>
              <button
                className="btn back"
                onClick={() => setSelectedPlan(null)}
              >
                Quay lại
              </button>
            </>
          ) : (
            <div className="text-success">
              ✅ Gói {selectedPlan} đã được kích hoạt!
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlantCarePricing;
