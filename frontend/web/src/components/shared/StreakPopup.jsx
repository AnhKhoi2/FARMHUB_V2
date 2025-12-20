import React from "react";
import PortalModal from "./PortalModal";
import "./StreakPopup.css";

export default function StreakPopup({ streak, onClose }) {
  if (!streak) return null;

  const {
    current_streak,
    pointsAwarded,
    milestone,
    total_points,
    badgesAwarded,
  } = streak;

  return (
    <PortalModal
      onClose={onClose}
      maxWidth={550}
      dialogClass="modal-dialog-centered"
    >
      <div className="streak-modal-wrapper">
        <button
          type="button"
          className="streak-close-btn"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="streak-celebration-icon">🎉</div>

        <div className="streak-content">
          <h2 className="streak-title-main">Chuỗi Siêng Năng!</h2>

          <div className="streak-counter-card">
            <div className="streak-counter-label">
              Bạn đã đăng nhập liên tiếp
            </div>
            <div className="streak-counter-number">{current_streak}</div>
            <div className="streak-counter-unit">ngày</div>
          </div>

          {milestone && (
            <div className="streak-milestone-badge">
              <span className="streak-milestone-icon">🏆</span>
              <span className="streak-milestone-text">
                Đạt mốc: {milestone.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {pointsAwarded > 0 && (
            <div className="streak-reward-card">
              <div className="streak-reward-icon">✨</div>
              <div className="streak-reward-text">
                <span className="streak-reward-label">Phần thưởng</span>
                <span className="streak-reward-value">
                  +{pointsAwarded} điểm
                </span>
              </div>
            </div>
          )}

          {Array.isArray(badgesAwarded) && badgesAwarded.length > 0 && (
            <div className="streak-badges-section">
              <div className="streak-badges-title">
                <span className="streak-badges-icon">🎖️</span>
                Danh hiệu mới
              </div>
              <div className="streak-badges-grid">
                {badgesAwarded.map((b) => (
                  <div key={b} className="streak-badge-item">
                    {{
                      "hat-giong": "Hạt Giống",
                      "mam-non": "Mầm Non",
                      "cay-con": "Cây Con",
                      "re-ben": "Rễ Bền",
                      "tan-la": "Tán Lá",
                      "dom-nu": "Đơm Nụ",
                      "ket-trai": "Kết Trái",
                      "ket-trai-2": "Kết Trái",
                      "co-thu": "Cổ Thụ",
                      "coi-nguon": "Cội Nguồn",
                    }[b] || b}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="streak-total-section">
            <span className="streak-total-label">Tổng điểm</span>
            <span className="streak-total-value">
              {total_points.toLocaleString()}
            </span>
          </div>

          <button className="streak-action-btn" onClick={onClose}>
            Tiếp tục
          </button>
        </div>
      </div>
    </PortalModal>
  );
}
