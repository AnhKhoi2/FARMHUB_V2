import React, { useState, useEffect } from "react";
import NOTEBOOK_TEMPLATE_API from "../../api/farmer/notebookTemplateApi";
import "../../css/farmer/DailyChecklist.css";

// Helper to fetch notebook info for completion check
import notebookApi from "../../api/farmer/notebookApi";

const DailyChecklist = ({ notebookId, onTaskComplete }) => {
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notebookInfo, setNotebookInfo] = useState(null);

  useEffect(() => {
    fetchChecklist();
    fetchNotebookInfo();
  }, [notebookId]);

  const fetchNotebookInfo = async () => {
    try {
      const response = await notebookApi.getNotebookById(notebookId);
      setNotebookInfo(response.data?.data || response.data);
    } catch (err) {
      setNotebookInfo(null);
    }
  };

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

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: "Hàng ngày",
      every_2_days: "2 ngày/lần",
      every_3_days: "3 ngày/lần",
      weekly: "Hàng tuần",
    };
    return labels[frequency] || frequency;
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

  if (error) {
    return (
      <div className="checklist-error">
        <p>⚠️ {error}</p>
        <small>Bạn cần gán template cho notebook này để tạo checklist.</small>
      </div>
    );
  }

  // Show completion message if notebook is fully completed
  if (
    notebookInfo &&
    (notebookInfo.progress === 100 || notebookInfo.progress === "100") &&
    Array.isArray(notebookInfo.stages_tracking) &&
    notebookInfo.stages_tracking.length > 0 &&
    notebookInfo.stages_tracking.every((stage) => stage.status === "completed")
  ) {
    return (
      <div className="checklist-completed">
        <h3>
          🎉 Chúc mừng! Bạn đã hoàn thành tất cả công việc và giai đoạn của
          notebook này.
        </h3>
        <p>Hãy xem lại tiến trình, ghi chú hoặc bắt đầu một notebook mới!</p>
      </div>
    );
  }

  if (checklist.length === 0) {
    return (
      <div className="checklist-empty">
        <p>📋 Không có công việc hôm nay</p>
        <small>
          Nếu bạn vừa chuyển sang giai đoạn mới, công việc của giai đoạn mới sẽ
          xuất hiện ngay trong ngày đầu tiên của giai đoạn.
        </small>
      </div>
    );
  }

  const completedCount = checklist.filter((t) => t.is_completed).length;
  const totalCount = checklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // Kiểm tra tasks từ hôm qua chưa hoàn thành
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const overdueTasksCount = checklist.filter((task) => {
    if (task.is_completed) return false;
    const taskDate = new Date(task.created_at);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() < yesterday.getTime();
  }).length;

  return (
    <div className="daily-checklist">
      <div className="checklist-header">
        <h3>✅ CÔNG VIỆC HÔM NAY</h3>
        <div className="checklist-progress">
          <span>
            {completedCount}/{totalCount} HOÀN THÀNH
          </span>
          <div className="progress-bar-mini">
            <div
              className="progress-fill-mini"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Cảnh báo tasks overdue */}
      {overdueTasksCount > 0 && (
        <div className="overdue-warning">
          ⚠️ Bạn có {overdueTasksCount} công việc chưa hoàn thành từ hôm qua!
        </div>
      )}

      <div className="checklist-items">
        {checklist.map((task, index) => {
          const isOverdue = () => {
            if (task.is_completed) return false;
            const taskDate = new Date(task.created_at);
            taskDate.setHours(0, 0, 0, 0);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            return taskDate.getTime() < yesterday.getTime();
          };

          return (
            <div
              key={index}
              className={`checklist-item ${
                task.is_completed ? "completed" : ""
              } ${isOverdue() ? "overdue" : ""} priority-${task.priority}`}
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
                  <h4>
                    {isOverdue() && <span className="overdue-icon">⏰ </span>}
                    {(task.task_name || "").toUpperCase()}
                  </h4>
                  <div className="task-badges">
                    {task.priority === "high" && (
                      <span className="badge priority-high">Cao</span>
                    )}
                    {isOverdue() && (
                      <span className="badge overdue-badge">Trễ hạn</span>
                    )}
                    <span className="badge frequency">
                      {getFrequencyLabel(task.frequency)}
                    </span>
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
          );
        })}
      </div>
    </div>
  );
};

export default DailyChecklist;
