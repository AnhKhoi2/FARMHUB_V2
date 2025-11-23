import React, { useState, useEffect } from "react";
import NOTEBOOK_TEMPLATE_API from "../../api/farmer/notebookTemplateApi";
import "../../css/farmer/NotebookTimeline.css";

const NotebookTimeline = ({ notebookId }) => {
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [notebookId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await NOTEBOOK_TEMPLATE_API.getTimeline(notebookId);
      const timelineData = response.data?.data || response.data;
      setTimeline(timelineData || null);
      setError(null);
    } catch (err) {
      console.error("Error fetching timeline:", err);
      setError(err.response?.data?.message || "Failed to load timeline");
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="timeline-loading">Đang tải...</div>;

  if (error) {
    return (
      <div className="timeline-error">
        <p>⚠️ {error}</p>
        <small>Bạn cần gán template cho notebook này để xem timeline.</small>
      </div>
    );
  }

  if (!timeline || !timeline.timeline || timeline.timeline.length === 0) {
    return (
      <div className="timeline-empty">
        <p>📋 Notebook chưa có template</p>
        <small>Vui lòng gán template để theo dõi tiến trình trồng trọt</small>
      </div>
    );
  }

  return (
    <div className="notebook-timeline">
      <div className="timeline-header">
        <h3>🌱 Tiến trình trồng trọt</h3>
        <div className="timeline-stats">
          <span>
            Ngày {timeline.current_day} / {timeline.total_days}
          </span>
          <span className="progress-badge">{timeline.progress}%</span>
        </div>
      </div>

      <div className="timeline-stages">
        {timeline.timeline.map((stage, index) => (
          <div
            key={stage.stage_number}
            className={`timeline-stage ${stage.is_current ? "current" : ""} ${
              stage.completed_at ? "completed" : ""
            }`}
          >
            <div className="stage-marker">
              {stage.completed_at ? (
                <span className="stage-icon completed">✓</span>
              ) : stage.is_current ? (
                <span className="stage-icon current">●</span>
              ) : (
                <span className="stage-icon">{stage.stage_number}</span>
              )}
            </div>

            <div className="stage-content">
              <div className="stage-header">
                <h4>{stage.stage_name}</h4>
                <span className="stage-duration">
                  {stage.duration_days} ngày (Ngày {stage.start_day} -{" "}
                  {stage.end_day})
                </span>
              </div>

              <div className="stage-dates">
                <p>
                  <strong>📅 Bắt đầu:</strong>{" "}
                  {stage.stage_start_date
                    ? // backend provides YYYY-MM-DD string already normalized to VN timezone
                      new Date(stage.stage_start_date).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )
                    : stage.started_at
                    ? new Date(stage.started_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "-"}
                </p>
                <p>
                  <strong>✅ Hoàn thành:</strong>{" "}
                  {stage.stage_end_date
                    ? new Date(stage.stage_end_date).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        }
                      )
                    : stage.completed_at
                    ? new Date(stage.completed_at).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "-"}
                </p>
              </div>

              {/* Ẩn phần hiển thị stage-observations ở timeline tiến trình */}
            </div>

            {index < timeline.timeline.length - 1 && (
              <div className="stage-connector" />
            )}
          </div>
        ))}
      </div>

      <div className="timeline-footer">
        <p>
          <strong>Ngày trồng:</strong>{" "}
          {new Date(timeline.planted_date).toLocaleDateString("vi-VN")}
        </p>
      </div>
    </div>
  );
};

export default NotebookTimeline;
