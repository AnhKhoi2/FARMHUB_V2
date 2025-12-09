import React from "react";
import PortalModal from "./PortalModal";
import "./StreakPopup.css";

export default function StreakPopup({ streak, onClose }) {
  if (!streak) return null;

  const { current_streak, pointsAwarded, milestone, total_points, badgesAwarded } = streak;

  return (
    <PortalModal onClose={onClose} maxWidth={500} dialogClass="modal-dialog-centered">
      <div className="modal-header streak-header">
        <h5 className="modal-title streak-title">🌱 Chuỗi Siêng Năng</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body text-center streak-body">
        <p className="streak-main-text">Bạn đã đăng nhập liên tiếp <span className="streak-count-inline">{current_streak}</span> ngày 🎉</p>
        {milestone && (
          <div className="streak-milestone mb-3">
            <strong>🏆 Đạt mốc: {milestone.replace(/_/g, " ")}</strong>
          </div>
        )}
        {pointsAwarded > 0 && (
          <div className="streak-points">✨ Bạn nhận được +{pointsAwarded} điểm!</div>
        )}

        {Array.isArray(badgesAwarded) && badgesAwarded.length > 0 && (
          <div className="streak-badges mt-3">
            <strong>🎖️ Bạn vừa nhận được danh hiệu:</strong>
            <ul className="streak-badges-list">
              {badgesAwarded.map((b) => (
                <li key={b}>{
                  // friendly label mapping
                  ({
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
                  }[b] || b)
                }</li>
              ))}
            </ul>
          </div>
        )}
        <div className="streak-total-points">Tổng điểm hiện tại: <strong>{total_points}</strong></div>
      </div>
      <div className="modal-footer streak-footer">
        <button className="btn btn-sm streak-btn" onClick={onClose}>OK</button>
      </div>
    </PortalModal>
  );
}
