import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
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
  const user = useSelector((state) => state.auth.user);
  const [notebooks, setNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showDeleted, setShowDeleted] = useState(initialShowDeleted);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const location = useLocation();

  useEffect(() => {
    fetchNotebooks();
    setCurrentPage(1);
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
      setCurrentPage(1);
    } catch (err) {
      console.error("Error searching notebooks:", err);
      setError("Không thể tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  // Note: status filtering removed — filtering kept to search and deleted view

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
      alert("✅ Khôi phục nhật ký thành công!");
    } catch (err) {
      console.error("Error restoring notebook:", err);

      // Kiểm tra lỗi vượt quá giới hạn
      if (err?.response?.data?.code === "NOTEBOOK_LIMIT_EXCEEDED") {
        const currentCount = err.response.data?.currentCount || 3;
        const maxAllowed = err.response.data?.maxAllowed || 3;

        // Hiển thị modal với option nâng cấp
        if (
          window.confirm(
            `❌ GIỚI HẠN GÓI MIỄN PHÍ\n\n` +
              `Bạn đang có ${currentCount}/${maxAllowed} nhật ký đang hoạt động.\n` +
              `Gói miễn phí chỉ cho phép tối đa 3 nhật ký.\n\n` +
              `🌟 Nâng cấp lên gói THÔNG MINH để:\n` +
              `✓ Khôi phục không giới hạn\n` +
              `✓ Tạo nhật ký không giới hạn\n` +
              `✓ Truy cập tính năng AI\n` +
              `✓ Hỗ trợ ưu tiên\n\n` +
              `Bạn có muốn nâng cấp ngay không?`
          )
        ) {
          navigate("/pricing");
        }
      } else {
        alert(err?.response?.data?.message || "Không thể khôi phục nhật ký");
      }
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
            onClick={() => {
              // Respect subscriptionPlan (newer token) but fallback to plan
              const plan = user?.subscriptionPlan || user?.plan || "basic";
              // Only basic/free are limited to 3 notebooks
              const isFree = plan === "basic" || plan === "free";
              if (isFree && notebooks.length >= 3) {
                setShowLimitModal(true);
                return;
              }
              navigate("/farmer/notebooks/create");
            }}
          >
            <span className="icon">＋</span> Thêm mới sổ tay
          </button>
          {!showDeleted ? (
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleted(true);
                navigate("/farmer/notebooks/deleted");
              }}
            >
              🗑️ Xem sổ tay đã xóa
            </button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleted(false);
                navigate("/farmer/notebooks");
              }}
            >
              ↩️ Quay lại sổ tay
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm sổ tay..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
              🔍 TÌM KIẾM
            </button>
          </div>

          {/* Trạng thái filter removed per request */}

          <div className="summary">
            <strong>{notebooks.length}</strong> SỔ TAY
          </div>
        </div>

        {/* Info banner for deleted notebooks page */}
        {showDeleted && (
          <div className="alert alert-info">
            <span>ℹ️</span>
            <div>
              <strong>Khôi phục nhật ký đã xóa</strong>
              <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem" }}>
                {(user?.subscriptionPlan || user?.plan) === "smart" ||
                (user?.subscriptionPlan || user?.plan) === "premium"
                  ? "Gói Thông Minh: Bạn có thể khôi phục không giới hạn nhật ký đã xóa! 🌟"
                  : "Gói miễn phí chỉ cho phép khôi phục nếu bạn có ít hơn 3 nhật ký đang hoạt động. Nâng cấp lên gói Thông Minh để khôi phục không giới hạn! 🚀"}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Limit modal (free-tier) */}
        {showLimitModal && (
          <div
            className="nb-modal-overlay"
            onClick={() => setShowLimitModal(false)}
          >
            <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-3">GIỚI HẠN GÓI MIỄN PHÍ</h3>
              <p className="text-sm text-gray-600 mb-4">
                Tài khoản miễn phí chỉ được tạo tối đa 3 nhật ký. Để thêm nhật
                ký mới, bạn có thể xóa 1 trong 3 nhật ký hiện tại hoặc nâng cấp
                lên gói Thông Minh để tạo không giới hạn.
              </p>

              <div className="mb-4">
                <h4 className="mb-2">NHẬT KÝ HIỆN TẠI</h4>
                <div className="grid grid-cols-1 gap-2 nb-current-list">
                  {notebooks.map((nb) => (
                    <div key={nb._id} className="nb-item">
                      <div className="nb-meta">
                        <div className="nb-title">
                          {nb.notebook_name ||
                            nb.title ||
                            nb.name ||
                            "Không tên"}
                        </div>
                        <div className="nb-sub">
                          {formatDate(nb.createdAt || nb.planted_date)}
                        </div>
                      </div>
                      <div className="nb-actions">
                        <button
                          className="nb-btn nb-btn-ghost"
                          onClick={async () => {
                            // Confirm deletion
                            if (
                              !window.confirm(
                                "Bạn có chắc muốn xóa nhật ký này?"
                              )
                            )
                              return;
                            try {
                              await handleDelete(nb._id);
                              // refresh list
                              await fetchNotebooks();
                              if ((notebooks.length || 0) < 3) {
                                setShowLimitModal(false);
                                navigate("/farmer/notebooks/create");
                              }
                            } catch (err) {
                              console.error("Delete from modal failed", err);
                            }
                          }}
                        >
                          XÓA
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nb-modal-actions">
                <button
                  className="nb-btn nb-btn-ghost"
                  onClick={() => setShowLimitModal(false)}
                >
                  HỦY
                </button>
                <button
                  className="nb-btn nb-btn-primary"
                  onClick={() => navigate("/pricing")}
                >
                  NÂNG CẤP LÊN THÔNG MINH
                </button>
              </div>
            </div>
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
          <>
            <div className="notebooks-grid">
              {notebooks
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((nb) => (
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

            {/* Pagination */}
            {notebooks.length > itemsPerPage && (
              <div className="pagination-container">
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                {Array.from(
                  { length: Math.ceil(notebooks.length / itemsPerPage) },
                  (_, i) => i + 1
                ).map((page) => (
                  <button
                    key={page}
                    className={`pagination-number ${
                      currentPage === page ? "active" : ""
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(
                        Math.ceil(notebooks.length / itemsPerPage),
                        prev + 1
                      )
                    )
                  }
                  disabled={
                    currentPage === Math.ceil(notebooks.length / itemsPerPage)
                  }
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default NotebookList;
