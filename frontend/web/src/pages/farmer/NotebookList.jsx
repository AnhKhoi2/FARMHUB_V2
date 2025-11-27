import React, { useState, useEffect } from "react";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/NotebookList.css";
import NotebookCard from "../../components/farmer/NotebookCard";
// Footer removed for notebook pages
import { formatVietnamLocale } from "../../utils/timezone";
const NotebookList = ({ showDeleted: initialShowDeleted = false }) => {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleted, setShowDeleted] = useState(initialShowDeleted);
  const location = useLocation();

  useEffect(() => {
    fetchNotebooks();
  }, [showDeleted]);

  // Apply page-level class so background covers entire viewport
  useEffect(() => {
    document.body.classList.add("notebooks-page");
    return () => {
      document.body.classList.remove("notebooks-page");
    };
  }, []);

  // Keep local showDeleted in sync with URL so navigation works reliably
  useEffect(() => {
    if (location && location.pathname) {
      const isDeletedPath = location.pathname.includes(
        "/farmer/notebooks/deleted"
      );
      if (isDeletedPath !== showDeleted) setShowDeleted(isDeletedPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
    return formatVietnamLocale(date);
  };

  const calculateDaysPlanted = (plantedDate) => {
    if (!plantedDate) return 0;
    const diff = Date.now() - new Date(plantedDate).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="notebook-list-container">
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
      <Header />
      <div className="notebook-list-container">
        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-create"
            onClick={() => navigate("/farmer/notebooks/create")}
          >
            <span className="icon">＋</span> Thêm mới notebook
          </button>
          {!showDeleted ? (
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleted(true);
                navigate("/farmer/notebooks/deleted");
              }}
            >
              🗑️ Xem notebook đã xóa
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleted(false);
                navigate("/farmer/notebooks");
              }}
            >
              ↩️ Quay lại notebook
            </button>
          )}
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
            {notebooks.map((nb) => (
              <NotebookCard
                key={nb._id}
                notebook={nb}
                onView={(n) => navigate(`/farmer/notebooks/${n._id}`)}
                onDelete={(id) => handleDelete(id)}
                onRestore={(id) => handleRestore(id)}
                onPermanentDelete={(id) => handlePermanentDelete(id)}
                showDeleted={showDeleted}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default NotebookList;
