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

      // Normalize different possible field names from backend templates
      // Backend PlantTemplate observation schema uses { key, label, description }
      // Older docs/examples may use observation_key / observation_name.
      const raw = Array.isArray(obsData) ? obsData : [];
      const normalized = raw.map((o) => ({
        // prefer already-correct names, fallback to `key`/`label`
        observation_key: o.observation_key || o.key || o.observationKey,
        observation_name:
          o.observation_name || o.observationName || o.label || o.name,
        description: o.description || o.desc || "",
        // preserve any existing value (from stage tracking) or default false
        value: o.value === undefined ? false : o.value,
        // keep original object in case other fields are needed
        __raw: o,
      }));

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

  const handleObservationChange = async (observationKey, value) => {
    try {
      setSaving(true);
      const response = await NOTEBOOK_TEMPLATE_API.updateObservation(
        notebookId,
        observationKey,
        value
      );

      // Kiểm tra xem có auto-transition không
      const responseData = response.data;
      const autoTransitioned = responseData.meta?.auto_transitioned;

      if (autoTransitioned) {
        // Hiển thị thông báo đặc biệt cho auto-transition
        const newStageName =
          responseData.meta?.stage_name || "giai đoạn tiếp theo";
        alert(
          `🎉 ${
            responseData.message ||
            `Đã hoàn thành tất cả quan sát! Tự động chuyển sang ${newStageName}. Công việc mới sẽ xuất hiện vào ngày mai.`
          }`
        );

        // Reload sau 1 giây để user đọc message
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        // Cập nhật local state bình thường
        setObservations((prev) =>
          prev.map((obs) =>
            obs.observation_key === observationKey
              ? { ...obs, value: value }
              : obs
          )
        );
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
        Không có quan sát cho giai đoạn này
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
                    handleObservationChange(
                      obs.observation_key,
                      e.target.checked
                    )
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
