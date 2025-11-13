import React from "react";
import PortalModal from "./PortalModal";

export default function StreakPopup({ streak, onClose }) {
  if (!streak) return null;

  const { current_streak, pointsAwarded, milestone, total_points, badgesAwarded } = streak;

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

        {Array.isArray(badgesAwarded) && badgesAwarded.length > 0 && (
          <div className="mt-2">
            <strong>Bạn vừa nhận được danh hiệu:</strong>
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
        <div>Tổng điểm hiện tại: <strong>{total_points}</strong></div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-primary" onClick={onClose}>OK</button>
      </div>
    </PortalModal>
  );
}
