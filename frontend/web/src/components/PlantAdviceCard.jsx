import React from "react";
import { FaLeaf, FaCloudRain, FaSun, FaWind } from "react-icons/fa";

const PlantAdviceCard = ({ data }) => {
  if (!data) return null;

  const { summary, tips, extraNotes, conditions } = data;

  return (
    <div className="advice-wrapper" style={styles.card}>
      <h3 style={styles.title}>🌱 Gợi ý chăm sóc cây hôm nay</h3>

      <p style={styles.summary}>{summary}</p>

      <div style={styles.conditionBox}>
        <p><FaSun /> Nhiệt độ: <b>{conditions.temp}°C</b></p>
        <p><FaLeaf /> Độ ẩm: <b>{conditions.humidity}%</b></p>
        <p><FaCloudRain /> Lượng mưa 1h: <b>{conditions.rain1h} mm</b></p>
        {conditions.uvi !== null && (
          <p><FaSun /> UV: <b>{conditions.uvi}</b></p>
        )}
        <p><FaWind /> AQI: <b>{conditions.aqi_label}</b></p>
      </div>

      <h4 style={styles.subTitle}>✔️ Các việc nên làm</h4>
      <ul>
        {tips.map((item, idx) => (
          <li key={idx} style={styles.tipItem}>{item}</li>
        ))}
      </ul>

      {extraNotes?.length > 0 && (
        <>
          <h4 style={styles.subTitle}>ℹ️ Ghi chú thêm</h4>
          {extraNotes.map((note, idx) => (
            <p key={idx} style={styles.extraNote}>{note}</p>
          ))}
        </>
      )}
    </div>
  );
};

export default PlantAdviceCard;

const styles = {
  card: {
    padding: "18px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    marginTop: "16px",
  },
  title: {
    margin: 0,
    marginBottom: "10px",
    fontSize: "20px",
    fontWeight: 600,
  },
  summary: {
    background: "#f2f7f2",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  conditionBox: {
    background: "#fafafa",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "16px",
  },
  subTitle: {
    marginTop: "10px",
    marginBottom: "6px",
    fontWeight: 600,
  },
  tipItem: {
    marginBottom: "6px",
  },
  extraNote: {
    fontSize: "14px",
    color: "#555",
  },
};
