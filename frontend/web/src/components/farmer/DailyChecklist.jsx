import React, { useState, useEffect } from "react";
import NOTEBOOK_TEMPLATE_API from "../../api/farmer/notebookTemplateApi";
import "../../css/farmer/DailyChecklist.css";

const DailyChecklist = ({ notebookId, onTaskComplete }) => {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChecklist();
  }, [notebookId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await NOTEBOOK_TEMPLATE_API.getDailyChecklist(
        notebookId
      );
      const checklistData = response.data?.data || response.data || [];
      setChecklist(Array.isArray(checklistData) ? checklistData : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching checklist:", err);
      setError(err.response?.data?.message || "Failed to load checklist");
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskName) => {
    try {
      await NOTEBOOK_TEMPLATE_API.completeTask(notebookId, taskName);

      // Refresh checklist để lấy trạng thái mới từ server (backend đã toggle)
      const response = await NOTEBOOK_TEMPLATE_API.getDailyChecklist(
        notebookId
      );
      if (response?.data?.data) {
        setChecklist(response.data.data);
      }

      // Gọi callback để parent refresh notebook data (update progress)
      if (onTaskComplete) {
        await onTaskComplete();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update task");
    }
  };

  if (loading) return <div className="checklist-loading">Đang tải...</div>;
  if (error) return <div className="checklist-error">{error}</div>;
  if (checklist.length === 0)
    return <div className="checklist-empty">Không có công việc hôm nay</div>;

  const completedCount = checklist.filter((t) => t.is_completed).length;
  const totalCount = checklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="daily-checklist">
      <div className="checklist-header">
        <h3>✅ Công việc hôm nay</h3>
        <div className="checklist-progress">
          <span>
            {completedCount}/{totalCount} hoàn thành
          </span>
          <div className="progress-bar-mini">
            <div
              className="progress-fill-mini"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="checklist-items">
        {checklist.map((task, index) => (
          <div
            key={index}
            className={`checklist-item ${
              task.is_completed ? "completed" : ""
            } priority-${task.priority}`}
          >
            <div className="task-checkbox">
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={() => handleCompleteTask(task.task_name)}
              />
            </div>

            <div className="task-content">
              <div className="task-header">
                <h4>{task.task_name}</h4>
                <div className="task-badges">
                  {task.priority === "high" && (
                    <span className="badge priority-high">Cao</span>
                  )}
                  <span className="badge frequency">{task.frequency}</span>
                </div>
              </div>

              {task.description && (
                <p className="task-description">{task.description}</p>
              )}

              {task.completed_at && (
                <p className="task-completed-time">
                  ✓ Hoàn thành lúc{" "}
                  {new Date(task.completed_at).toLocaleTimeString("vi-VN")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;
