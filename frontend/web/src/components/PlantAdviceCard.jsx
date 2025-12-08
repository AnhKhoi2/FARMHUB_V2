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
  const nextDaysList = Array.isArray(next_3_7_days) ? next_3_7_days : [];

  return (
    <div className="plant-advice-wrapper">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <div className="small text-muted">Cây trồng</div>
          <h5 className="mb-0 fw-bold text-success">
            {plantName || "Cây trồng của bạn"}
          </h5>
          {location && (
            <div className="small text-muted">
              Khu vực: <span className="fw-semibold">{location}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: "2rem" }}>🌱</div>
      </div>

      {/* Tóm tắt chung */}
      {summaryVi && (
        <div className="alert alert-success py-2 mb-3 small">
          {summaryVi}
        </div>
      )}

      {/* Ảnh hưởng thời tiết */}
      <Section title="Ảnh hưởng của thời tiết" icon="🌤️">
        {weatherImpact}
      </Section>

      {/* Việc cần làm hôm nay */}
      <Section title="Việc nên làm hôm nay" icon="📅">
        {todayList}
      </Section>

      {/* Việc 3–7 ngày tới */}
      <Section title="Trong 3–7 ngày tới" icon="⏭️">
        {nextDaysList}
      </Section>

      {/* Tưới nước */}
      <Section title="Tưới nước" icon="💧">
        {watering}
      </Section>

      {/* Bón phân */}
      <Section title="Bón phân" icon="🧪">
        {fertilizer}
      </Section>

      {/* Rủi ro sâu bệnh */}
      <Section title="Rủi ro sâu bệnh" icon="🐛">
        {pestAndDiseaseRisk}
      </Section>

      {/* Cảnh báo */}
      {warning && (
        <div className="alert alert-warning py-2 small mb-0">
          <strong>⚠️ Lưu ý:</strong> {warning}
        </div>
      )}
    </div>
  );
};

export default PlantAdviceCard;
