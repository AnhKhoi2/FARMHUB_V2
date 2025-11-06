import React from "react";
import PortalModal from "./PortalModal";

export default function StreakPopup({ streak, onClose }) {
  if (!streak) return null;

  const { current_streak, pointsAwarded, milestone, total_points } = streak;

  return (
    <PortalModal onClose={onClose}>
      <div className="modal-header">
        <h5 className="modal-title">Chúc mừng!</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body text-center">
        <p>Bạn đã đăng nhập {current_streak} ngày liên tiếp 🎉</p>
        {milestone && (
          <div className="mb-2">
            <strong>Đạt mốc: {milestone.replace(/_/g, " ")}</strong>
          </div>
        )}
        {pointsAwarded > 0 && (
          <div className="alert alert-success">Bạn nhận được +{pointsAwarded} điểm!</div>
        )}
        <div>Tổng điểm hiện tại: <strong>{total_points}</strong></div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-primary" onClick={onClose}>OK</button>
      </div>
    </PortalModal>
  );
}
