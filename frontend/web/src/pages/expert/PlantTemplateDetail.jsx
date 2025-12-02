import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import plantTemplateApi from "../../api/expert/plantTemplateApi";
import "../../css/expert/PlantTemplateDetail.css";

const PlantTemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("stages");

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await plantTemplateApi.getTemplateById(id);
      console.log("API Response:", response); // Debug log
      // Try different possible data structures
      const templateData =
        response.data?.data?.template ||
        response.data?.template ||
        response.data?.data ||
        response.data;
      console.log("Template Data:", templateData); // Debug log
      setTemplate(templateData);
      setError(null);
    } catch (err) {
      console.error("Error fetching template:", err);
      setError("Không thể tải chi tiết template");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "active":
        return "badge-success";
      case "draft":
        return "badge-warning";
      case "archived":
        return "badge-secondary";
      default:
        return "badge-info";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "draft":
        return "Nháp";
      case "archived":
        return "Đã lưu trữ";
      default:
        return status;
    }
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: { label: "Cao", class: "priority-high" },
      medium: { label: "Trung bình", class: "priority-medium" },
      low: { label: "Thấp", class: "priority-low" },
    };
    return badges[priority] || badges.medium;
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

  if (loading) {
    return (
      <div className="template-detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="template-detail-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>{error || "Không tìm thấy template"}</h2>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        <div className="header-content">
          <div className="header-title-section">
            <h1>{template.template_name}</h1>
            <span className={`badge ${getStatusBadgeClass(template.status)}`}>
              {getStatusLabel(template.status)}
            </span>
          </div>
          <p className="header-group">🌱 {template.plant_group}</p>
          <p className="header-description">{template.group_description}</p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary btn-edit"
            style={{ backgroundColor: "white", color: "black" }}
            onClick={() => navigate(`/expert/plant-templates/edit/${id}`)}
          >
            ✏️ Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Cover Image Section - Below Header */}
      {template.cover_image && (
        <div className="cover-image-section">
          <img
            src={template.cover_image}
            alt={template.template_name}
            className="detail-cover-image"
          />
        </div>
      )}

      {/* Stats */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{template.stages?.length || 0}</div>
            <div className="stat-label">Giai đoạn</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <div className="stat-value">
              {template.stages?.length > 0
                ? Math.max(...template.stages.map((s) => s.day_end))
                : 0}
            </div>
            <div className="stat-label">Tổng ngày</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{template.usage_count || 0}</div>
            <div className="stat-label">Lượt sử dụng</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🌿</div>
          <div className="stat-content">
            <div className="stat-value">
              {template.plant_examples?.length || 0}
            </div>
            <div className="stat-label">Ví dụ cây</div>
          </div>
        </div>
      </div>

      {/* Examples */}
      {template.plant_examples && template.plant_examples.length > 0 && (
        <div className="examples-section">
          <h3>🌱 Các loại cây phù hợp</h3>
          <div className="examples-grid">
            {template.plant_examples.map((plant, index) => (
              <div key={index} className="example-item">
                {plant}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-section">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === "stages" ? "active" : ""}`}
            onClick={() => setActiveTab("stages")}
          >
            📅 Giai đoạn
          </button>
          <button
            className={`tab-btn ${activeTab === "tasks" ? "active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            ✅ Công việc
          </button>
          <button
            className={`tab-btn ${
              activeTab === "observations" ? "active" : ""
            }`}
            onClick={() => setActiveTab("observations")}
          >
            👁️ Quan sát
          </button>
          {/* Rules tab removed */}
        </div>

        <div className="tabs-content">
          {/* Stages Tab */}
          {activeTab === "stages" && (
            <div className="stages-tab">
              {template.stages && template.stages.length > 0 ? (
                <div className="stages-timeline">
                  {template.stages.map((stage, index) => (
                    <div key={index} className="stage-item">
                      <div className="stage-marker">
                        <span className="stage-number">{index + 1}</span>
                      </div>
                      <div className="stage-content">
                        <div className="stage-header">
                          <h3>{stage.name}</h3>
                          <span className="stage-duration">
                            Ngày {stage.day_start} - {stage.day_end} (
                            {stage.day_end - stage.day_start + 1} ngày)
                          </span>
                        </div>
                        <p className="stage-description">{stage.description}</p>

                        {stage.stage_image && (
                          <div className="stage-image">
                            <img src={stage.stage_image} alt={stage.name} />
                          </div>
                        )}

                        {stage.autogenerated_tasks &&
                          stage.autogenerated_tasks.length > 0 && (
                            <div className="stage-tasks">
                              <h4>🔧 Công việc tự động:</h4>
                              <ul>
                                {stage.autogenerated_tasks.map((task, idx) => (
                                  <li key={idx}>
                                    <span className="task-name">
                                      {task.task_name}
                                    </span>
                                    <span
                                      className={`task-badge ${
                                        getPriorityBadge(task.priority).class
                                      }`}
                                    >
                                      {getPriorityBadge(task.priority).label}
                                    </span>
                                    <span className="task-frequency">
                                      {getFrequencyLabel(task.frequency)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        {stage.observation_required &&
                          stage.observation_required.length > 0 && (
                            <div className="stage-observations">
                              <h4>👁️ Điểm quan sát:</h4>
                              <div className="observations-list">
                                {stage.observation_required.map((obs, idx) => (
                                  <div key={idx} className="observation-badge">
                                    {obs.label}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-message">Chưa có giai đoạn nào</div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="tasks-tab">
              {template.stages && template.stages.length > 0 ? (
                template.stages.map((stage, stageIdx) => (
                  <div key={stageIdx} className="stage-tasks-group">
                    <h3>
                      Giai đoạn {stageIdx + 1}: {stage.name}
                    </h3>
                    {stage.autogenerated_tasks &&
                    stage.autogenerated_tasks.length > 0 ? (
                      <div className="tasks-list">
                        {stage.autogenerated_tasks.map((task, taskIdx) => (
                          <div key={taskIdx} className="task-card">
                            <div className="task-header">
                              <h4>{task.task_name}</h4>
                              <div className="task-badges">
                                <span
                                  className={`badge ${
                                    getPriorityBadge(task.priority).class
                                  }`}
                                >
                                  {getPriorityBadge(task.priority).label}
                                </span>
                                <span className="badge frequency">
                                  {getFrequencyLabel(task.frequency)}
                                </span>
                              </div>
                            </div>
                            {task.description && (
                              <p className="task-description">
                                {task.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">Chưa có công việc</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-message">Chưa có công việc nào</div>
              )}
            </div>
          )}

          {/* Observations Tab */}
          {activeTab === "observations" && (
            <div className="observations-tab">
              {template.stages && template.stages.length > 0 ? (
                template.stages.map((stage, stageIdx) => (
                  <div key={stageIdx} className="stage-observations-group">
                    <h3>
                      Giai đoạn {stageIdx + 1}: {stage.name}
                    </h3>
                    {stage.observation_required &&
                    stage.observation_required.length > 0 ? (
                      <div className="observations-grid">
                        {stage.observation_required.map((obs, obsIdx) => (
                          <div key={obsIdx} className="observation-card">
                            <h4>{obs.label}</h4>
                            {obs.description && <p>{obs.description}</p>}
                            <div className="observation-key"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-message">Chưa có điểm quan sát</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-message">Chưa có quan sát nào</div>
              )}
            </div>
          )}

          {/* Rules Tab removed: rules (safe_delay_days / auto_skip) deprecated */}
        </div>
      </div>
    </div>
  );
};

export default PlantTemplateDetail;
