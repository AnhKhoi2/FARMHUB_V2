import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import plantTemplateApi from "../../api/expert/plantTemplateApi";
import HeaderExpert from "../../components/shared/HeaderExpert";
import Footer from "../../components/shared/Footer";
import "../../css/expert/PlantTemplateManager.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PlantTemplateManager = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterGroup, setFilterGroup] = useState("all");
  const [plantGroups, setPlantGroups] = useState([
    { value: "all", label: "Tất cả nhóm cây" },
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "draft", label: "Nháp" },
    { value: "active", label: "Hoạt động" },
    { value: "archived", label: "Đã xóa (Lưu trữ)" },
  ];

  useEffect(() => {
    fetchPlantGroups();
    fetchTemplates();
  }, [filterStatus, filterGroup]);

  const fetchPlantGroups = async () => {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      let base = API_URL || "http://localhost:5000";
      base = base.replace(/\/+$/, "");
      const apiBase = base.endsWith("/api") ? base : `${base}/api`;
      const endpoint = `${apiBase}/plant-groups`;

      const res = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const items = res.data?.data || [];

      const iconMap = {
        leaf_vegetable: "🥬",
        root_vegetable: "🥕",
        fruit_short_term: "🥒",
        fruit_long_term: "🍊",
        bean_family: "🫘",
        herb: "🌿",
        flower_vegetable: "🥦",
      };

      if (items.length > 0) {
        const mapped = items.map((it) => ({
          value: it.slug || it._id,
          label: it.name || it.slug || it._id,
          icon: iconMap[it.slug] || "🌱",
        }));
        setPlantGroups([{ value: "all", label: "Tất cả nhóm cây" }, ...mapped]);
      }
    } catch (err) {
      console.warn(
        "Could not fetch plant groups, using defaults:",
        err?.message || err
      );
    }
  };

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

      // Nếu đang xem archived thì hiển thị tất cả với status archived
      let filteredTemplates = [];
      if (Array.isArray(templatesData)) {
        if (filterStatus === "archived") {
          filteredTemplates = templatesData.filter(
            (t) => t.status === "archived"
          );
        } else if (filterStatus && filterStatus !== "all") {
          filteredTemplates = templatesData.filter(
            (t) => t.status === filterStatus
          );
        } else {
          // Default: hide archived from main listing
          filteredTemplates = templatesData.filter(
            (template) => template.status !== "archived"
          );
        }
      }

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
      // Sau khi xóa mềm (archived), chuyển sang danh sách đã xóa để có thể restore
      setFilterStatus("archived");
      alert(
        "Bộ mẫu đã được xóa và chuyển vào kho lưu trữ. Bạn có thể phục hồi từ danh sách đã xóa."
      );
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Không thể xóa bộ mẫu");
    }
  };

  const handleRestore = async (templateId) => {
    if (!window.confirm("Phục hồi bộ mẫu này trở lại trạng thái hoạt động?"))
      return;

    try {
      await plantTemplateApi.activateTemplate(templateId);
      // Nếu đang xem archived, refresh list to remove restored item
      fetchTemplates();
      alert("Phục hồi thành công!");
    } catch (err) {
      console.error("Error restoring template:", err);
      alert("Không thể phục hồi bộ mẫu");
    }
  };

  const handleActivate = async (templateId) => {
    try {
      await plantTemplateApi.activateTemplate(templateId);
      fetchTemplates();
      alert("Kích hoạt bộ mẫu thành công!");
    } catch (err) {
      console.error("Error activating template:", err);
      alert("Không thể kích hoạt bộ mẫu");
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
        return "HOẠT ĐỘNG";
      case "draft":
        return "NHÁP";
      case "archived":
        return "ĐÃ LƯU TRỮ";
      default:
        return status;
    }
  };

  const getGroupLabel = (group) => {
    const found = plantGroups.find((g) => g.value === group);
    return found ? found.label : group;
  };

  // Pagination calculations
  const totalPages = Math.ceil(templates.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTemplates = templates.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterGroup]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <>
        <HeaderExpert />
        <div className="plant-template-manager">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderExpert />
      <div className="plant-template-manager">
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
        <button
          className="btn-create"
          onClick={() => navigate("/expert/plant-templates/create")}
        >
          <span className="icon">+</span>
          Tạo Bộ mẫu mới
        </button>

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
            Tìm thấy <strong>{templates.length}</strong> bộ mẫu
            {templates.length > itemsPerPage && (
              <span className="page-info">
                {" "}
                • Trang {currentPage} / {totalPages}
              </span>
            )}
          </div>
        </div>

        <div className="templates-grid">
          {templates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>Chưa có bộ mẫu nào</h3>
              <p>Hãy tạo bộ mẫu đầu tiên để bắt đầu!</p>
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
                <span>Tạo Bộ mẫu mới</span>
              </button>
            </div>
          ) : (
            currentTemplates.map((template) => (
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
                      className={`badge ${getStatusBadgeClass(
                        template.status
                      )}`}
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

                  {template.status === "archived" ? (
                    // Show restore action for archived templates
                    <button
                      className="action-btn action-restore"
                      onClick={() => handleRestore(template._id)}
                      title="Phục hồi"
                    >
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10v6a2 2 0 0 1-2 2H7" />
                        <polyline points="8 7 12 3 16 7" />
                      </svg>
                    </button>
                  ) : (
                    <>
                      <button
                        className="action-btn action-edit"
                        onClick={() =>
                          navigate(
                            `/expert/plant-templates/edit/${template._id}`
                          )
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
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {templates.length > itemsPerPage && (
          <div className="pagination-container">
            <button
              className="pagination-btn pagination-prev"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>Trước</span>
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage && page === currentPage - 2) {
                    return (
                      <span key={page} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  if (!showPage && page === currentPage + 2) {
                    return (
                      <span key={page} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  if (!showPage) return null;

                  return (
                    <button
                      key={page}
                      className={`pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                }
              )}
            </div>

            <button
              className="pagination-btn pagination-next"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span>Sau</span>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default PlantTemplateManager;
