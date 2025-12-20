import React, { useState, useEffect } from "react";
import NOTEBOOK_TEMPLATE_API from "../../api/farmer/notebookTemplateApi";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/StageObservations.css";

const StageObservations = ({ notebookId }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notebookInfo, setNotebookInfo] = useState(null);

  useEffect(() => {
    fetchObservations();
    fetchNotebookInfo();
  }, [notebookId]);

  const fetchNotebookInfo = async () => {
    try {
      const response = await notebookApi.getNotebookById(notebookId);
      const notebook = response.data?.data || response.data;
      setNotebookInfo(notebook);

      // Debug log for stage tracking
      if (process.env.NODE_ENV !== "production") {
        console.log("📘 Notebook info:", {
          current_day: notebook.current_day,
          current_stage: notebook.current_stage,
          stages_tracking: notebook.stages_tracking,
        });
      }
    } catch (err) {
      setNotebookInfo(null);
    }
  };

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const response = await NOTEBOOK_TEMPLATE_API.getCurrentObservations(
        notebookId
      );
      const obsData = response.data?.data || response.data || [];

      // Debug: log raw observations returned from backend
      if (process.env.NODE_ENV !== "production") {
        console.log("🔍 Raw observations response:", obsData);
      }

      // Normalize different possible field names from backend templates
      // Backend PlantTemplate observation schema uses { key, label, description }
      // Older docs/examples may use observation_key / observation_name.
      const raw = Array.isArray(obsData) ? obsData : [];
      const getField = (obj, ...names) => {
        for (const n of names) {
          if (obj == null) continue;
          if (obj[n] !== undefined) return obj[n];
          // handle Mongoose document where real data may be in _doc
          if (obj._doc && obj._doc[n] !== undefined) return obj._doc[n];
        }
        return undefined;
      };

      const normalized = raw.map((o) => ({
        observation_key:
          getField(o, "observation_key", "key", "observationKey") ||
          getField(o.__raw, "key"),
        observation_name:
          getField(o, "observation_name", "observationName", "label", "name") ||
          getField(o.__raw, "label", "name"),
        description: getField(o, "description", "desc") || "",
        value:
          getField(o, "value") === undefined ? false : getField(o, "value"),
        observed_at: getField(o, "observed_at", "observedAt") || null,
        __raw: o,
      }));

      if (process.env.NODE_ENV !== "production") {
        console.log("✅ Normalized observations:", normalized);
      }

      setObservations(normalized);
      setError(null);
    } catch (err) {
      console.error("Error fetching observations:", err);
      setError(err.response?.data?.message || "Failed to load observations");
      setObservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleObservationChange = async (obsObj, value) => {
    // Ensure we have a key from several possible fields
    const observationKey =
      obsObj.observation_key ||
      obsObj.key ||
      obsObj.observationKey ||
      obsObj.__raw?.key;

    if (!observationKey) {
      alert("Không tìm thấy observation key để cập nhật.");
      return;
    }

    try {
      setSaving(true);
      const response = await NOTEBOOK_TEMPLATE_API.updateObservation(
        notebookId,
        observationKey,
        value
      );

      const responseData = response.data;
      const autoTransitioned = responseData.meta?.auto_transitioned;

      if (autoTransitioned) {
        const newStageName =
          responseData.meta?.stage_name || "giai đoạn tiếp theo";
        alert(
          `🎉 ${
            responseData.message ||
            `Đã hoàn thành tất cả quan sát! Tự động chuyển sang ${newStageName}. Công việc mới sẽ xuất hiện vào ngày mai.`
          }`
        );

        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Refetch observations to ensure consistent state (handles missing keys)
        await fetchObservations();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update observation");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="observations-loading">Đang tải...</div>;

  if (loading) return <div className="observations-loading">Đang tải...</div>;
  if (error) return <div className="observations-error">{error}</div>;

  // Show completion message if notebook is fully completed
  if (
    notebookInfo &&
    (notebookInfo.progress === 100 || notebookInfo.progress === "100")
  ) {
    return (
      <div className="observations-completed">
        <h3>🎉 Notebook đã hoàn thành toàn bộ tiến trình!</h3>
        <p>
          Tất cả điều kiện quan sát đã được kiểm tra. Bạn có thể xem lại kết quả
          hoặc bắt đầu một notebook mới.
        </p>
      </div>
    );
  }

  if (observations.length === 0)
    return (
      <div className="observations-empty">
        CHƯA CÓ QUAN SÁT NÀO CHO GIAI ĐOẠN NÀY
      </div>
    );

  // Determine if observations should be enabled
  // ✅ NEW LOGIC: Cho phép check khi currentDay >= stageEndDay (đã đến hoặc qua ngày cuối)
  // Mỗi observation có thể check riêng lẻ - một khi đã check (value=true), hôm sau sẽ bị disabled
  const currentDay = notebookInfo?.current_day || 0;
  const currentStageNum = notebookInfo?.current_stage || 1;
  const currentStageTracking = notebookInfo?.stages_tracking?.find(
    (st) => st.stage_number === currentStageNum && st.is_current
  );

  // Get stage end day from template (via notebookInfo.template_id or fetch separately if needed)
  // For now, assume backend getCurrentObservations returns stage info or we fetch template
  // Simpler approach: check if template_id is populated and find stage day_end
  let stageEndDay = null;
  if (notebookInfo?.template_id?.stages) {
    const templateStage = notebookInfo.template_id.stages.find(
      (s) => s.stage_number === currentStageNum
    );
    stageEndDay = templateStage?.day_end;
  }

  // ✅ Enable observations when current_day >= stage_end_day (đã đến hoặc qua ngày cuối giai đoạn)
  const hasReachedEndDay = stageEndDay && currentDay >= stageEndDay;
  const observationsAvailable = hasReachedEndDay;

  if (process.env.NODE_ENV !== "production") {
    console.log("🔍 Observation enable check:", {
      currentDay,
      stageEndDay,
      hasReachedEndDay,
      observationsAvailable,
    });
  }

  return (
    <div className="stage-observations">
      <div className="observations-header">
        <h3>👁️ Quan sát giai đoạn</h3>
        <p className="observations-hint">
          {observationsAvailable
            ? "Đánh dấu các quan sát để theo dõi sự phát triển của cây. Bạn có thể thay đổi trong cùng ngày, nhưng sẽ bị khóa vào ngày hôm sau."
            : `Quan sát sẽ được kích hoạt khi đến ngày cuối giai đoạn (ngày ${
                stageEndDay || "..."
              })${currentDay ? `. Hiện tại: ngày ${currentDay}` : ""}`}
        </p>
      </div>

      <div className="observations-list">
        {observations.map((obs, index) => {
          // ✅ Logic mới: Cho phép bỏ check trong cùng ngày, chỉ khóa khi qua ngày hôm sau
          // - Nếu chưa đến ngày cuối giai đoạn: disabled
          // - Nếu đã đến/qua ngày cuối: enabled
          // - Nếu đã check VÀ qua ngày hôm sau (kể từ ngày check): disabled (bị khóa)
          // - Nếu đã check NHƯNG còn trong cùng ngày check: vẫn enabled (cho phép bỏ check)

          let canCheckObservation = observationsAvailable;

          // Nếu đã có observed_at, kiểm tra xem đã qua ngày hôm sau chưa
          if (obs.observed_at && obs.value === true) {
            // Parse observed_at date (backend trả về ISO string hoặc Date object)
            const observedDate = new Date(obs.observed_at);
            // So sánh current_day với ngày check
            // Nếu current_day > ngày check thì disable
            // Backend có thể trả về observed_at là timestamp của ngày check
            // Ta cần tính xem từ planted_date + current_day có lớn hơn observed_at không

            // Lấy planted_date từ notebookInfo
            const plantedDate = notebookInfo?.planted_date
              ? new Date(notebookInfo.planted_date)
              : null;

            if (plantedDate) {
              // Tính ngày hiện tại dựa trên planted_date + current_day
              const currentDate = new Date(plantedDate);
              currentDate.setDate(currentDate.getDate() + currentDay - 1);

              // So sánh ngày (chỉ ngày, không tính giờ)
              const observedDateOnly = new Date(
                observedDate.getFullYear(),
                observedDate.getMonth(),
                observedDate.getDate()
              );
              const currentDateOnly = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                currentDate.getDate()
              );

              // Nếu currentDate > observedDate (đã qua ngày hôm sau) → disable
              if (currentDateOnly > observedDateOnly) {
                canCheckObservation = false;
              }
              // Nếu còn cùng ngày check → vẫn enable (cho phép bỏ check)
            }
          }

          return (
            <div
              key={index}
              className={`observation-item ${
                !canCheckObservation ? "dimmed" : ""
              }`}
            >
              <div className="observation-content">
                <h4>{obs.observation_name}</h4>
                {obs.description && (
                  <p className="observation-description">{obs.description}</p>
                )}
              </div>

              <div className="observation-toggle">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={obs.value || false}
                    onChange={(e) =>
                      handleObservationChange(obs, e.target.checked)
                    }
                    disabled={saving || !canCheckObservation}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="toggle-label">
                  {obs.value ? "✓ Có" : "✗ Không"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {saving && (
        <div className="observations-saving">
          <span>Đang lưu...</span>
        </div>
      )}
    </div>
  );
};

export default StageObservations;
