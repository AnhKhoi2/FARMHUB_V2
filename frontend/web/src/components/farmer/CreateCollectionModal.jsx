import React, { useState } from "react";
import "../../css/farmer/CreateCollectionModal.css";

const CreateCollectionModal = ({ show, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    collection_name: "",
    description: "",
    cover_file: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData, previewUrl);
    // Reset form
    setFormData({
      collection_name: "",
      description: "",
      cover_file: null,
    });
    // Do not revoke previewUrl here — parent may use it for optimistic UI.
  };

  // Note: cover image URL and tags removed as requested

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // revoke previous
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData({ ...formData, cover_file: file });
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFormData({ ...formData, cover_file: null });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content create-collection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>📚 TẠO BỘ SƯU TẬP MỚI</h2>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              TÊN BỘ SƯU TẬP <span className="required">*</span>
            </label>
            <input
              type="text"
              value={formData.collection_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  collection_name: e.target.value,
                })
              }
              placeholder="VD: VƯỜN RAU NHÀ TÔI"
              required
              maxLength={100}
              autoFocus
            />
            <small className="form-hint">
              {formData.collection_name.length}/100 KÝ TỰ
            </small>
          </div>

          <div className="form-group">
            <label>MÔ TẢ</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder="MÔ TẢ VỀ BỘ SƯU TẬP NÀY..."
              maxLength={500}
              rows={4}
            />
            <small className="form-hint">
              {formData.description.length}/500 KÝ TỰ
            </small>
          </div>

          {/* cover image URL and tags fields removed per request */}

          <div className="form-group">
            <label>ẢNH BÌA (TẢI TỪ MÁY)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && (
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
                <div className="preview-actions">
                  <button
                    type="button"
                    className="btn-remove-image"
                    onClick={handleRemoveImage}
                  >
                    XÓA ẢNH
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              HỦY
            </button>
            <button type="submit" className="btn-submit">
              TẠO BỘ SƯU TẬP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
