import React from "react";
import "../../css/farmer/NotebookCards.css";
import { formatVietnamLocale } from "../../utils/timezone";

const NotebookCard = ({
  notebook,
  onView,
  onDelete,
  onRestore,
  onPermanentDelete,
  showDeleted,
}) => {
  const title = notebook.notebook_name || "Nhật ký";
  const desc = notebook.description || "Không có mô tả.";
  const price = notebook.price || notebook.estimatedPrice || "";
  const cover = notebook.cover_image || "/uploads/placeholder-plant.png";
  const createdDate = formatVietnamLocale(
    notebook.createdAt || notebook.planted_date
  );
  const pendingToday = Array.isArray(notebook.daily_checklist)
    ? notebook.daily_checklist.filter((t) => !t.is_completed).length
    : 0;

  return (
    <div className="notebook-card" onClick={() => onView && onView(notebook)}>
      <div className="card-cover">
        <img src={cover} alt={title} />
      </div>

      <div className="card-content">
        <h3 className="card-title">{title}</h3>
        <div className="card-desc">{desc}</div>

        <div className="card-meta-top">
          <div className="meta-left">📅 {createdDate}</div>
          <div className="meta-right">
            🌱 Giai đoạn {notebook.current_stage || 1}
          </div>
        </div>

        <div className="card-spacer" />

        <div className="card-footer">
          <div>
            {price ? <div className="card-price">{price}</div> : null}
            <div className="today-tasks-small">
              Hôm nay: {pendingToday} việc
            </div>
          </div>

          <div className="card-meta-right">
            <div className="card-badge">
              {notebook.template_id ? "Có bộ mẫu" : "Chưa có mẫu"}
            </div>
            <div className="card-lock">🔒</div>
          </div>
        </div>

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {!showDeleted ? (
            <>
              <button
                className="btn btn-view"
                onClick={() => onView && onView(notebook)}
              >
                Xem chi tiết
              </button>
              <button
                className="btn btn-delete"
                onClick={() => onDelete && onDelete(notebook._id)}
              >
                Xóa
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-restore"
                onClick={() => onRestore && onRestore(notebook._id)}
              >
                ♻️ Khôi phục
              </button>
              <button
                className="btn btn-permanent-delete"
                onClick={() =>
                  onPermanentDelete && onPermanentDelete(notebook._id)
                }
              >
                💀 Xóa vĩnh viễn
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotebookCard;
