import React, { useState, useEffect } from "react";
import Header from "../../components/shared/Header";
import { useNavigate } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/NotebookList.css";

const NotebookList = () => {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, [showDeleted]);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const response = showDeleted
        ? await notebookApi.getDeletedNotebooks()
        : await notebookApi.getAllNotebooks();
      const notebooksData = response.data?.data || response.data || [];
      console.log("📋 Fetched notebooks:", notebooksData.length);
      console.log("📋 First notebook:", notebooksData[0]);

      setNotebooks(Array.isArray(notebooksData) ? notebooksData : []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching notebooks:", err);
      setError("Không thể tải danh sách nhật ký");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchNotebooks();
      return;
    }

    try {
      setLoading(true);
      const response = await notebookApi.searchNotebooks(searchKeyword);
      const notebooksData = response.data?.data || response.data || [];
      setNotebooks(Array.isArray(notebooksData) ? notebooksData : []);
      setError(null);
    } catch (err) {
      console.error("Error searching notebooks:", err);
      setError("Không thể tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== "all") filters.status = filterStatus;

      const response = await notebookApi.filterNotebooks(filters);
      const notebooksData = response.data?.data || response.data || [];
      setNotebooks(Array.isArray(notebooksData) ? notebooksData : []);
      setError(null);
    } catch (err) {
      console.error("Error filtering notebooks:", err);
      setError("Không thể lọc");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhật ký này?")) return;

    try {
      await notebookApi.deleteNotebook(id);
      fetchNotebooks();
      alert("Xóa nhật ký thành công!");
    } catch (err) {
      console.error("Error deleting notebook:", err);
      alert("Không thể xóa nhật ký");
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Bạn có muốn khôi phục nhật ký này?")) return;

    try {
      await notebookApi.restoreNotebook(id);
      fetchNotebooks();
      alert("Khôi phục nhật ký thành công!");
    } catch (err) {
      console.error("Error restoring notebook:", err);
      alert("Không thể khôi phục nhật ký");
    }
  };

  const handlePermanentDelete = async (id) => {
    if (
      !window.confirm("⚠️ Xóa vĩnh viễn không thể hoàn tác! Bạn có chắc chắn?")
    )
      return;

    try {
      await notebookApi.permanentDeleteNotebook(id);
      fetchNotebooks();
      alert("Đã xóa vĩnh viễn nhật ký!");
    } catch (err) {
      console.error("Error permanently deleting notebook:", err);
      alert("Không thể xóa vĩnh viễn");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { label: "Đang trồng", class: "badge-success" },
      archived: { label: "Đã lưu trữ", class: "badge-secondary" },
      deleted: { label: "Đã xóa", class: "badge-danger" },
    };
    return badges[status] || badges.active;
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const calculateDaysPlanted = (plantedDate) => {
    if (!plantedDate) return 0;
    const diff = Date.now() - new Date(plantedDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="notebook-list-container">
        <Header />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-list-container">
      <Header />
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Nhật Ký Trồng Trọt</h1>
          <p className="subtitle">
            {showDeleted
              ? "Nhật ký đã xóa - Có thể khôi phục hoặc xóa vĩnh viễn"
              : "Theo dõi và quản lý các cây trồng của bạn"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`btn ${showDeleted ? "btn-secondary" : "btn-primary"}`}
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? "📋 Xem Nhật Ký" : "🗑️ Thùng Rác"}
          </button>
          {!showDeleted && (
            <button
              className="btn btn-create"
              onClick={() => navigate("/farmer/notebooks/create")}
            >
              <span className="icon">+</span>
              Tạo Nhật Ký Mới
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm nhật ký..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn-search" onClick={handleSearch}>
            🔍 Tìm kiếm
          </button>
        </div>

        <div className="filter-group">
          <label>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilter();
            }}
          >
            <option value="all">Tất cả</option>
            <option value="active">Đang trồng</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        <div className="summary">
          <strong>{notebooks.length}</strong> nhật ký
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Notebooks Grid */}
      {notebooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📔</div>
          <h3>Chưa có nhật ký nào</h3>
          <p>Tạo nhật ký đầu tiên để bắt đầu theo dõi cây trồng của bạn</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/farmer/notebooks/create")}
          >
            <span>+</span> Tạo nhật ký mới
          </button>
        </div>
      ) : (
        <div className="notebooks-grid">
          {notebooks.map((notebook) => {
            const statusBadge = getStatusBadge(notebook.status);
            const daysPlanted = calculateDaysPlanted(notebook.planted_date);

            // Debug log
            console.log("🔍 Rendering notebook:", {
              id: notebook._id,
              name: notebook.notebook_name,
              stage: notebook.current_stage,
              template: notebook.template_id,
              checklist: notebook.daily_checklist,
            });

            return (
              <div
                key={notebook._id}
                className="notebook-card"
                onClick={() => navigate(`/farmer/notebooks/${notebook._id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Cover Image */}
                <div className="card-cover">
                  {notebook.cover_image ? (
                    <img
                      src={notebook.cover_image}
                      alt={notebook.notebook_name || "Notebook"}
                    />
                  ) : (
                    <div className="cover-placeholder">
                      <span className="placeholder-icon">🌱</span>
                    </div>
                  )}
                  <span className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <h3 className="card-title">
                    {notebook.notebook_name || "Nhật ký không có tên"}
                  </h3>

                  {/* Basic Info */}
                  <div className="card-meta">
                    <div className="meta-item">
                      <strong>Giai đoạn:</strong> {notebook.current_stage || 1}/
                      {notebook.template_id &&
                      typeof notebook.template_id === "object" &&
                      notebook.template_id.stages
                        ? notebook.template_id.stages.length
                        : notebook.stages_tracking
                        ? notebook.stages_tracking.length
                        : "-"}
                    </div>
                    <div className="meta-item">
                      <strong>Ngày tạo:</strong>{" "}
                      {formatDate(notebook.createdAt || notebook.planted_date)}
                    </div>
                  </div>

                  {/* Today's tasks */}
                  {Array.isArray(notebook.daily_checklist) &&
                    (() => {
                      const pending = notebook.daily_checklist.filter(
                        (t) => !t.is_completed
                      );
                      return pending.length > 0 ? (
                        <div className="today-tasks">
                          <strong>🌱 Công việc hôm nay:</strong>{" "}
                          {pending.length} việc
                          <ul className="tasks-list">
                            {pending.slice(0, 3).map((t, idx) => (
                              <li key={idx}>{t.task_name}</li>
                            ))}
                            {pending.length > 3 && (
                              <li>... và {pending.length - 3} việc khác</li>
                            )}
                          </ul>
                        </div>
                      ) : null;
                    })()}

                  {/* Stats */}
                  <div className="card-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📅</span>
                      <div className="stat-content">
                        <span className="stat-label">Ngày trồng</span>
                        <span className="stat-value">
                          {formatDate(notebook.planted_date)}
                        </span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⏱️</span>
                      <div className="stat-content">
                        <span className="stat-label">Số ngày</span>
                        <span className="stat-value">{daysPlanted} ngày</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="card-progress">
                    <div className="progress-header">
                      <span>Tiến độ</span>
                      <span className="progress-value">
                        {notebook.progress || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${notebook.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Template Badge */}
                  {notebook.template_id && (
                    <div className="template-badge">
                      🌱{" "}
                      {typeof notebook.template_id === "object"
                        ? notebook.template_id.template_name
                        : "Có bộ mẫu"}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div
                  className="card-footer"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!showDeleted ? (
                    <>
                      <button
                        className="btn btn-view"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/farmer/notebooks/${notebook._id}`);
                        }}
                      >
                        👁️ Xem chi tiết
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notebook._id);
                        }}
                      >
                        🗑️ Xóa
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-restore"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(notebook._id);
                        }}
                      >
                        ♻️ Khôi phục
                      </button>
                      <button
                        className="btn btn-permanent-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePermanentDelete(notebook._id);
                        }}
                      >
                        💀 Xóa vĩnh viễn
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NotebookList;
