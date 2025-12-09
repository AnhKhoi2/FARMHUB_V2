import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import DailyChecklist from "../../components/farmer/DailyChecklist";
import StageObservations from "../../components/farmer/StageObservations";
import NotebookTimeline from "../../components/farmer/NotebookTimeline";
import ImageUploader from "../../components/farmer/ImageUploader";
import OverduePopup from "../../components/farmer/OverduePopup";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
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
  const [overdueData, setOverdueData] = useState(null);
  const [processingTask, setProcessingTask] = useState(null);

  useEffect(() => {
    if (id && id !== "undefined") {
      fetchNotebookData().then(() => {
        // Check daily status after notebook data is loaded
        // so we can check if notebook is completed
        checkDailyStatus();
      });

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
      return notebookData;
    } catch (err) {
      console.error("Error fetching notebook data:", err);
      setError("Không thể tải dữ liệu nhật ký");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const checkDailyStatus = async () => {
    try {
      const response = await notebookApi.getDailyStatus(id);
      const data = response.data?.data || response.data;

      // Hiển thị popup nếu có overdue VÀ notebook chưa hoàn thành 100%
      // Không hiển thị popup khi notebook đã hoàn thành (progress = 100%)
      if (data.overdue_summary && data.overdue_summary.overdue_count > 0) {
        // Check if notebook is completed (progress 100% and all stages completed)
        const notebookCompleted =
          notebook &&
          (notebook.progress === 100 || notebook.progress === "100") &&
          Array.isArray(notebook.stages_tracking) &&
          notebook.stages_tracking.length > 0 &&
          notebook.stages_tracking.every((s) => s.status === "completed");

        if (!notebookCompleted) {
          setOverdueSummary(data.overdue_summary);
          setShowOverduePopup(true);
        }
      }
    } catch (err) {
      console.error("Error checking daily status:", err);
    }
  };

  const fetchOverdueDetail = async () => {
    try {
      const response = await notebookApi.getOverdueDetail(id);
      const data = response.data?.data || response.data;
      setOverdueData(data);
      return data;
    } catch (err) {
      console.error("Error fetching overdue detail:", err);
      return null;
    }
  };

  const handleCompleteOverdueTask = async (taskName) => {
    try {
      setProcessingTask(taskName);
      await notebookApi.completeOverdueTask(id, taskName);
      const refreshed = await fetchOverdueDetail();
      setProcessingTask(null);
      await fetchNotebookData();
      if (!refreshed || refreshed.overdue_count === 0) {
        setActiveTab("progress");
      }
    } catch (err) {
      console.error("Error completing task:", err);
      alert("Không thể hoàn thành công việc");
      setProcessingTask(null);
    }
  };

  const handleSkipAllOverdue = async () => {
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
      setActiveTab("progress");
      await fetchNotebookData();
      await fetchOverdueDetail();
    } catch (err) {
      console.error("Error skipping overdue tasks:", err);
      alert("Không thể bỏ qua công việc");
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

  const handleExportExcel = async () => {
    try {
      if (!notebook) {
        alert("Không có dữ liệu để xuất Excel");
        return;
      }
      // Build CSV with multiple sections to match PDF content
      const escapeCSV = (val) => {
        const s = val === null || val === undefined ? "" : String(val);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const rows = [];

      // Header title
      rows.push([escapeCSV("NHẬT KÝ TRỒNG TRỌT")]);
      rows.push([""]); // empty line

      // Notebook overview
      rows.push([escapeCSV("Thông tin nhật ký")]);
      rows.push([
        escapeCSV("Tên nhật ký"),
        escapeCSV(notebook.notebook_name || ""),
      ]);
      rows.push([escapeCSV("Loại cây"), escapeCSV(notebook.plant_type || "")]);
      rows.push([
        escapeCSV("Ngày trồng"),
        escapeCSV(
          notebook.planted_date
            ? new Date(notebook.planted_date).toLocaleDateString("vi-VN")
            : ""
        ),
      ]);
      rows.push([
        escapeCSV("Tiến độ tổng thể"),
        escapeCSV(`${notebook.progress || 0}%`),
      ]);
      rows.push([
        escapeCSV("Giai đoạn hiện tại"),
        escapeCSV(notebook.current_stage || ""),
      ]);
      rows.push([
        escapeCSV("Tiến độ giai đoạn"),
        escapeCSV(`${notebook.stage_completion || 0}%`),
      ]);
      rows.push([""]);

      // Current stage details (if template available)
      if (template && template.stages && notebook.current_stage) {
        const current = template.stages[notebook.current_stage - 1];
        rows.push([escapeCSV("Giai đoạn hiện tại")]);
        rows.push([escapeCSV("Tên giai đoạn"), escapeCSV(current?.name || "")]);
        rows.push([
          escapeCSV("Thời gian"),
          escapeCSV(
            `Ngày ${current?.day_start || ""}-${current?.day_end || ""}`
          ),
        ]);
        if (current?.description) {
          rows.push([escapeCSV("Mô tả"), escapeCSV(current.description)]);
        }
        rows.push([""]);
      }

      // All stages
      rows.push([escapeCSV("TẤT CẢ CÁC GIAI ĐOẠN")]);
      // Helper to compute status similar to PDF
      const computeStatus = (stageIndex) => {
        const current = Number(notebook.current_stage || 0);
        const completion = Number(notebook.stage_completion || 0);
        if (stageIndex < current) return "Hoàn thành";
        if (stageIndex === current) {
          if (completion >= 100) return "Hoàn thành";
          if (completion > 0) return "Đang tiến hành";
          return "Chưa bắt đầu";
        }
        return "Chưa bắt đầu";
      };

      template?.stages?.forEach((stage, index) => {
        const idx = index + 1;
        rows.push([
          escapeCSV(`${idx}. ${stage.name}`),
          escapeCSV(
            `Thời gian: Ngày ${stage.day_start}-${stage.day_end} (${
              stage.day_end - stage.day_start + 1
            } ngày)`
          ),
          escapeCSV(computeStatus(idx)),
        ]);
      });

      rows.push([""]);

      // Personal journal
      rows.push([escapeCSV("GHI CHÚ CÁ NHÂN")]);
      rows.push([escapeCSV(notebook.description || "")]);
      rows.push([""]);

      // Images (list)
      const images = notebook.images || notebook.images_list || [];
      if (images && images.length > 0) {
        rows.push([escapeCSV("Hình ảnh")]);
        images.forEach((img) => rows.push([escapeCSV(img)]));
        rows.push([""]);
      }

      // Build CSV string
      const csvLines = rows.map((cols) => cols.join(","));
      const csvContent = "\uFEFF" + csvLines.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `notebook_${
        notebook.notebook_name
          ? notebook.notebook_name.replace(/\s+/g, "_")
          : notebook._id || id
      }.csv`;
      a.click();
      URL.revokeObjectURL(url);
      alert("✅ Đã xuất Excel (CSV) thành công");
    } catch (err) {
      console.error("Error exporting Excel:", err);
      alert("Không thể xuất Excel");
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
      <>
        <Header />
        <div className="notebook-detail-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !notebook) {
    return (
      <>
        <Header />
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
        <Footer />
      </>
    );
  }

  const currentStage = getCurrentStageInfo();
  const daysPlanted = calculateDaysPlanted();
  // Find stage tracking object for current stage (to check flags like pending_transition)
  const currentStageTracking = notebook?.stages_tracking?.find(
    (s) => s.stage_number === notebook.current_stage
  );

  return (
    <>
      <Header />
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
              📄 XUẤT PDF
            </button>
            <button
              className="btn-export-excel"
              onClick={handleExportExcel}
              title="Xuất nhật ký dưới dạng Excel (CSV)"
              style={{ marginLeft: 8 }}
            >
              📥 XUẤT EXCEL
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
              ✏️ CHỈNH SỬA
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDeleteNotebook()}
              title="Xóa nhật ký"
            >
              🗑️ XÓA
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
            {/* <span className="tab-icon">📈</span> */}
            Tiến Độ
          </button>
          <button
            className={`tab-btn ${activeTab === "checklist" ? "active" : ""}`}
            onClick={() => setActiveTab("checklist")}
          >
            {/* <span className="tab-icon">✅</span> */}
            Công Việc Hàng Ngày
          </button>
          <button
            className={`tab-btn ${
              activeTab === "observations" ? "active" : ""
            }`}
            onClick={() => setActiveTab("observations")}
          >
            {/* <span className="tab-icon">👁️</span> */}
            Quan Sát
          </button>
          <button
            className={`tab-btn ${activeTab === "journal" ? "active" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            {/* <span className="tab-icon">📔</span> */}
            Nhật Ký & Hình Ảnh
          </button>
          <button
            className={`tab-btn overdue-tab ${
              activeTab === "overdue" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("overdue");
              fetchOverdueDetail();
            }}
            title="Xem công việc quá hạn"
          >
            {/* <span className="tab-icon">⌛</span> */}
            Quá Hạn
            {overdueSummary && overdueSummary.overdue_count > 0 && (
              <span className="badge overdue-count">
                {overdueSummary.overdue_count}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* TAB 1: Progress */}
          {activeTab === "progress" && (
            <div className="progress-tab">
              <div className="progress-overview">
                <h2>TỔNG QUAN TIẾN ĐỘ</h2>
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
                  <h3>🌱 GIAI ĐOẠN HIỆN TẠI: {currentStage.name}</h3>

                  <div className="stage-card-content">
                    {/* Stage completion progress */}
                    <div className="stage-completion-section">
                      <div className="stage-completion-header">
                        <span>TIẾN ĐỘ GIAI ĐOẠN</span>
                        <span className="completion-percent">
                          {notebook.stage_completion || 0}%
                        </span>
                      </div>
                      <div className="stage-completion-bar">
                        <div
                          className="stage-completion-fill"
                          style={{
                            width: `${notebook.stage_completion || 0}%`,
                          }}
                        />
                      </div>
                      {/* Simple Tree Illustration */}
                      <div className="tree-illustration-container">
                        <div className="tree-scene">
                          {/* Ground */}
                          <div className="ground-layer"></div>

                          {/* Tree trunk */}
                          <div className="tree-trunk-main"></div>

                          {/* Tree crown layers */}
                          <div className="tree-crown crown-bottom"></div>
                          <div className="tree-crown crown-middle"></div>
                          <div className="tree-crown crown-top"></div>

                          {/* Fruits/flowers */}
                          <div className="tree-fruit fruit-1">🍎</div>
                          <div className="tree-fruit fruit-2">🍎</div>
                          <div className="tree-fruit fruit-3">🍎</div>

                          {/* Leaves accent */}
                          <div className="leaf-accent leaf-1">🍃</div>
                          <div className="leaf-accent leaf-2">🍃</div>

                          {/* Sky elements */}
                          {/* <div className="sky-bird">🐦</div> */}
                          <div className="sky-sun">☀️</div>
                        </div>
                        <p className="tree-description">
                          🌳 Cây xanh của bạn đang lớn mạnh
                        </p>
                      </div>{" "}
                      {/* Daily progress breakdown */}
                      <div className="stage-progress-details">
                        <div className="progress-detail-item">
                          <span className="detail-label">
                            📅 THỜI GIAN GIAI ĐOẠN:
                          </span>
                          <span className="detail-value">
                            {currentStage
                              ? `${
                                  currentStage.day_end -
                                  currentStage.day_start +
                                  1
                                } NGÀY (NGÀY ${currentStage.day_start}-${
                                  currentStage.day_end
                                })`
                              : "N/A"}
                          </span>
                        </div>
                        <div className="progress-detail-item">
                          {!(
                            notebook &&
                            (notebook.progress === 100 ||
                              notebook.progress === "100") &&
                            Array.isArray(notebook.stages_tracking) &&
                            notebook.stages_tracking.length > 0 &&
                            notebook.stages_tracking.every(
                              (s) => s.status === "completed"
                            )
                          ) && (
                            <>
                              <span className="detail-label">
                                ✅ TIẾN ĐỘ HÔM NAY:
                              </span>
                              <span className="detail-value">
                                {notebook.daily_checklist
                                  ? `${
                                      notebook.daily_checklist.filter(
                                        (t) => t.is_completed
                                      ).length
                                    }/${
                                      notebook.daily_checklist.length
                                    } CÔNG VIỆC`
                                  : "0/0"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {currentStageTracking?.pending_transition === true && (
                        <p className="completion-note">
                          🎉 XUẤT SẮC! BẠN ĐÃ HOÀN THÀNH GIAI ĐOẠN NÀY.
                        </p>
                      )}
                    </div>

                    <div className="stage-info-section">
                      <div className="stage-info">
                        <p>
                          <strong>NGÀY TRỒNG:</strong>{" "}
                          {notebook?.planted_date
                            ? formatVietnamLocale(notebook.planted_date)
                            : "N/A"}
                        </p>

                        <p>
                          <strong>SỐ NGÀY:</strong> NGÀY{" "}
                          {currentStage.day_start} - {currentStage.day_end}
                        </p>
                        <p>
                          <strong>DỰ KIẾN KẾT THÚC:</strong>{" "}
                          {getNextStageDate()}
                        </p>
                        {/* <p className="stage-desc">{currentStage.description}</p> */}
                      </div>

                      {currentStage.stage_image && (
                        <div className="reference-image">
                          <h4>HÌNH ẢNH THAM KHẢO</h4>
                          <img
                            src={currentStage.stage_image}
                            alt={currentStage.name}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="timeline-section">
                <h3>DÒNG THỜI GIAN</h3>
                <NotebookTimeline notebookId={id} />
              </div>
            </div>
          )}

          {/* TAB 2: Checklist */}
          {activeTab === "checklist" && (
            <div className="checklist-tab">
              <div className="checklist-header">
                <h2>CÔNG VIỆC HÀNG NGÀY</h2>
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
                <h2>QUAN SÁT GIAI ĐOẠN</h2>
                <p className="observations-description">
                  Ghi nhận các quan sát về cây trồng trong từng giai đoạn phát
                  triển.
                </p>
              </div>

              <StageObservations notebookId={id} />
            </div>
          )}

          {/* TAB 4: Journal & Images */}
          {activeTab === "journal" && (
            <div className="journal-tab">
              <div className="journal-section">
                <h2>📝 GHI CHÚ CÂY TRỒNG</h2>
                <textarea
                  className="journal-textarea"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="Viết ghi chú về cây trồng của bạn..."
                  rows={8}
                />
                <button className="btn btn-save" onClick={handleSaveJournal}>
                  💾 LƯU GHI CHÚ
                </button>
              </div>

              <div className="images-section">
                <h2>📷 HÌNH ẢNH</h2>

                <div className="image-upload">
                  <ImageUploader
                    label="THÊM HÌNH ẢNH MỚI"
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

          {/* TAB 5: Overdue */}
          {activeTab === "overdue" && (
            <div className="overdue-tab">
              <div className="overdue-header">
                <h2>⌛ CÔNG VIỆC QUÁ HẠN</h2>
                {overdueData && overdueData.overdue_count > 0 && (
                  <div className="overdue-actions">
                    <button
                      onClick={handleSkipAllOverdue}
                      className="btn-skip-all"
                    >
                      <span className="btn-icon">✓</span>
                      BỎ QUA TẤT CẢ
                    </button>
                  </div>
                )}
              </div>

              {!overdueData ? (
                <div className="loading">ĐANG TẢI...</div>
              ) : overdueData.overdue_count === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✓</span>
                  <h3>KHÔNG CÓ CÔNG VIỆC QUÁ HẠN</h3>
                  <p>TẤT CẢ CÔNG VIỆC ĐÃ ĐƯỢC HOÀN THÀNH HOẶC BỎ QUA</p>
                </div>
              ) : (
                <div className="overdue-tasks-list">
                  {overdueData.overdue_groups &&
                  overdueData.overdue_groups.length > 0
                    ? overdueData.overdue_groups.map((group, gIdx) => (
                        <div key={gIdx} className="overdue-group">
                          <div className="overdue-group-header">
                            <h4>NGÀY: {formatVietnamLocale(group.date)}</h4>
                            <span
                              className="group-count"
                              style={{
                                backgroundColor: "#ff6b6b",
                                color: "white",
                                padding: "6px 16px",
                                borderRadius: "20px",
                                fontWeight: "bold",
                                fontSize: "14px",
                                display: "inline-block",
                                boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
                              }}
                            >
                              {group.tasks.length} CÔNG VIỆC
                            </span>
                          </div>

                          {group.tasks.map((task, index) => (
                            <div key={index} className="overdue-task-card">
                              <div className="task-header">
                                <div className="task-info">
                                  <h3 className="task-name">
                                    {(task.task_name || "").toUpperCase()}
                                  </h3>
                                  <span
                                    className={`task-priority priority-${task.priority}`}
                                  >
                                    {task.priority === "high"
                                      ? "CAO"
                                      : task.priority === "medium"
                                      ? "TRUNG BÌNH"
                                      : "THẤP"}
                                  </span>
                                </div>
                                <span className="task-status overdue">
                                  QUÁ HẠN
                                </span>
                              </div>

                              {task.description && (
                                <p className="task-description">
                                  {task.description}
                                </p>
                              )}

                              <div className="task-meta">
                                <span className="task-frequency">
                                  📅{" "}
                                  {task.frequency === "daily"
                                    ? "HÀNG NGÀY"
                                    : (task.frequency || "").toUpperCase()}
                                </span>
                                {task.overdue_at && (
                                  <span className="task-overdue-date">
                                    ⏰ QUÁ HẠN TỪ:{" "}
                                    {formatVietnamLocale(task.overdue_at)}
                                  </span>
                                )}
                              </div>

                              <div className="task-actions">
                                <button
                                  onClick={() =>
                                    handleCompleteOverdueTask(task.task_name)
                                  }
                                  className="btn-complete-task"
                                  disabled={
                                    task.is_completed ||
                                    processingTask === task.task_name
                                  }
                                >
                                  {task.is_completed ? (
                                    <>
                                      <span className="btn-icon">✓</span>
                                      ĐÃ HOÀN THÀNH
                                    </>
                                  ) : processingTask === task.task_name ? (
                                    <>
                                      <span className="btn-icon">⏳</span>
                                      ĐANG XỬ LÝ...
                                    </>
                                  ) : (
                                    <>
                                      <span className="btn-icon">✓</span>
                                      HOÀN THÀNH BÙ
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    : overdueData.overdue_tasks?.map((task, index) => (
                        <div key={index} className="overdue-task-card">
                          <div className="task-header">
                            <div className="task-info">
                              <h3 className="task-name">
                                {(task.task_name || "").toUpperCase()}
                              </h3>
                              <span
                                className={`task-priority priority-${task.priority}`}
                              >
                                {task.priority === "high"
                                  ? "CAO"
                                  : task.priority === "medium"
                                  ? "TRUNG BÌNH"
                                  : "THẤP"}
                              </span>
                            </div>
                            <span className="task-status overdue">QUÁ HẠN</span>
                          </div>

                          {task.description && (
                            <p className="task-description">
                              {task.description}
                            </p>
                          )}

                          <div className="task-meta">
                            <span className="task-frequency">
                              📅{" "}
                              {task.frequency === "daily"
                                ? "HÀNG NGÀY"
                                : (task.frequency || "").toUpperCase()}
                            </span>
                            {task.overdue_at && (
                              <span className="task-overdue-date">
                                ⏰ QUÁ HẠN TỪ:{" "}
                                {formatVietnamLocale(task.overdue_at)}
                              </span>
                            )}
                          </div>

                          <div className="task-actions">
                            <button
                              onClick={() =>
                                handleCompleteOverdueTask(task.task_name)
                              }
                              className="btn-complete-task"
                              disabled={
                                task.is_completed ||
                                processingTask === task.task_name
                              }
                            >
                              {task.is_completed ? (
                                <>
                                  <span className="btn-icon">✓</span>
                                  ĐÃ HOÀN THÀNH
                                </>
                              ) : processingTask === task.task_name ? (
                                <>
                                  <span className="btn-icon">⏳</span>
                                  ĐANG XỬ LÝ...
                                </>
                              ) : (
                                <>
                                  <span className="btn-icon">✓</span>
                                  HOÀN THÀNH BÙ
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                </div>
              )}
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
            onViewDetail={() => {
              setActiveTab("overdue");
              fetchOverdueDetail();
            }}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default NotebookDetail;
