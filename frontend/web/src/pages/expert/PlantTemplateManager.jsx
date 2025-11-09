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
    { value: "archived", label: "Đã lưu trữ" },
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
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
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
              className="btn btn-primary"
              onClick={() => navigate("/expert/plant-templates/create")}
            >
              Tạo Template Mới
            </button>
          </div>
        ) : (
          templates.map((template) => (
            <div key={template._id} className="template-card">
              <div className="card-header">
                <div className="card-title-section">
                  <h3 className="card-title">{template.template_name}</h3>
                  <span
                    className={`badge ${getStatusBadgeClass(template.status)}`}
                  >
                    {getStatusLabel(template.status)}
                  </span>
                </div>
                <div className="card-group">
                  🌱 {getGroupLabel(template.plant_group)}
                </div>
              </div>

              <div className="card-body">
                <p className="card-description">
                  {template.group_description || "Không có mô tả"}
                </p>

                <div className="card-info">
                  <div className="info-item">
                    <span className="info-label">Số giai đoạn:</span>
                    <span className="info-value">
                      {template.stages?.length || 0}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tổng ngày:</span>
                    <span className="info-value">
                      {template.stages?.length > 0
                        ? Math.max(...template.stages.map((s) => s.day_end))
                        : 0}{" "}
                      ngày
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Đã sử dụng:</span>
                    <span className="info-value">
                      {template.usage_count || 0} lần
                    </span>
                  </div>
                </div>

                {template.plant_examples &&
                  template.plant_examples.length > 0 && (
                    <div className="card-examples">
                      <strong>Ví dụ:</strong>{" "}
                      {template.plant_examples.join(", ")}
                    </div>
                  )}
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-sm btn-view"
                  onClick={() =>
                    navigate(`/expert/plant-templates/${template._id}`)
                  }
                >
                  Xem chi tiết
                </button>
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() =>
                    navigate(`/expert/plant-templates/edit/${template._id}`)
                  }
                >
                  Sửa
                </button>
                {template.status === "draft" && (
                  <button
                    className="btn btn-sm btn-activate"
                    onClick={() => handleActivate(template._id)}
                  >
                    Kích hoạt
                  </button>
                )}
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(template._id)}
                >
                  Xóa
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
