import React, { useState, useEffect } from "react";
import NOTEBOOK_TEMPLATE_API from "../../api/farmer/notebookTemplateApi";
import "../../css/farmer/StageObservations.css";

const StageObservations = ({ notebookId }) => {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchObservations();
  }, [notebookId]);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const response = await NOTEBOOK_TEMPLATE_API.getCurrentObservations(
        notebookId
      );
      const obsData = response.data?.data || response.data || [];
      setObservations(Array.isArray(obsData) ? obsData : []);
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
            `Đã hoàn thành tất cả quan sát! Tự động chuyển sang ${newStageName}`
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
  if (error) return <div className="observations-error">{error}</div>;
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
