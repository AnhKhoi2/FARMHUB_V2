import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import plantTemplateApi from "../../api/expert/plantTemplateApi";
import "../../css/expert/PlantTemplateManager.css";

const PlantTemplateManager = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");

  const plantGroups = [
    { value: "all", label: "Tất cả nhóm cây" },
    { value: "leaf_vegetable", label: "Rau ăn lá" },
    { value: "root_vegetable", label: "Cây củ" },
    { value: "fruit_short_term", label: "Rau/quả ngắn ngày" },
    { value: "fruit_long_term", label: "Cây ăn quả dài ngày" },
    { value: "bean_family", label: "Họ đậu" },
    { value: "herb", label: "Cây gia vị" },
    { value: "flower_vegetable", label: "Rau ăn hoa" },
    { value: "other", label: "Khác" },
  ];

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "draft", label: "Nháp" },
    { value: "active", label: "Hoạt động" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [filterStatus, filterGroup]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterGroup !== "all") params.plant_group = filterGroup;

      const response = await plantTemplateApi.getAllTemplates(params);
      console.log("API Response:", response); // Debug log
      // Try different possible data structures
      const templatesData =
        response.data?.data?.templates ||
        response.data?.templates ||
        response.data?.data ||
        [];
      console.log("Templates Data:", templatesData); // Debug log

      // Lọc bỏ các template có status "archived" để ẩn khỏi giao diện
      const filteredTemplates = Array.isArray(templatesData)
        ? templatesData.filter((template) => template.status !== "archived")
        : [];

      setTemplates(filteredTemplates);
      setError(null);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Không thể tải danh sách template");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm("Bạn có chắc muốn xóa template này?")) return;

    try {
      await plantTemplateApi.deleteTemplate(templateId);
      fetchTemplates();
      alert("Xóa template thành công!");
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Không thể xóa template");
    }
  };

  const handleActivate = async (templateId) => {
    try {
      await plantTemplateApi.activateTemplate(templateId);
      fetchTemplates();
      alert("Kích hoạt template thành công!");
    } catch (err) {
      console.error("Error activating template:", err);
      alert("Không thể kích hoạt template");
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

  const getGroupLabel = (group) => {
    const found = plantGroups.find((g) => g.value === group);
    return found ? found.label : group;
  };

  if (loading) {
    return (
      <div className="plant-template-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-template-manager">
      <div className="page-header">
        <button
          className="btn-back"
          onClick={() => navigate("/expert/home")}
          title="Quay lại trang chủ"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Quay lại</span>
        </button>
        <div className="header-content">
          <h1>Quản lý Plant Template</h1>
          <p className="subtitle">
            Tạo và quản lý các mẫu chuẩn cho từng nhóm cây
          </p>
        </div>
        <button
          className="btn btn-primary btn-create"
          onClick={() => navigate("/expert/plant-templates/create")}
        >
          <span className="icon">+</span>
          Tạo Template Mới
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="icon">⚠️</span>
          {error}
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Nhóm cây:</label>
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="filter-select"
          >
            {plantGroups.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-summary">
          Tìm thấy <strong>{templates.length}</strong> template
        </div>
      </div>

      <div className="templates-grid">
        {templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Chưa có template nào</h3>
            <p>Hãy tạo template đầu tiên để bắt đầu!</p>
            <button
              className="btn-create-new"
              onClick={() => navigate("/expert/plant-templates/create")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Tạo Template Mới</span>
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template._id} className="template-card">
              {/* Poster Background */}
              <div className="card-poster">
                {template.cover_image ? (
                  <img
                    src={template.cover_image}
                    alt={template.template_name}
                    className="cover-image"
                  />
                ) : (
                  <span className="default-icon">🌿</span>
                )}
              </div>

              {/* Info overlay at bottom */}
              <div className="card-info-overlay">
                <h3 className="card-title">{template.template_name}</h3>
                <div className="card-meta">
                  <span
                    className={`badge ${getStatusBadgeClass(template.status)}`}
                  >
                    {getStatusLabel(template.status)}
                  </span>
                  <span className="card-group">
                    🌱 {getGroupLabel(template.plant_group)}
                  </span>
                </div>
              </div>

              {/* Hover Actions - Only 3 icons */}
              <div className="card-actions-overlay">
                <button
                  className="action-btn action-view"
                  onClick={() =>
                    navigate(`/expert/plant-templates/${template._id}`)
                  }
                  title="Xem chi tiết"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  className="action-btn action-edit"
                  onClick={() =>
                    navigate(`/expert/plant-templates/edit/${template._id}`)
                  }
                  title="Chỉnh sửa"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className="action-btn action-delete"
                  onClick={() => handleDelete(template._id)}
                  title="Xóa"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlantTemplateManager;
