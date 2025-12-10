// src/components/PlantAdviceCard.jsx
import React from "react";
import "../css/PlantAdviceCard.css"; // nếu bạn chưa có file css này thì có thể bỏ dòng này

const Section = ({ title, icon, children }) => {
  if (!children) return null;
  if (Array.isArray(children) && children.length === 0) return null;

  return (
    <div className="mb-3">
      <h6 className="fw-bold mb-1">
        <span className="me-1">{icon}</span>
        {title}
      </h6>
      {Array.isArray(children) ? (
        <ul className="mb-0 ps-3 small">
          {children.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mb-0 small">{children}</p>
      )}
    </div>
  );
};

const PlantAdviceCard = ({ data }) => {
  if (!data) return null;

  const {
    plantName,
    location,
    summaryVi,
    weatherImpact,
    today,
    next_3_7_days,
    watering,
    fertilizer,
    pestAndDiseaseRisk,
    warning,
  } = data;

  const todayList = Array.isArray(today) ? today : [];
  console.log(today);
  console.log(watering);
  console.log(fertilizer);
  
  const nextDaysList = Array.isArray(next_3_7_days) ? next_3_7_days : [];

  return (
    <div className="plant-advice-wrapper">
      {/* Header */}
      <div className="plant-advice-header">
        <div>
          <div className="plant-advice-tag">GỢI Ý CHĂM SÓC</div>
          <h5 className="plant-advice-title">
            {plantName || "Cây trồng của bạn"}
          </h5>
          {location && (
            <div className="plant-advice-location">
              <span className="label">Khu vực:</span>{" "}
              <span className="value">{location}</span>
            </div>
          )}
        </div>
        <div className="plant-advice-icon-pill">🌱</div>
      </div>

      {/* Tóm tắt chung */}
      {summaryVi && (
        <div className="plant-advice-summary">
          {summaryVi}
        </div>
      )}

      {/* Nội dung chia 2 cột */}
      <div className="plant-advice-grid">
        <div>
          {/* Ảnh hưởng thời tiết */}
          <Section title="ẢNH HƯỞNG CỦA THỜI TIẾT" icon="🌤️">
            {weatherImpact}
          </Section>

          {/* Việc cần làm hôm nay */}
          <Section title="VIỆC NÊN LÀM HÔM NAY" icon="📅">
            {todayList}
          </Section>

          {/* Việc 3–7 ngày tới */}
          <Section title="TRONG 3–7 NGÀY TỚI" icon="⏭️">
            {nextDaysList}
          </Section>
        </div>

        <div>
          {/* Tưới nước */}
          <Section title="TƯỚI NƯỚC" icon="💧">
            {watering}
          </Section>

          {/* Bón phân */}
          <Section title="BÓN PHÂN" icon="🧪">
            {fertilizer}
          </Section>

          {/* Rủi ro sâu bệnh */}
          <Section title="RỦI RO SÂU BỆNH" icon="🐛">
            {pestAndDiseaseRisk}
          </Section>
        </div>
      </div>

      {/* Cảnh báo */}
      {warning && (
        <div className="plant-advice-warning">
          <strong>⚠️ Lưu ý:</strong> {warning}
        </div>
      )}
    </div>
  );
};

export default PlantAdviceCard;
