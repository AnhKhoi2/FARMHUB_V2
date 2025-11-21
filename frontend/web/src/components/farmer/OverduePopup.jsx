import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/farmer/OverduePopup.css";

const OverduePopup = ({ overdueSummary, notebookId, onSkip, onClose }) => {
  const navigate = useNavigate();

  if (!overdueSummary || overdueSummary.overdue_count === 0) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleViewDetail = () => {
    onClose();
    navigate(`/farmer/notebooks/${notebookId}/overdue`);
  };

  const handleSkip = async () => {
    if (window.confirm("Bạn có chắc muốn bỏ qua các công việc này?")) {
      await onSkip();
      onClose();
    }
  };

  return (
    <div className="overdue-popup-overlay" onClick={onClose}>
      <div className="overdue-popup" onClick={(e) => e.stopPropagation()}>
        <div className="overdue-popup-header">
          <span className="overdue-icon">⚠️</span>
          <h3>Công việc chưa hoàn thành</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="overdue-popup-body">
          <p className="overdue-message">
            Bạn có{" "}
            <strong className="overdue-count">
              {overdueSummary.overdue_count}
            </strong>{" "}
            công việc chưa hoàn thành của ngày{" "}
            <strong>{formatDate(overdueSummary.overdue_date)}</strong>.
          </p>
          <p className="overdue-question">Bạn muốn xử lý ngay không?</p>
        </div>

        <div className="overdue-popup-footer">
          <button className="btn-view-detail" onClick={handleViewDetail}>
            <span className="btn-icon">📋</span>
            Xem chi tiết
          </button>
          <button className="btn-skip" onClick={handleSkip}>
            <span className="btn-icon">✓</span>
            Bỏ qua
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverduePopup;
