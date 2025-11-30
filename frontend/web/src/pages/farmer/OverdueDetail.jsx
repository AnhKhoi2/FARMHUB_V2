import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/OverdueDetail.css";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";

const OverdueDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [overdueData, setOverdueData] = useState(null);
  const [processingTask, setProcessingTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOverdueDetail();
  }, [id]);

  const fetchOverdueDetail = async () => {
    try {
      setLoading(true);
      const response = await notebookApi.getOverdueDetail(id);
      const data = response.data?.data || response.data;
      setOverdueData(data);
      setError(null);
      return data;
    } catch (err) {
      console.error("Error fetching overdue detail:", err);
      setError("Không thể tải danh sách công việc quá hạn");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "priority-high";
      case "medium":
        return "priority-medium";
      case "low":
        return "priority-low";
      default:
        return "";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case "high":
        return "Cao";
      case "medium":
        return "Trung bình";
      case "low":
        return "Thấp";
      default:
        return "";
    }
  };

  const handleCompleteTask = async (taskName) => {
    try {
      setProcessingTask(taskName);
      await notebookApi.completeOverdueTask(id, taskName);

      // Refresh overdue detail to get the accurate remaining count
      const refreshed = await fetchOverdueDetail();
      setProcessingTask(null);

      // If no more overdue tasks remain, navigate back to notebook detail
      if (!refreshed || refreshed.overdue_count === 0) {
        navigate(`/farmer/notebooks/${id}`);
      }
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Không thể hoàn thành công việc");
    }
  };

  const handleSkipAll = async () => {
    if (
      !window.confirm(
        "Bạn có chắc muốn bỏ qua tất cả các công việc quá hạn này?"
      )
    ) {
      return;
    }

    try {
      await notebookApi.skipOverdueTasks(id);
      alert("Đã bỏ qua tất cả công việc quá hạn");
      navigate(`/farmer/notebooks/${id}`);
    } catch (err) {
      console.error("Error skipping overdue tasks:", err);
      alert("Không thể bỏ qua công việc");
    }
  };

  const handleGoBack = () => {
    navigate(`/farmer/notebooks/${id}`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="overdue-detail-container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="overdue-detail-container">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
            <button onClick={handleGoBack} className="btn-back">
              Quay lại
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!overdueData || overdueData.overdue_count === 0) {
    return (
      <>
        <Header />
        <div className="overdue-detail-container">
          <div className="empty-state">
            <span className="empty-icon">✓</span>
            <h3>Không có công việc quá hạn</h3>
            <p>Tất cả công việc đã được hoàn thành hoặc bỏ qua</p>
            <button onClick={handleGoBack} className="btn-back">
              Quay lại nhật ký
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="overdue-detail-container">
        <div className="overdue-detail-header">
          <button onClick={handleGoBack} className="btn-back-arrow">
            ← Quay lại
          </button>
          <div className="header-info">
            <h2>Công việc quá hạn</h2>
            {overdueData.overdue_date ? (
              <p className="overdue-date">
                Ngày: {formatDate(overdueData.overdue_date)}
              </p>
            ) : (
              <p className="overdue-date">Lịch sử công việc quá hạn</p>
            )}
          </div>
          <div className="header-count">
            <span className="count-badge">{overdueData.overdue_count}</span>
            <span className="count-label">công việc</span>
          </div>
        </div>

        <div className="overdue-detail-body">
          <div className="overdue-actions">
            <button onClick={handleSkipAll} className="btn-skip-all">
              <span className="btn-icon">✓</span>
              Bỏ qua tất cả
            </button>
          </div>

          <div className="overdue-tasks-list">
            {/* Prefer grouped view when backend provides overdue_groups */}
            {overdueData.overdue_groups && overdueData.overdue_groups.length > 0
              ? overdueData.overdue_groups.map((group, gIdx) => (
                  <div key={gIdx} className="overdue-group">
                    <div className="overdue-group-header">
                      <h4>Ngày gốc: {formatDate(group.date)}</h4>
                      <span className="group-count">
                        {group.tasks.length} công việc
                      </span>
                    </div>

                    {group.tasks.map((task, index) => (
                      <div key={index} className="overdue-task-card">
                        <div className="task-header">
                          <div className="task-info">
                            <h3 className="task-name">{task.task_name}</h3>
                            <span
                              className={`task-priority ${getPriorityClass(
                                task.priority
                              )}`}
                            >
                              {getPriorityLabel(task.priority)}
                            </span>
                          </div>
                          <span className="task-status overdue">Quá hạn</span>
                        </div>

                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}

                        <div className="task-meta">
                          <span className="task-frequency">
                            📅{" "}
                            {task.frequency === "daily"
                              ? "Hàng ngày"
                              : task.frequency}
                          </span>
                          {task.overdue_at && (
                            <span className="task-overdue-date">
                              ⏰ Quá hạn từ: {formatDateTime(task.overdue_at)}
                            </span>
                          )}
                        </div>

                        <div className="task-actions">
                          <button
                            onClick={() => handleCompleteTask(task.task_name)}
                            className="btn-complete-task"
                            disabled={
                              task.is_completed ||
                              processingTask === task.task_name
                            }
                          >
                            {task.is_completed ? (
                              <>
                                <span className="btn-icon">✓</span>
                                Đã hoàn thành
                              </>
                            ) : processingTask === task.task_name ? (
                              <>
                                <span className="btn-icon">⏳</span>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <span className="btn-icon">✓</span>
                                Hoàn thành bù
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              : // Fallback to flat list for backward compatibility
                overdueData.overdue_tasks.map((task, index) => (
                  <div key={index} className="overdue-task-card">
                    <div className="task-header">
                      <div className="task-info">
                        <h3 className="task-name">{task.task_name}</h3>
                        <span
                          className={`task-priority ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {getPriorityLabel(task.priority)}
                        </span>
                      </div>
                      <span className="task-status overdue">Quá hạn</span>
                    </div>

                    {task.description && (
                      <p className="task-description">{task.description}</p>
                    )}

                    <div className="task-meta">
                      <span className="task-frequency">
                        📅{" "}
                        {task.frequency === "daily"
                          ? "Hàng ngày"
                          : task.frequency}
                      </span>
                      {task.overdue_at && (
                        <span className="task-overdue-date">
                          ⏰ Quá hạn từ: {formatDateTime(task.overdue_at)}
                        </span>
                      )}
                    </div>

                    <div className="task-actions">
                      <button
                        onClick={() => handleCompleteTask(task.task_name)}
                        className="btn-complete-task"
                        disabled={
                          task.is_completed || processingTask === task.task_name
                        }
                      >
                        {task.is_completed ? (
                          <>
                            <span className="btn-icon">✓</span>
                            Đã hoàn thành
                          </>
                        ) : processingTask === task.task_name ? (
                          <>
                            <span className="btn-icon">⏳</span>
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            <span className="btn-icon">✓</span>
                            Hoàn thành bù
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OverdueDetail;
