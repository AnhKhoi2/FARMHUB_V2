import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import DailyChecklist from "../../components/farmer/DailyChecklist";
import StageObservations from "../../components/farmer/StageObservations";
import NotebookTimeline from "../../components/farmer/NotebookTimeline";
import ImageUploader from "../../components/farmer/ImageUploader";
import OverduePopup from "../../components/farmer/OverduePopup";
import { generateNotebookPDF } from "../../utils/pdfGenerator";
import "../../css/farmer/NotebookDetail.css";
import { formatVietnamLocale } from "../../utils/timezone";

const NotebookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("progress");
  const [notebook, setNotebook] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [journalText, setJournalText] = useState("");
  const [overdueSummary, setOverdueSummary] = useState(null);
  const [showOverduePopup, setShowOverduePopup] = useState(false);

  useEffect(() => {
    if (id && id !== "undefined") {
      fetchNotebookData();
      checkDailyStatus();

      // If URL contains ?tab=observations (or other tab), set active tab accordingly
      try {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab) setActiveTab(tab);
      } catch (e) {
        // ignore
      }
    }
  }, [id]);

  // Also update activeTab when search changes (e.g., navigating with ?tab=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    } catch (e) {}
  }, [location.search]);

  // Listen for global notebook task updates (dispatched by axios interceptor)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onTaskUpdated = (e) => {
      try {
        const updatedId =
          e?.detail?.notebookId || (e && e.detail && e.detail.notebookId);
        // If event has no id or matches current notebook, refresh
        if (!updatedId || String(updatedId) === String(id)) {
          fetchNotebookData();
        }
      } catch (err) {
        fetchNotebookData();
      }
    };

    window.addEventListener("notebook:task-updated", onTaskUpdated);
    return () =>
      window.removeEventListener("notebook:task-updated", onTaskUpdated);
  }, [id]);

  const fetchNotebookData = async () => {
    if (!id || id === "undefined") {
      console.log("⚠️ Invalid notebook ID:", id);
      return;
    }

    try {
      setLoading(true);

      // Fetch notebook details
      const notebookRes = await notebookApi.getNotebookById(id);
      const notebookData = notebookRes.data?.data || notebookRes.data;
      setNotebook(notebookData);
      setJournalText(notebookData.description || "");

      // Fetch template if exists
      if (notebookData.template_id) {
        try {
          const templateRes = await notebookApi.getTemplate(id);
          const templateData = templateRes.data?.data || templateRes.data;
          setTemplate(templateData);
        } catch (err) {
          console.error("No template assigned yet", err);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching notebook data:", err);
      setError("Không thể tải dữ liệu nhật ký");
    } finally {
      setLoading(false);
    }
  };

  const checkDailyStatus = async () => {
    try {
      const response = await notebookApi.getDailyStatus(id);
      const data = response.data?.data || response.data;

      // Hiển thị popup nếu có overdue
      if (data.overdue_summary && data.overdue_summary.overdue_count > 0) {
        setOverdueSummary(data.overdue_summary);
        setShowOverduePopup(true);
      }
    } catch (err) {
      console.error("Error checking daily status:", err);
    }
  };

  const handleSkipOverdue = async () => {
    try {
      await notebookApi.skipOverdueTasks(id);
      setShowOverduePopup(false);
      setOverdueSummary(null);
    } catch (err) {
      console.error("Error skipping overdue tasks:", err);
      alert("Không thể bỏ qua công việc");
    }
  };

  const handleAddImage = async (imageUrl) => {
    if (!imageUrl) {
      alert("Vui lòng chọn hình ảnh");
      return;
    }

    try {
      await notebookApi.addImage(id, imageUrl);
      await fetchNotebookData();
      alert("Đã thêm hình ảnh!");
    } catch (err) {
      console.error("Error adding image:", err);
      alert("Không thể thêm hình ảnh");
    }
  };

  const handleRemoveImage = async (imageUrl) => {
    if (!window.confirm("Bạn có chắc muốn xóa hình ảnh này?")) return;

    try {
      await notebookApi.removeImage(id, imageUrl);
      await fetchNotebookData();
      alert("Đã xóa hình ảnh!");
    } catch (err) {
      console.error("Error removing image:", err);
      alert("Không thể xóa hình ảnh");
    }
  };

  const handleSaveJournal = async () => {
    try {
      await notebookApi.updateNotebook(id, { description: journalText });
      alert("Đã lưu ghi chú!");
    } catch (err) {
      console.error("Error saving journal:", err);
      alert("Không thể lưu ghi chú");
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!notebook) {
        alert("Không có dữ liệu để xuất PDF");
        return;
      }

      console.log("📄 Starting PDF export...");
      console.log("Notebook:", notebook);
      console.log("Template:", template);

      const result = await generateNotebookPDF(notebook, template);

      if (result.success) {
        alert(`✅ Đã xuất PDF thành công: ${result.fileName}`);
      } else {
        alert(`❌ Lỗi khi xuất PDF: ${result.error}`);
      }
    } catch (err) {
      console.error("Error exporting PDF:", err);
      alert("Không thể xuất PDF");
    }
  };

  const handleDeleteNotebook = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa nhật ký này?")) return;

    try {
      await notebookApi.deleteNotebook(id);
      alert("Xóa nhật ký thành công!");
      navigate("/farmer/notebooks");
    } catch (err) {
      console.error("Error deleting notebook:", err);
      alert(err?.response?.data?.message || "Không thể xóa nhật ký");
    }
  };

  const calculateDaysPlanted = () => {
    if (!notebook?.planted_date) {
      return 0;
    }

    const plantedDate = new Date(notebook.planted_date);
    const today = new Date();

    // Reset time to compare only dates
    plantedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diff = today.getTime() - plantedDate.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    return days;
  };

  const getCurrentStageInfo = () => {
    if (!notebook?.current_stage || !template?.stages) return null;

    // Template stages dùng index (0-based), notebook.current_stage là 1-based
    const stageIndex = notebook.current_stage - 1;
    return template.stages[stageIndex];
  };

  const getNextStageDate = () => {
    const currentStage = getCurrentStageInfo();
    if (!currentStage || !notebook?.planted_date) return null;

    const plantedDate = new Date(notebook.planted_date);
    const expectedEndDate = new Date(plantedDate);
    expectedEndDate.setDate(plantedDate.getDate() + currentStage.day_end);

    return formatVietnamLocale(expectedEndDate);
  };

  if (loading) {
    return (
      <div className="notebook-detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div className="notebook-detail-container">
        <div className="alert alert-error">
          <span>⚠️</span> {error || "Không tìm thấy nhật ký"}
        </div>
        <button
          className="btn btn-back"
          onClick={() => navigate("/farmer/notebooks")}
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const currentStage = getCurrentStageInfo();
  const daysPlanted = calculateDaysPlanted();
  // Find stage tracking object for current stage (to check flags like pending_transition)
  const currentStageTracking = notebook?.stages_tracking?.find(
    (s) => s.stage_number === notebook.current_stage
  );

  return (
    <div className="notebook-detail-container">
      {/* Cover Image Banner */}
      {notebook.cover_image && (
        <div className="notebook-banner">
          <img
            src={notebook.cover_image}
            alt={notebook.notebook_name}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
          <div className="banner-overlay">
            <h1>{notebook.notebook_name}</h1>
            <p className="plant-type">🌿 {notebook.plant_type}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <button
          className="btn-back"
          onClick={() => navigate("/farmer/notebooks")}
        >
          ← Quay lại
        </button>
        {!notebook.cover_image && (
          <div className="header-info">
            <h1>{notebook.notebook_name}</h1>
            <p className="plant-type">🌿 {notebook.plant_type}</p>
          </div>
        )}
        <div className="header-actions">
          <button
            className="btn-export-pdf"
            onClick={handleExportPDF}
            title="Xuất nhật ký dưới dạng PDF"
          >
            📄 Xuất PDF
          </button>
          <button
            className="btn-edit"
            onClick={() => {
              console.log(
                "🖊️ Navigating to edit:",
                `/farmer/notebooks/${id}/edit`
              );
              navigate(`/farmer/notebooks/${id}/edit`);
            }}
          >
            ✏️ Chỉnh sửa
          </button>
          <button
            className="btn-delete"
            onClick={() => handleDeleteNotebook()}
            title="Xóa nhật ký"
          >
            🗑️ Xóa
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {/* <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-content">
            <span className="stat-label">Ngày trồng</span>
            <span className="stat-value">
              {new Date(notebook.planted_date).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div> */}
      {/* Ẩn số ngày trồng - không cần thiết khi mới bắt đầu */}
      {/* <div className="stat-card">
          <span className="stat-icon">⏱️</span>
          <div className="stat-content">
            <span className="stat-label">Số ngày trồng</span>
            <span className="stat-value">{daysPlanted} ngày</span>
          </div>
        </div> */}
      {/* <div className="stat-card">
          <span className="stat-icon">🌱</span>
          <div className="stat-content">
            <span className="stat-label">Giai đoạn hiện tại</span>
            <span className="stat-value">
              {currentStage
                ? `${currentStage.name} (${notebook.current_stage})`
                : "Chưa xác định"}
            </span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-content">
            <span className="stat-label">Tiến độ</span>
            <span className="stat-value">{notebook.progress || 0}%</span>
          </div>
        </div>
      </div> */}

      {/* Tabs Navigation */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "progress" ? "active" : ""}`}
          onClick={() => setActiveTab("progress")}
        >
          <span className="tab-icon">📈</span>
          Tiến Độ
        </button>
        <button
          className={`tab-btn ${activeTab === "checklist" ? "active" : ""}`}
          onClick={() => setActiveTab("checklist")}
        >
          <span className="tab-icon">✅</span>
          Công Việc Hàng Ngày
        </button>
        <button
          className={`tab-btn ${activeTab === "observations" ? "active" : ""}`}
          onClick={() => setActiveTab("observations")}
        >
          <span className="tab-icon">👁️</span>
          Quan Sát
        </button>
        <button
          className={`tab-btn ${activeTab === "journal" ? "active" : ""}`}
          onClick={() => setActiveTab("journal")}
        >
          <span className="tab-icon">📔</span>
          Nhật Ký & Hình Ảnh
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* TAB 1: Progress */}
        {activeTab === "progress" && (
          <div className="progress-tab">
            <div className="progress-overview">
              <h2>Tổng Quan Tiến Độ</h2>
              <div className="progress-bar-large">
                <div
                  className="progress-fill"
                  style={{ width: `${notebook.progress || 0}%` }}
                >
                  <span className="progress-text">
                    {notebook.progress || 0}%
                  </span>
                </div>
              </div>
            </div>

            {currentStage && (
              <div className="current-stage-card">
                <h3>🌱 Giai Đoạn Hiện Tại: {currentStage.name}</h3>

                {/* Stage completion progress */}
                <div className="stage-completion-section">
                  <div className="stage-completion-header">
                    <span>Tiến độ giai đoạn</span>
                    <span className="completion-percent">
                      {notebook.stage_completion || 0}%
                    </span>
                  </div>
                  <div className="stage-completion-bar">
                    <div
                      className="stage-completion-fill"
                      style={{ width: `${notebook.stage_completion || 0}%` }}
                    />
                  </div>

                  {/* Daily progress breakdown */}
                  <div className="stage-progress-details">
                    <div className="progress-detail-item">
                      <span className="detail-label">
                        📅 Thời gian giai đoạn:
                      </span>
                      <span className="detail-value">
                        {currentStage
                          ? `${
                              currentStage.day_end - currentStage.day_start + 1
                            } ngày (Ngày ${currentStage.day_start}-${
                              currentStage.day_end
                            })`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="progress-detail-item">
                      <span className="detail-label">✅ Tiến độ hôm nay:</span>
                      <span className="detail-value">
                        {notebook.daily_checklist
                          ? `${
                              notebook.daily_checklist.filter(
                                (t) => t.is_completed
                              ).length
                            }/${notebook.daily_checklist.length} công việc`
                          : "0/0"}
                      </span>
                    </div>
                  </div>

                  {currentStageTracking?.pending_transition === true && (
                    <p className="completion-note">
                      🎉 Xuất sắc! Bạn đã hoàn thành giai đoạn này.
                    </p>
                  )}
                </div>

                <div className="stage-info">
                  <p>
                    <strong>Số ngày:</strong> Ngày {currentStage.day_start} -{" "}
                    {currentStage.day_end}
                  </p>
                  <p>
                    <strong>Dự kiến kết thúc:</strong> {getNextStageDate()}
                  </p>
                  <p className="stage-desc">{currentStage.description}</p>
                </div>

                {currentStage.stage_image && (
                  <div className="reference-image">
                    <h4>Hình Ảnh Tham Khảo</h4>
                    <img
                      src={currentStage.stage_image}
                      alt={currentStage.name}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="timeline-section">
              <h3>Dòng Thời Gian</h3>
              <NotebookTimeline notebookId={id} />
            </div>
          </div>
        )}

        {/* TAB 2: Checklist */}
        {activeTab === "checklist" && (
          <div className="checklist-tab">
            <div className="checklist-header">
              <h2>Công Việc Hàng Ngày</h2>
              <p className="checklist-description">
                Hoàn thành tất cả công việc để chuyển sang giai đoạn tiếp theo
              </p>
            </div>

            <DailyChecklist
              notebookId={id}
              onTaskComplete={fetchNotebookData}
            />
          </div>
        )}

        {/* TAB 3: Observations */}
        {activeTab === "observations" && (
          <div className="observations-tab">
            <div className="observations-header">
              <h2>Quan Sát Giai Đoạn</h2>
              <p className="observations-description">
                Ghi nhận các quan sát về cây trồng. Quan sát không ảnh hưởng đến
                tiến độ.
              </p>
            </div>

            <StageObservations notebookId={id} />
          </div>
        )}

        {/* TAB 4: Journal & Images */}
        {activeTab === "journal" && (
          <div className="journal-tab">
            <div className="journal-section">
              <h2>📝 Ghi Chú Cá Nhân</h2>
              <textarea
                className="journal-textarea"
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="Viết ghi chú về cây trồng của bạn..."
                rows={8}
              />
              <button className="btn btn-save" onClick={handleSaveJournal}>
                💾 Lưu Ghi Chú
              </button>
            </div>

            <div className="images-section">
              <h2>📷 Hình Ảnh</h2>

              <div className="image-upload">
                <ImageUploader
                  label="Thêm hình ảnh mới"
                  onImageSelect={handleAddImage}
                />
              </div>

              <div className="images-gallery">
                {notebook.images && notebook.images.length > 0 ? (
                  notebook.images.map((img, index) => (
                    <div key={index} className="gallery-item">
                      <img src={img} alt={`Image ${index + 1}`} />
                      <button
                        className="btn-remove-image"
                        onClick={() => handleRemoveImage(img)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-images">Chưa có hình ảnh nào</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overdue Popup */}
      {showOverduePopup && overdueSummary && (
        <OverduePopup
          overdueSummary={overdueSummary}
          notebookId={id}
          onSkip={handleSkipOverdue}
          onClose={() => setShowOverduePopup(false)}
        />
      )}
    </div>
  );
};

export default NotebookDetail;
