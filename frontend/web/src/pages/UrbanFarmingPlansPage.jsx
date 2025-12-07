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
  { value: "low", label: "Ít gió" },
  { value: "med", label: "Gió vừa" },
  { value: "high", label: "Gió mạnh" },
];

const SUN_ORIENT_OPTIONS = [
  { value: "N", label: "Bắc" },
  { value: "NE", label: "Đông Bắc" },
  { value: "E", label: "Đông" },
  { value: "SE", label: "Đông Nam" },
  { value: "S", label: "Nam" },
  { value: "SW", label: "Tây Nam" },
  { value: "W", label: "Tây" },
  { value: "NW", label: "Tây Bắc" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "active", label: "Đang dùng" },
  { value: "deleted", label: "Đã xóa mềm" },
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
  const [windExposure, setWindExposure] = useState("med");
  const [sunHoursSummer, setSunHoursSummer] = useState("4.5");
  const [sunHoursWinter, setSunHoursWinter] = useState("2.5");
  const [sunOrientation, setSunOrientation] = useState("SE");
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
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showFormModal, setShowFormModal] = useState(false); // ⭐ modal form
  // ------- HELPERS -------
  const fetchPlans = async (pageOverride) => {
    setLoadingList(true);
    setError("");
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
      setError(
        err.response?.data?.message ||
          "Không tải được danh sách gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingList(false);
    }
  };

  const fetchPlanDetail = async (id) => {
    setLoadingDetail(true);
    setError("");
    setSelectedPlanDetail(null);
    try {
      const res = await UrbanFarmingApi.getPlanDetail(id);
      setSelectedPlanDetail(res.data.data);
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] fetchPlanDetail error:", err);
      setError(
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

  // ------- HANDLERS -------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingCreate(true);
    setError("");
    setSuccessMsg("");

    const goalsArray = goalsText
      ? goalsText.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const body = {
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
        ? Number(learningPriority) : undefined,
      organic_pref: organicPref,
      water_saving_pref: waterSavingPref,

      locality,
      season_start_month: Number(seasonStartMonth),
      experience_level: experienceLevel,
    };

    try {
      const res = await UrbanFarmingApi.createPlan(body);
      const created = res.data.data;

      setSuccessMsg("Đã tạo gợi ý mới thành công.");
      if (statusFilter === "active" || statusFilter === "all") {
        setPlans((prev) => [created, ...prev]);
        setTotal((prev) => prev + 1);
      }
      setSelectedPlanId(created._id);
      setSelectedPlanDetail(created);
      setShowFormModal(false); // ⭐ đóng modal sau khi tạo xong
    } catch (err) {
      console.error("[UrbanFarmingPlansPage] create plan error:", err);
      setError(
        err.response?.data?.message ||
          "Không tạo được gợi ý. Vui lòng thử lại."
      );
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
    setError("");
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
      setError(
        err.response?.data?.message ||
          "Không xóa được gợi ý. Vui lòng thử lại."
      );
    } finally {
      setLoadingSoftDelete(false);
    }
  };

  const handleRestore = async (planId) => {
    setLoadingRestore(true);
    setError("");
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
      setError(
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
      return <span className="badge badge-danger">Đã xóa mềm</span>;
    }
    return <span className="badge badge-success">Đang dùng</span>;
  };

  const renderMainModel = (modelId) => {
    if (!modelId) return "--";
    const map = {
      "self-watering-container": "Chậu tự tưới",
      "kratky-microgreens": "Microgreens Kratky",
      "railing-planter": "Chậu treo lan can",
      "vertical-rack": "Kệ trồng đứng",
      "grow-bag-floor": "Túi vải trồng trên sàn",
      "hanging-baskets": "Giỏ treo",
      other: "Mô hình khác",
    };
    return map[modelId] || modelId;
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
        <div
          style={{
            marginBottom: "12px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ marginBottom: "4px" }}>
              Gợi ý mô hình trồng trọt đô thị
            </h2>
            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>
              Hệ thống sẽ lưu lại tất cả gợi ý để xem lại, xóa mềm hoặc khôi
              phục khi cần.
            </p>
          </div>
          <button
            type="button"
            className=" btn-primary_sb"
            onClick={() => setShowFormModal(true)}
          >
            + Tạo gợi ý mới
          </button>
        </div>

        {/* Thông báo */}
        {(error || successMsg) && (
          <div style={{ marginBottom: "12px" }}>
            {error && (
              <div
                style={{
                  background: "#ffe5e5",
                  color: "#b30000",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                }}
              >
                {error}
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

        {/* GRID: chỉ còn list + detail (full width hơn) */}
        <div
          className="urban-farming-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.1fr)",
            gap: "20px",
            alignItems: "flex-start",
          }}
        >
          {/* LIST */}
          <div
            className="card"
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "12px 16px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              border: "1px solid #e3e3e3",
              maxHeight: "360px",
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
              <h3 style={{ fontSize: "16px", margin: 0 }}>Danh sách gợi ý</h3>
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
                Chưa có gợi ý nào. Nhấn{" "}
                <strong>“Tạo gợi ý mới”</strong> ở góc trên bên phải để tạo.
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
                            <strong>
                              {renderMainModel(p.main_model_id)}
                            </strong>{" "}
                            • Tạo lúc {formatDateTime(p.createdAt)}
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
                                <IoTrashOutline style={{ verticalAlign: "middle", marginRight: 6 }} />
                                
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
                                <IoArrowUndoOutline style={{ verticalAlign: "middle", marginRight: 6 }} />
                              
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
              Chi tiết gợi ý
            </h3>

            {!selectedPlanId && (
              <div style={{ fontSize: "13px", color: "#666" }}>
                Hãy chọn một gợi ý ở danh sách bên cạnh để xem chi tiết.
              </div>
            )}

            {selectedPlanId && loadingDetail && (
              <div>Đang tải chi tiết...</div>
            )}

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
                        {selectedPlanDetail.aiResult.risks.map(
                          (r, idx) => (
                            <li key={idx}>{r}</li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Top models */}
                {Array.isArray(
                  selectedPlanDetail.aiResult?.top_models
                ) &&
                  selectedPlanDetail.aiResult.top_models.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Mô hình gợi ý:</strong>
                      <ul style={{ paddingLeft: "18px", margin: "4px 0" }}>
                        {selectedPlanDetail.aiResult.top_models.map(
                          (m, idx) => (
                            <li key={idx}>
                              <div>
                                <strong>
                                  {renderMainModel(m.model_id)}
                                </strong>{" "}
                                (điểm phù hợp:{" "}
                                {typeof m.fit_score === "number"
                                  ? `${m.fit_score}%`
                                  : m.fit_score}
                                )
                              </div>
                              {m.reason_vi && (
                                <div>- Lý do: {m.reason_vi}</div>
                              )}
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
                {Array.isArray(
                  selectedPlanDetail.aiResult?.crop_suggestions
                ) &&
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
                            <th>DLI cần</th>
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
                                <td style={{ maxWidth: 220 }}>
                                  {c.reason_vi}
                                </td>
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
                        {selectedPlanDetail.aiResult.calendar.map(
                          (w, idx) => (
                            <li key={idx}>
                              Tuần {w.week}: {w.milestone}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                {/* Upgrades */}
                {Array.isArray(
                  selectedPlanDetail.aiResult?.upgrades_after_3m
                ) &&
                  selectedPlanDetail.aiResult.upgrades_after_3m
                    .length > 0 && (
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

        {/* MODAL FORM TẠO GỢI Ý */}
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
                    Tạo gợi ý mô hình trồng trọt mới
                  </h3>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      margin: "2px 0 0",
                    }}
                  >
                    Điền điều kiện không gian, thời gian chăm & mục tiêu. AI sẽ
                    trả về mô hình phù hợp và lưu lại trong lịch sử.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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

              {/* FORM TRONG MODAL */}
              <form onSubmit={handleSubmit}>
                {/* Tên gợi ý */}
                <div className="form-group">
                  <label className="form-label">Tên gợi ý (tùy chọn)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: Ban công HCM bắt đầu tháng 12"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                </div>

                {/* Hàng 1: space_type + area + shape */}
                <div
                  className="form-row"
                  style={{ display: "flex", gap: "12px" }}
                >
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Loại không gian *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: Ban công, sân thượng, bệ cửa sổ..."
                      value={spaceType}
                      onChange={(e) => setSpaceType(e.target.value)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Diện tích (m²){" "}
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
                    <label className="form-label">Hình dạng</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: dài-hẹp, gần vuông, không đều..."
                      value={shape}
                      onChange={(e) => setShape(e.target.value)}
                    />
                  </div>
                </div>

                {/* Hàng 2: guardrail + roof + wind */}
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
                      Cao lan can (cm){" "}
                      <span style={{ fontSize: 12 }}>(nếu có)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-control"
                      value={heightGuardrailCm}
                      onChange={(e) =>
                        setHeightGuardrailCm(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Có mái che?</label>
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
                    <label className="form-label">Độ gió</label>
                    <select
                      className="form-control"
                      value={windExposure}
                      onChange={(e) =>
                        setWindExposure(e.target.value)
                      }
                    >
                      {WIND_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hàng 3: nắng + hướng nắng */}
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
                      Giờ nắng mùa khô / hè (giờ/ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-control"
                      value={sunHoursSummer}
                      onChange={(e) =>
                        setSunHoursSummer(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Giờ nắng mùa mưa / đông (giờ/ngày)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-control"
                      value={sunHoursWinter}
                      onChange={(e) =>
                        setSunHoursWinter(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Hướng nắng chính</label>
                    <select
                      className="form-control"
                      value={sunOrientation}
                      onChange={(e) =>
                        setSunOrientation(e.target.value)
                      }
                    >
                      {SUN_ORIENT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Hàng 4: nước + thoát nước + ổ điện */}
                <div
                  className="form-row"
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Nguồn nước</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: vòi nước gần, xách nước, lấy trong nhà..."
                      value={waterAccess}
                      onChange={(e) =>
                        setWaterAccess(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Thoát nước (mô tả)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: thoát tốt, dễ đọng nước, không rõ..."
                      value={drainageOk}
                      onChange={(e) =>
                        setDrainageOk(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Có ổ điện ngoài trời?
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

                {/* Hàng 5: thời gian chăm + maintenance + ngân sách */}
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
                      Thời gian chăm (giờ/tuần)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="form-control"
                      value={timeBudget}
                      onChange={(e) =>
                        setTimeBudget(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Mức độ chịu khó chăm
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="VD: ít, trung bình, chịu khó..."
                      value={maintenanceStyle}
                      onChange={(e) =>
                        setMaintenanceStyle(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Ngân sách đầu tư ban đầu (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      className="form-control"
                      value={budgetVnd}
                      onChange={(e) =>
                        setBudgetVnd(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Hàng 6: ngân sách hàng tháng + goals */}
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
                      Ngân sách duy trì mỗi tháng (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="50000"
                      className="form-control"
                      value={ongoingBudgetVnd}
                      onChange={(e) =>
                        setOngoingBudgetVnd(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label className="form-label">Mục tiêu chính</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Nhập tự do, có thể nhiều mục tiêu, cách nhau bằng dấu phẩy. VD: rau ăn hàng ngày, thêm thẩm mỹ, cho trẻ con trải nghiệm..."
                      value={goalsText}
                      onChange={(e) =>
                        setGoalsText(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Hàng 7: ưu tiên */}
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
                      Ưu tiên sản lượng (1–5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={yieldPriority}
                      onChange={(e) =>
                        setYieldPriority(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Ưu tiên thẩm mỹ (1–5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={aestheticPriority}
                      onChange={(e) =>
                        setAestheticPriority(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Ưu tiên học hỏi / thử nghiệm (1–5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={learningPriority}
                      onChange={(e) =>
                        setLearningPriority(e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Hàng 8: organic + water saving */}
                <div
                  className="form-row"
                  style={{
                    display: "flex",
                    gap: "12px",
                    marginTop: "8px",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Ưu tiên hữu cơ?</label>
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
                      Ưu tiên tiết kiệm nước?
                    </label>
                    <select
                      className="form-control"
                      value={waterSavingPref ? "true" : "false"}
                      onChange={(e) =>
                        setWaterSavingPref(
                          e.target.value === "true"
                        )
                      }
                    >
                      <option value="true">Có</option>
                      <option value="false">Không cần</option>
                    </select>
                  </div>
                </div>

                {/* Hàng 9: locality + season + experience */}
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
                      Khu vực / Thành phố *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={locality}
                      onChange={(e) =>
                        setLocality(e.target.value)
                      }
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">
                      Tháng bắt đầu dự kiến
                    </label>
                    <select
                      className="form-control"
                      value={seasonStartMonth}
                      onChange={(e) =>
                        setSeasonStartMonth(
                          Number(e.target.value)
                        )
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
                    <label className="form-label">Kinh nghiệm</label>
                    <select
                      className="form-control"
                      value={experienceLevel}
                      onChange={(e) =>
                        setExperienceLevel(e.target.value)
                      }
                    >
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

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
                    onClick={() => setShowFormModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary_sb"
                    disabled={loadingCreate}
                  >
                    {loadingCreate ? "Đang gọi AI..." : "Tạo gợi ý mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default UrbanFarmingPlansPage;
