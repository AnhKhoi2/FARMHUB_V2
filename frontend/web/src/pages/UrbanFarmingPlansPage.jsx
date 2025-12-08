import React, { useEffect, useState } from "react";
import UrbanFarmingApi from "../api/urbanFarmingApi.js"; // ⭐ Dùng API riêng thay cho axiosClient
import "../css/UrbanFarmingPlansPage.css";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import { IoTrashOutline, IoArrowUndoOutline } from "react-icons/io5";

const EXPERIENCE_OPTIONS = [
  { value: "newbie", label: "Mới bắt đầu" },
  { value: "intermediate", label: "Có chút kinh nghiệm" },
  { value: "advanced", label: "Lành nghề" },
];

const WIND_OPTIONS = [
  { value: "Ít gió", label: "Ít gió" },
  { value: "Gió vừa", label: "Gió vừa" },
  { value: "Gió mạnh", label: "Gió mạnh" },
];

const SUN_ORIENT_OPTIONS = [
  { value: "Bắc", label: "Bắc" },
  { value: "Đông Bắc", label: "Đông Bắc" },
  { value: "Đông", label: "Đông" },
  { value: "Đông Nam", label: "Đông Nam" },
  { value: "Nam", label: "Nam" },
  { value: "Tây Nam", label: "Tây Nam" },
  { value: "Tây", label: "Tây" },
  { value: "Tây Bắc", label: "Tây Bắc" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Đang dùng" },
  { value: "deleted", label: "Đã xóa" },
  { value: "all", label: "Tất cả" },
];

const months = [
  { value: 1, label: "Tháng 1" },
  { value: 2, label: "Tháng 2" },
  { value: 3, label: "Tháng 3" },
  { value: 4, label: "Tháng 4" },
  { value: 5, label: "Tháng 5" },
  { value: 6, label: "Tháng 6" },
  { value: 7, label: "Tháng 7" },
  { value: 8, label: "Tháng 8" },
  { value: 9, label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

function UrbanFarmingPlansPage() {
  // ------- FORM STATE -------
  const [spaceType, setSpaceType] = useState("");
  const [areaM2, setAreaM2] = useState("1.8");
  const [shape, setShape] = useState("");
  const [heightGuardrailCm, setHeightGuardrailCm] = useState("110");
  const [hasRoof, setHasRoof] = useState(true);
  const [windExposure, setWindExposure] = useState("Gió vừa");
  const [sunHoursSummer, setSunHoursSummer] = useState("4.5");
  const [sunHoursWinter, setSunHoursWinter] = useState("2.5");
  const [sunOrientation, setSunOrientation] = useState("Đông Nam");
  const [waterAccess, setWaterAccess] = useState("");
  const [drainageOk, setDrainageOk] = useState(""); // free-text
  const [powerOutlet, setPowerOutlet] = useState(false);

  const [timeBudget, setTimeBudget] = useState("1"); // giờ/tuần
  const [maintenanceStyle, setMaintenanceStyle] = useState(""); // free-text
  const [budgetVnd, setBudgetVnd] = useState("1500000");
  const [ongoingBudgetVnd, setOngoingBudgetVnd] = useState("150000");
  const [goalsText, setGoalsText] = useState(""); // free-text (comma separated)
  const [yieldPriority, setYieldPriority] = useState("4");
  const [aestheticPriority, setAestheticPriority] = useState("3");
  const [learningPriority, setLearningPriority] = useState("2");
  const [organicPref, setOrganicPref] = useState(true);
  const [waterSavingPref, setWaterSavingPref] = useState(true);

  const [locality, setLocality] = useState("Cần Thơ");
  const [seasonStartMonth, setSeasonStartMonth] = useState(12);
  const [experienceLevel, setExperienceLevel] = useState("newbie");
  const [customTitle, setCustomTitle] = useState("");

  // ------- LIST & DETAIL STATE -------
  const [statusFilter, setStatusFilter] = useState("active");
  const [plans, setPlans] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanDetail, setSelectedPlanDetail] = useState(null);

  // ------- UI STATE -------
  const [loadingList, setLoadingList] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingSoftDelete, setLoadingSoftDelete] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  // Lỗi chung (token, server...) – banner ngoài page
  const [pageError, setPageError] = useState("");
  // Lỗi form trong modal khảo sát
  const [formError, setFormError] = useState("");
  // Lỗi khi gửi AI trong modal tổng hợp
  const [summaryError, setSummaryError] = useState("");

  const [successMsg, setSuccessMsg] = useState("");

  const [showFormModal, setShowFormModal] = useState(false); // modal form

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Summary modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [pendingBody, setPendingBody] = useState(null);

  // ------- HELPERS -------
  const fetchPlans = async (pageOverride) => {
    setLoadingList(true);
    setPageError("");
    try {
      const res = await UrbanFarmingApi.getPlans({
        status: statusFilter,
        page: pageOverride ?? page,
        limit,
      });

      setPlans(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] fetchPlans error:", err);
      setPageError(
        err.response?.data?.message ||
          "Không tải được danh sách gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingList(false);
    }
  };

  const fetchPlanDetail = async (id) => {
    setLoadingDetail(true);
    setPageError("");
    setSelectedPlanDetail(null);
    try {
      const res = await UrbanFarmingApi.getPlanDetail(id);
      setSelectedPlanDetail(res.data.data);
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] fetchPlanDetail error:", err);
      setPageError(
        err.response?.data?.message ||
          "Không tải được chi tiết gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  // ------- EFFECT: load list -------
  useEffect(() => {
    fetchPlans(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  // ------- BUILD BODY -------
  const buildRequestBody = () => {
    const goalsArray = goalsText
      ? goalsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return {
      title: customTitle || undefined,
      space_type: spaceType,
      area_m2: areaM2 ? Number(areaM2) : undefined,
      shape,
      height_guardrail_cm: heightGuardrailCm
        ? Number(heightGuardrailCm)
        : undefined,
      has_roof: hasRoof,
      wind_exposure: windExposure,
      sun_hours_summer: sunHoursSummer ? Number(sunHoursSummer) : undefined,
      sun_hours_winter: sunHoursWinter ? Number(sunHoursWinter) : undefined,
      sun_orientation: sunOrientation,
      water_access: waterAccess,
      drainage_ok: drainageOk,
      power_outlet: powerOutlet,

      time_budget_hours_per_week: timeBudget ? Number(timeBudget) : undefined,
      maintenance_style: maintenanceStyle,
      budget_vnd: budgetVnd ? Number(budgetVnd) : undefined,
      ongoing_budget_vnd_per_month: ongoingBudgetVnd
        ? Number(ongoingBudgetVnd)
        : undefined,
      goals: goalsArray,
      yield_priority: yieldPriority ? Number(yieldPriority) : undefined,
      aesthetic_priority: aestheticPriority
        ? Number(aestheticPriority)
        : undefined,
      learning_priority: learningPriority
        ? Number(learningPriority)
        : undefined,
      organic_pref: organicPref,
      water_saving_pref: waterSavingPref,

      locality,
      season_start_month: Number(seasonStartMonth),
      experience_level: experienceLevel,
    };
  };

  // ------- HANDLERS -------

  // Khi bấm "Xem tổng hợp" ở bước cuối
  const handleOpenSummary = () => {
    setFormError("");
    setSummaryError("");

    // validate tối thiểu
    if (!spaceType || !locality) {
      setFormError("Vui lòng nhập Loại không gian và Khu vực / Thành phố.");
      return;
    }

    const body = buildRequestBody();
    setPendingBody(body);

    // Ẩn modal form phía sau, chỉ hiện modal tóm tắt
    setShowFormModal(false);
    setShowSummaryModal(true);
  };

  // Khi bấm "Xong – Gửi AI phân tích" ở modal tổng hợp
  const handleConfirmSubmit = async () => {
    const body = pendingBody || buildRequestBody();

    setLoadingCreate(true);
    setSummaryError("");
    // Không động vào pageError ở đây, để lỗi token cũ vẫn giữ nếu có
    setSuccessMsg("");

    try {
      const res = await UrbanFarmingApi.createPlan(body);
      const created = res.data.data;

      setSuccessMsg("Đã tạo gợi ý mới thành công.");
      setPageError("");

      if (statusFilter === "active" || statusFilter === "all") {
        setPlans((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
      }
      setSelectedPlanId(created._id);
      setSelectedPlanDetail(created);

      // đóng modal & reset wizard
      setShowSummaryModal(false);
      setShowFormModal(false);
      setWizardStep(1);
      setPendingBody(null);
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] create plan error:", err);
      const status = err.response?.status;
      const msg = err.response?.data?.message;

      // Lỗi token / quyền → banner ngoài page
      if (
        status === 401 ||
        status === 403 ||
        (msg && msg.toLowerCase().includes("token"))
      ) {
        setPageError(
          msg || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        );
      } else {
        // Lỗi khác (validate BE, dữ liệu...) → hiển thị ngay trong modal tổng hợp
        setSummaryError(
          msg || "Không tạo được gợi ý. Vui lòng kiểm tra lại thông tin."
        );
      }
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleChangePage = async (newPage) => {
    if (newPage < 1) return;
    const maxPage = Math.max(1, Math.ceil(total / limit));
    if (newPage > maxPage) return;
    setPage(newPage);
    fetchPlans(newPage);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId);
    fetchPlanDetail(planId);
  };

  const handleSoftDelete = async (planId) => {
    if (!window.confirm("Bạn có chắc muốn xóa mềm gợi ý này?")) return;
    setLoadingSoftDelete(true);
    setPageError("");
    setSuccessMsg("");
    try {
      const res = await UrbanFarmingApi.softDelete(planId);
      const updated = res.data.data;

      setSuccessMsg("Đã xóa mềm gợi ý.");
      setPlans((prev) =>
        prev.map((p) => (p._id === planId ? { ...p, ...updated } : p))
      );

      if (statusFilter === "active") {
        setPlans((prev) => prev.filter((p) => p._id !== planId));
        setTotal((prev) => Math.max(0, prev - 1));
      }

      if (selectedPlanId === planId) {
        setSelectedPlanDetail((prev) =>
          prev ? { ...prev, ...updated } : prev
        );
      }
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] softDelete error:", err);
      setPageError(
        err.response?.data?.message || "Không xóa được gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingSoftDelete(false);
    }
  };

  const handleRestore = async (planId) => {
    setLoadingRestore(true);
    setPageError("");
    setSuccessMsg("");
    try {
      const res = await UrbanFarmingApi.restore(planId);
      const updated = res.data.data;

      setSuccessMsg("Đã khôi phục gợi ý.");
      setPlans((prev) =>
        prev.map((p) => (p._id === planId ? { ...p, ...updated } : p))
      );

      if (selectedPlanId === planId) {
        setSelectedPlanDetail((prev) =>
          prev ? { ...prev, ...updated } : prev
        );
      }
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] restore error:", err);
      setPageError(
        err.response?.data?.message ||
          "Không khôi phục được gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingRestore(false);
    }
  };

  // ------- RENDER HELPERS -------
  const renderStatusBadge = (status) => {
    if (status === "deleted") {
      return <span className="badge badge-danger">Đã xóa</span>;
    }
    return <span className="badge badge-success">Đang dùng</span>;
  };

  const formatDateTime = (str) => {
    if (!str) return "";
    try {
      const d = new Date(str);
      return d.toLocaleString("vi-VN");
    } catch {
      return str;
    }
  };
  const renderStepHintCard = () => {
    let title = "";
    let lines = [];

    if (wizardStep === 1) {
      title = "Gợi ý điền bước 1 – Không gian & ánh sáng";
      lines = [
        "Ở mục “Loại không gian”, hãy nhập bạn trồng ở đâu (sân thượng, sân vườn, ban công, hiên nhà, đất trống...).",
        "Diện tích chỉ cần ước lượng gần đúng, không cần chính xác tuyệt đối.",
        "Hình dạng, cao lan can, mái che và mức gió giúp AI hiểu mức nắng và độ an toàn khi đặt chậu/kệ.",
      ];
    } else if (wizardStep === 2) {
      title = "Gợi ý điền bước 2 – Nước, thoát nước & thời gian chăm";
      lines = [
        "Mục nguồn nước: ghi rõ bạn lấy nước ở đâu (vòi gần, xách nước từ trong nhà, dùng bồn chứa...).",
        "Thoát nước: mô tả khu vực có dễ đọng nước hay thoát tốt, để AI tránh gợi ý mô hình dễ gây ngập.",
        "Thời gian chăm (giờ/tuần) chỉ cần ước lượng bạn rảnh khoảng bao nhiêu giờ mỗi tuần cho việc chăm cây.",
      ];
    } else if (wizardStep === 3) {
      title = "Gợi ý điền bước 3 – Ngân sách & mục tiêu";
      lines = [
        "Ngân sách đầu tư ban đầu là số tiền bạn dự kiến chi cho chậu, đất, giống, dụng cụ cơ bản.",
        "Ngân sách duy trì là số tiền mỗi tháng bạn thấy thoải mái cho phân bón, giống bổ sung...",
        "Mục tiêu chính và mức độ ưu tiên (1–5) giúp AI hiểu bạn ưu tiên sản lượng, thẩm mỹ hay học hỏi.",
      ];
    } else if (wizardStep === 4) {
      title = "Gợi ý điền bước 4 – Ưu tiên & khu vực";
      lines = [
        "Ưu tiên hữu cơ/tiết kiệm nước: chọn theo thói quen sinh hoạt và điều kiện gia đình.",
        "Khu vực / thành phố giúp AI xác định vùng khí hậu và mùa vụ phù hợp cho Việt Nam.",
        "Tháng bắt đầu dự kiến là thời điểm bạn định bắt đầu trồng, AI sẽ gợi ý cây & lịch chăm phù hợp.",
        "Mức kinh nghiệm giúp AI không gợi ý mô hình quá phức tạp nếu bạn mới bắt đầu.",
      ];
    }

    if (!title) return null;

    return (
      <div
        style={{
          background: "#f0fdf4",
          borderRadius: "10px",
          padding: "8px 10px",
          marginBottom: "10px",
          border: "1px solid #bbf7d0",
          fontSize: 12,
        }}
      >
        <div
          style={{
            fontWeight: 600,
            marginBottom: 4,
            color: "#166534",
          }}
        >
          {title}
        </div>
        <ul style={{ margin: 0, paddingLeft: "18px" }}>
          {lines.map((line, idx) => (
            <li key={idx} style={{ marginBottom: 2 }}>
              {line}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ------- JSX -------
  return (
    <>
      <Header />

      <div
        className="urban-farming-page"
        style={{
          padding: "20px",
          background:
            "linear-gradient(90deg, rgb(232, 245, 233), rgb(227, 242, 253))",
        }}
      >
        <div className="uf-header-bar">
          <div>
            <h1 style={{ fontWeight: 700, fontSize: "26px" }}>
              Gợi Ý Mô Hình Trồng Trọt & Cây Trồng
            </h1>
            <p className="uf-header-subtitle">
              Không biết bắt đầu từ đâu? AI ( Trí tuệ nhân tạo ) sẽ dựa vào thông tin bạn cung cấp để
              gợi ý mô hình trồng và danh sách cây phù hợp với không gian của
              bạn.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary_sb"
            onClick={() => {
              setShowFormModal(true);
              setWizardStep(1);
              setShowSummaryModal(false);
              setPendingBody(null);
              setFormError("");
              setSummaryError("");
            }}
          >
            + Tạo gợi ý mới
          </button>
        </div>

        {/* Thông báo ngoài page: lỗi token/server + success */}
        {(pageError || successMsg) && (
          <div style={{ marginBottom: "12px" }}>
            {pageError && (
              <div
                style={{
                  background: "#ffe5e5",
                  color: "#b30000",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                }}
              >
                {pageError}
              </div>
            )}
            {successMsg && (
              <div
                style={{
                  background: "#e5ffe7",
                  color: "#065a18",
                  padding: "8px 12px",
                  borderRadius: "6px",
                }}
              >
                {successMsg}
              </div>
            )}
          </div>
        )}

        {/* LIST trên – DETAIL dưới */}
        <div className="urban-farming-layout">
          {/* LIST */}
          <div
            className="card"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #e3e3e3",
              maxHeight: "300px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <h3 style={{ fontSize: "16px", margin: 0 }}>DANH SÁCH GỢI Ý</h3>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  fontSize: 12,
                }}
              >
                <span>Lọc:</span>
                <select
                  className="form-control"
                  style={{ width: "150px" }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingList ? (
              <div style={{ padding: "8px 0" }}>Đang tải danh sách...</div>
            ) : plans.length === 0 ? (
              <div
                style={{ padding: "8px 0", fontSize: "13px", color: "#555" }}
              >
                Chưa có gợi ý nào. Nhấn <strong>“Tạo gợi ý mới”</strong> ở góc
                trên bên phải để tạo.
              </div>
            ) : (
              <>
                <div
                  style={{
                    overflowY: "auto",
                    flex: 1,
                    borderTop: "1px solid #eee",
                    borderBottom: "1px solid #eee",
                    marginTop: "4px",
                  }}
                >
                  {plans.map((p) => (
                    <div
                      key={p._id}
                      className="plan-item"
                      style={{
                        padding: "8px 4px",
                        borderBottom: "1px solid #f0f0f0",
                        cursor: "pointer",
                        background:
                          selectedPlanId === p._id ? "#f2faf3" : "transparent",
                      }}
                      onClick={() => handleSelectPlan(p._id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                            }}
                          >
                            {p.title || "Gợi ý không tên"}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              marginTop: "2px",
                            }}
                          >
                            Mô hình chính:{" "}
                            <strong>{p.main_model_id || "--"}</strong> • Tạo lúc{" "}
                            {formatDateTime(p.createdAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          {renderStatusBadge(p.status)}
                          <div style={{ marginTop: "4px" }}>
                            {p.status === "active" ? (
                              <button
                                type="button"
                                className="btn btn-link btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSoftDelete(p._id);
                                }}
                                disabled={loadingSoftDelete}
                                aria-label="Xóa mềm"
                              >
                                <IoTrashOutline
                                  style={{
                                    verticalAlign: "middle",
                                    marginRight: 6,
                                  }}
                                />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-link btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(p._id);
                                }}
                                disabled={loadingRestore}
                                aria-label="Khôi phục"
                              >
                                <IoArrowUndoOutline
                                  style={{
                                    verticalAlign: "middle",
                                    marginRight: 6,
                                  }}
                                />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* pagination */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "6px",
                    fontSize: "12px",
                  }}
                >
                  <span>
                    Tổng: <strong>{total}</strong> gợi ý
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleChangePage(page - 1)}
                    >
                      &lt;
                    </button>
                    <span>
                      Trang {page}/{Math.max(1, Math.ceil(total / limit))}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleChangePage(page + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* DETAIL */}
          <div
            className="card"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #e3e3e3",
              minHeight: "220px",
            }}
          >
            <h3 style={{ fontSize: "16px", marginBottom: "8px" }}>
              CHI TIẾT GỢI Ý
            </h3>

            {!selectedPlanId && (
              <div style={{ fontSize: "13px", color: "#666" }}>
                Hãy chọn một gợi ý ở danh sách bên cạnh để xem chi tiết.
              </div>
            )}

            {selectedPlanId && loadingDetail && <div>Đang tải chi tiết...</div>}

            {selectedPlanId && !loadingDetail && selectedPlanDetail && (
              <div style={{ fontSize: "13px" }}>
                <h4 style={{ fontSize: "15px", marginBottom: "4px" }}>
                  {selectedPlanDetail.title || "Gợi ý không tên"}
                </h4>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  Vùng khí hậu:{" "}
                  <strong>
                    {selectedPlanDetail.climate_zone_vn || "Không rõ"}
                  </strong>{" "}
                  • Tạo lúc {formatDateTime(selectedPlanDetail.createdAt)}
                </div>

                {/* Risks */}
                {Array.isArray(selectedPlanDetail.aiResult?.risks) &&
                  selectedPlanDetail.aiResult.risks.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Rủi ro / lưu ý:</strong>
                      <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                        {selectedPlanDetail.aiResult.risks.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Top models */}
                {Array.isArray(selectedPlanDetail.aiResult?.top_models) &&
                  selectedPlanDetail.aiResult.top_models.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Mô hình gợi ý:</strong>
                      <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                        {selectedPlanDetail.aiResult.top_models.map(
                          (m, idx) => (
                            <li key={idx}>
                              <div>
                                <strong>{m.model_id}</strong> (điểm phù hợp:{" "}
                                {typeof m.fit_score === "number"
                                  ? `${m.fit_score}%`
                                  : m.fit_score}
                                )
                              </div>
                              {m.reason_vi && <div>- Lý do: {m.reason_vi}</div>}
                              {m.notes_layout_vi && (
                                <div>- Gợi ý bố trí: {m.notes_layout_vi}</div>
                              )}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Crop suggestions */}
                {Array.isArray(selectedPlanDetail.aiResult?.crop_suggestions) &&
                  selectedPlanDetail.aiResult.crop_suggestions.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Cây trồng gợi ý:</strong>
                      <table
                        className="table table-sm"
                        style={{ marginTop: "4px" }}
                      >
                        <thead>
                          <tr>
                            <th>Tên cây</th>
                            <th>Mùa</th>
                            <th>Giờ nắng tối thiểu/ngày</th>
                            <th>Chậu (L)</th>
                            <th>Ngày thu hoạch</th>
                            <th>Lý do phù hợp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPlanDetail.aiResult.crop_suggestions.map(
                            (c, idx) => (
                              <tr key={idx}>
                                <td>{c.crop}</td>
                                <td>{c.season}</td>
                                <td>{c.light_need_DLI}</td>
                                <td>{c.container_size_l}</td>
                                <td>{c.days_to_harvest}</td>
                                <td style={{ maxWidth: 220 }}>{c.reason_vi}</td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                {/* Calendar */}
                {Array.isArray(selectedPlanDetail.aiResult?.calendar) &&
                  selectedPlanDetail.aiResult.calendar.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Lịch 6 tuần đầu:</strong>
                      <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                        {selectedPlanDetail.aiResult.calendar.map((w, idx) => (
                          <li key={idx}>
                            Tuần {w.week}: {w.milestone}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Upgrades */}
                {Array.isArray(
                  selectedPlanDetail.aiResult?.upgrades_after_3m
                ) &&
                  selectedPlanDetail.aiResult.upgrades_after_3m.length > 0 && (
                    <div style={{ marginBottom: "4px" }}>
                      <strong>Nâng cấp sau 3 tháng:</strong>
                      <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                        {selectedPlanDetail.aiResult.upgrades_after_3m.map(
                          (u, idx) => (
                            <li key={idx}>{u}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Warning nếu có */}
                {selectedPlanDetail.aiResult?.warning && (
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "12px",
                      color: "#b36b00",
                    }}
                  >
                    Cảnh báo: {selectedPlanDetail.aiResult.warning}
                  </div>
                )}
              </div>
            )}

            {selectedPlanId && !loadingDetail && !selectedPlanDetail && (
              <div>Không tìm thấy chi tiết gợi ý.</div>
            )}
          </div>
        </div>

        {/* MODAL FORM TẠO GỢI Ý - WIZARD */}
        {showFormModal && (
          <div
            className="uf-modal-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 2000,
            }}
          >
            <div
              className="uf-modal-content"
              style={{
                background: "#ffffff",
                borderRadius: "14px",
                width: "min(960px, 96%)",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
                padding: "16px 20px 20px",
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 18,
                      margin: 0,
                      color: "#064e3b",
                    }}
                  >
                     Tìm Kiếm Mô Hình Trồng Phù Hợp
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      margin: "2px 0 0",
                    }}
                  >
                    Vui lòng điền thông tin theo từng bước bên dưới.
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#4b5563",
                      margin: "4px 0 0",
                    }}
                  >
                    Bước {wizardStep}/{TOTAL_STEPS}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFormModal(false);
                    setWizardStep(1);
                    setFormError("");
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 20,
                    cursor: "pointer",
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <hr style={{ margin: "8px 0 12px" }} />

              {/* Card hướng dẫn điền form theo từng bước */}
              {renderStepHintCard()}
              {/* Lỗi form trong modal */}
              {formError && (
                <div
                  style={{
                    background: "#ffe5e5",
                    color: "#b30000",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    fontSize: 12,
                  }}
                >
                  {formError}
                </div>
              )}

              {/* FORM TRONG MODAL (ngăn submit mặc định) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                {/* Tên gợi ý (đặt ở trên, luôn hiển thị) */}
                <div className="form-group">
                  <label className="form-label">Tên gợi ý (tùy chọn)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Vườn rau sân sau HCM bắt đầu tháng 12"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                {/* STEP 1: Không gian & nắng */}
                {wizardStep === 1 && (
                  <>
                    <h4
                      style={{
                        fontSize: 14,
                        marginTop: 10,
                        marginBottom: 8,
                        color: "#065f46",
                      }}
                    >
                      Bước 1: Không gian trồng & ánh sáng
                    </h4>

                    <div
                      className="form-row"
                      style={{ display: "flex", gap: "12px" }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          1. Loại không gian *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: sân vườn, sân thượng, ban công, đất trống..."
                          value={spaceType}
                          onChange={(e) => setSpaceType(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          2. Diện tích (m²){" "}
                          <span style={{ fontSize: 12 }}>(ước lượng)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          className="form-control"
                          value={areaM2}
                          onChange={(e) => setAreaM2(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">3. Hình dạng</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: dài-hẹp, gần vuông, không đều..."
                          value={shape}
                          onChange={(e) => setShape(e.target.value)}
                        />
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          4. Cao lan can (cm){" "}
                          <span style={{ fontSize: 12 }}>(nếu có)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-control"
                          value={heightGuardrailCm}
                          onChange={(e) => setHeightGuardrailCm(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">5. Có mái che?</label>
                        <select
                          className="form-control"
                          value={hasRoof ? "true" : "false"}
                          onChange={(e) =>
                            setHasRoof(e.target.value === "true")
                          }
                        >
                          <option value="true">Có</option>
                          <option value="false">Không</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">6. Độ gió</label>
                        <select
                          className="form-control"
                          value={windExposure}
                          onChange={(e) => setWindExposure(e.target.value)}
                        >
                          {WIND_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          7. Giờ nắng mùa khô / hè (giờ/ngày)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className="form-control"
                          value={sunHoursSummer}
                          onChange={(e) => setSunHoursSummer(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          8. Giờ nắng mùa mưa / đông (giờ/ngày)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className="form-control"
                          value={sunHoursWinter}
                          onChange={(e) => setSunHoursWinter(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          9. Hướng nắng chính
                        </label>
                        <select
                          className="form-control"
                          value={sunOrientation}
                          onChange={(e) => setSunOrientation(e.target.value)}
                        >
                          {SUN_ORIENT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 2: Nước, thoát nước, điện, thời gian & mức độ chăm */}
                {wizardStep === 2 && (
                  <>
                    <h4
                      style={{
                        fontSize: 14,
                        marginTop: 10,
                        marginBottom: 8,
                        color: "#065f46",
                      }}
                    >
                      Bước 2: Nước, thoát nước & thời gian chăm
                    </h4>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">10. Nguồn nước</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: vòi nước gần, xách nước, lấy trong nhà..."
                          value={waterAccess}
                          onChange={(e) => setWaterAccess(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          11. Thoát nước (mô tả)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: thoát tốt, dễ đọng nước, không rõ..."
                          value={drainageOk}
                          onChange={(e) => setDrainageOk(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          12. Có ổ điện ngoài trời?
                        </label>
                        <select
                          className="form-control"
                          value={powerOutlet ? "true" : "false"}
                          onChange={(e) =>
                            setPowerOutlet(e.target.value === "true")
                          }
                        >
                          <option value="false">Không</option>
                          <option value="true">Có</option>
                        </select>
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          13. Thời gian chăm (giờ/tuần)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          className="form-control"
                          value={timeBudget}
                          onChange={(e) => setTimeBudget(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 2 }}>
                        <label className="form-label">
                          14. Mức độ chịu khó chăm
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: ít, trung bình, chịu khó..."
                          value={maintenanceStyle}
                          onChange={(e) => setMaintenanceStyle(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 3: Ngân sách, mục tiêu & ưu tiên */}
                {wizardStep === 3 && (
                  <>
                    <h4
                      style={{
                        fontSize: 14,
                        marginTop: 10,
                        marginBottom: 8,
                        color: "#065f46",
                      }}
                    >
                      Bước 3: Ngân sách & mục tiêu
                    </h4>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          15. Ngân sách đầu tư ban đầu (VND)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          className="form-control"
                          value={budgetVnd}
                          onChange={(e) => setBudgetVnd(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          16. Ngân sách duy trì mỗi tháng (VND)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50000"
                          className="form-control"
                          value={ongoingBudgetVnd}
                          onChange={(e) => setOngoingBudgetVnd(e.target.value)}
                        />
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">17. Mục tiêu chính</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VD: rau ăn hàng ngày, thêm thẩm mỹ, cho trẻ con trải nghiệm..."
                          value={goalsText}
                          onChange={(e) => setGoalsText(e.target.value)}
                        />
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          18. Ưu tiên sản lượng (1–5)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={yieldPriority}
                          onChange={(e) => setYieldPriority(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          19. Ưu tiên thẩm mỹ (1–5)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={aestheticPriority}
                          onChange={(e) => setAestheticPriority(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          20. Ưu tiên học hỏi / thử nghiệm (1–5)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          className="form-control"
                          value={learningPriority}
                          onChange={(e) => setLearningPriority(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 4: Hữu cơ, nước, khu vực & kinh nghiệm */}
                {wizardStep === 4 && (
                  <>
                    <h4
                      style={{
                        fontSize: 14,
                        marginTop: 10,
                        marginBottom: 8,
                        color: "#065f46",
                      }}
                    >
                      Bước 4: Ưu tiên & khu vực
                    </h4>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          21. Ưu tiên hữu cơ?
                        </label>
                        <select
                          className="form-control"
                          value={organicPref ? "true" : "false"}
                          onChange={(e) =>
                            setOrganicPref(e.target.value === "true")
                          }
                        >
                          <option value="true">Có, ưu tiên hữu cơ</option>
                          <option value="false">Không bắt buộc</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          22. Ưu tiên tiết kiệm nước?
                        </label>
                        <select
                          className="form-control"
                          value={waterSavingPref ? "true" : "false"}
                          onChange={(e) =>
                            setWaterSavingPref(e.target.value === "true")
                          }
                        >
                          <option value="true">Có</option>
                          <option value="false">Không cần</option>
                        </select>
                      </div>
                    </div>

                    <div
                      className="form-row"
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "8px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          23. Khu vực / Thành phố *
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={locality}
                          onChange={(e) => setLocality(e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">
                          24. Tháng bắt đầu dự kiến
                        </label>
                        <select
                          className="form-control"
                          value={seasonStartMonth}
                          onChange={(e) =>
                            setSeasonStartMonth(Number(e.target.value))
                          }
                        >
                          {months.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="form-label">25. Kinh nghiệm</label>
                        <select
                          className="form-control"
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                        >
                          {EXPERIENCE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {/* Nút trong modal */}
                <div
                  style={{
                    marginTop: "14px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowFormModal(false);
                      setWizardStep(1);
                      setFormError("");
                    }}
                  >
                    Hủy
                  </button>

                  {wizardStep > 1 && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() =>
                        setWizardStep((prev) => (prev > 1 ? prev - 1 : prev))
                      }
                    >
                      Quay Lại
                    </button>
                  )}

                  {wizardStep < TOTAL_STEPS && (
                    <button
                      type="button"
                      className="btn btn-primary_sb"
                      onClick={() =>
                        setWizardStep((prev) =>
                          prev < TOTAL_STEPS ? prev + 1 : prev
                        )
                      }
                    >
                      Tiếp Theo
                    </button>
                  )}

                  {wizardStep === TOTAL_STEPS && (
                    <button
                      type="button"
                      className="btn btn-primary_sb"
                      onClick={handleOpenSummary}
                      disabled={loadingCreate}
                    >
                      Xem Tổng Hợp
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL TÓM TẮT TRƯỚC KHI GỬI AI - HIỆN ĐẠI */}
        {showSummaryModal && pendingBody && (
          <div className="uf-summary-backdrop">
            <div className="uf-summary-modal">
              {/* Header */}
              <div className="uf-summary-header">
                <div className="uf-summary-title-wrap">
                  <span className="uf-summary-chip">
                    <span>🔍</span> TÓM TẮT THÔNG TIN
                  </span>
                  <div className="uf-summary-title">Kiểm tra lại trước khi gửi</div>
                  <div className="uf-summary-subtitle">
                    Đây là bản tóm tắt thông tin không gian, mục tiêu và ưu tiên của bạn.
                    Nếu đã đúng, bấm “Gợi ý” để AI ( Trí tuệ nhân tạo ) phân tích và đề xuất mô hình & cây trồng phù hợp.
                  </div>
                </div>
                <button
                  type="button"
                  className="uf-summary-close-btn"
                  onClick={() => {
                    setShowSummaryModal(false);
                    setSummaryError("");
                  }}
                  aria-label="Đóng"
                >
                  ×
                </button>
              </div>

              <hr className="uf-summary-divider" />

              {/* Lỗi trong modal tổng hợp */}
              {summaryError && (
                <div className="uf-summary-error">
                  {summaryError}
                </div>
              )}

              {/* Body: 3 cột thông tin */}
              <div className="uf-summary-grid">
                <div>
                  <div className="uf-summary-section-title">
                    📍 Không gian & ánh sáng
                  </div>
                  <p>
                    <strong>Loại không gian:</strong>{" "}
                    {pendingBody.space_type || "—"}
                  </p>
                  <p>
                    <strong>Diện tích:</strong>{" "}
                    {pendingBody.area_m2 != null
                      ? `${pendingBody.area_m2} m²`
                      : "—"}
                  </p>
                  <p>
                    <strong>Hình dạng:</strong> {pendingBody.shape || "—"}
                  </p>
                  <p>
                    <strong>Cao lan can:</strong>{" "}
                    {pendingBody.height_guardrail_cm != null
                      ? `${pendingBody.height_guardrail_cm} cm`
                      : "—"}
                  </p>
                  <p>
                    <strong>Có mái che:</strong>{" "}
                    {pendingBody.has_roof ? "Có" : "Không"}
                  </p>
                  <p>
                    <strong>Độ gió:</strong> {pendingBody.wind_exposure || "—"}
                  </p>
                  <p>
                    <strong>Giờ nắng mùa khô:</strong>{" "}
                    {pendingBody.sun_hours_summer != null
                      ? `${pendingBody.sun_hours_summer} giờ/ngày`
                      : "—"}
                  </p>
                  <p>
                    <strong>Giờ nắng mùa mưa:</strong>{" "}
                    {pendingBody.sun_hours_winter != null
                      ? `${pendingBody.sun_hours_winter} giờ/ngày`
                      : "—"}
                  </p>
                  <p>
                    <strong>Hướng nắng chính:</strong>{" "}
                    {pendingBody.sun_orientation || "—"}
                  </p>
                </div>

                <div>
                  <div className="uf-summary-section-title">
                    💧 Nước, thời gian & ưu tiên
                  </div>
                  <p>
                    <strong>Nguồn nước:</strong>{" "}
                    {pendingBody.water_access || "—"}
                  </p>
                  <p>
                    <strong>Thoát nước:</strong>{" "}
                    {pendingBody.drainage_ok || "—"}
                  </p>
                  <p>
                    <strong>Ổ điện ngoài trời:</strong>{" "}
                    {pendingBody.power_outlet ? "Có" : "Không"}
                  </p>
                  <p>
                    <strong>Thời gian chăm:</strong>{" "}
                    {pendingBody.time_budget_hours_per_week != null
                      ? `${pendingBody.time_budget_hours_per_week} giờ/tuần`
                      : "—"}
                  </p>
                  <p>
                    <strong>Mức độ chịu khó chăm:</strong>{" "}
                    {pendingBody.maintenance_style || "—"}
                  </p>
                  <p>
                    <strong>Ngân sách ban đầu:</strong>{" "}
                    {pendingBody.budget_vnd != null
                      ? pendingBody.budget_vnd.toLocaleString("vi-VN")
                      : "—"}{" "}
                    VND
                  </p>
                  <p>
                    <strong>Ngân sách duy trì/tháng:</strong>{" "}
                    {pendingBody.ongoing_budget_vnd_per_month != null
                      ? pendingBody.ongoing_budget_vnd_per_month.toLocaleString(
                          "vi-VN"
                        )
                      : "—"}{" "}
                    VND
                  </p>
                  <p>
                    <strong>Mục tiêu chính:</strong>{" "}
                    {pendingBody.goals && pendingBody.goals.length
                      ? pendingBody.goals.join(", ")
                      : "—"}
                  </p>
                  <p>
                    <strong>Ưu tiên sản lượng:</strong>{" "}
                    {pendingBody.yield_priority ?? "—"}
                  </p>
                  <p>
                    <strong>Ưu tiên thẩm mỹ:</strong>{" "}
                    {pendingBody.aesthetic_priority ?? "—"}
                  </p>
                  <p>
                    <strong>Ưu tiên học hỏi:</strong>{" "}
                    {pendingBody.learning_priority ?? "—"}
                  </p>
                  <p>
                    <strong>Ưu tiên hữu cơ:</strong>{" "}
                    {pendingBody.organic_pref ? "Có" : "Không"}
                  </p>
                  <p>
                    <strong>Ưu tiên tiết kiệm nước:</strong>{" "}
                    {pendingBody.water_saving_pref ? "Có" : "Không"}
                  </p>
                </div>

                <div>
                  <div className="uf-summary-section-title">
                    🗺️ Khu vực & thời điểm
                  </div>
                  <p>
                    <strong>Khu vực / Thành phố:</strong>{" "}
                    {pendingBody.locality || "—"}
                  </p>
                  <p>
                    <strong>Tháng bắt đầu dự kiến:</strong>{" "}
                    {months.find(
                      (m) => m.value === pendingBody.season_start_month
                    )?.label || "—"}
                  </p>
                  <p>
                    <strong>Kinh nghiệm:</strong>{" "}
                    {EXPERIENCE_OPTIONS.find(
                      (opt) => opt.value === pendingBody.experience_level
                    )?.label || "—"}
                  </p>
                  <p>
                    <strong>Tên gợi ý:</strong>{" "}
                    {pendingBody.title || "Chưa đặt tên"}
                  </p>
                </div>
              </div>

              {/* Footer buttons */}
              <div className="uf-summary-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowSummaryModal(false);
                    setShowFormModal(true);
                  }}
                  disabled={loadingCreate}
                >
                  Quay Lại Chỉnh Sửa
                </button>

                <button
                  type="button"
                  className="btn btn-primary_sb"
                  onClick={handleConfirmSubmit}
                  disabled={loadingCreate}
                >
                  {loadingCreate ? "Đang gọi AI..." : "Gợi ý"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default UrbanFarmingPlansPage;
