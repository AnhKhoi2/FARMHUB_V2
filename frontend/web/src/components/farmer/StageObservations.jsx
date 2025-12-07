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
      setNotebookInfo(response.data?.data || response.data);
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

  return (
    <div className="stage-observations">
      <div className="observations-header">
        <h3>👁️ Quan sát giai đoạn</h3>
        <p className="observations-hint">
          Đánh dấu các quan sát để theo dõi sự phát triển của cây
        </p>
      </div>

      <div className="observations-list">
        {observations.map((obs, index) => (
          <div key={index} className="observation-item">
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
                  disabled={saving}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">
                {obs.value ? "✓ Có" : "✗ Không"}
              </span>
            </div>
          </div>
        ))}
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
