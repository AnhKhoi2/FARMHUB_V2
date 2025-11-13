import React, { useState } from "react";
import "../../css/farmer/CreateCollectionModal.css";

const CreateCollectionModal = ({ show, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    collection_name: "",
    description: "",
    cover_image: "",
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form
    setFormData({
      collection_name: "",
      description: "",
      cover_image: "",
      tags: [],
    });
    setTagInput("");
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags.length < 10) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (index) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((_, i) => i !== index),
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content create-collection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>📚 Tạo bộ sưu tập mới</h2>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Tên bộ sưu tập <span className="required">*</span>
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
              placeholder="VD: Vườn rau nhà tôi"
              required
              maxLength={100}
              autoFocus
            />
            <small className="form-hint">
              {formData.collection_name.length}/100 ký tự
            </small>
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              placeholder="Mô tả về bộ sưu tập này..."
              maxLength={500}
              rows={4}
            />
            <small className="form-hint">
              {formData.description.length}/500 ký tự
            </small>
          </div>

          <div className="form-group">
            <label>URL ảnh bìa</label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  cover_image: e.target.value,
                })
              }
              placeholder="https://example.com/image.jpg"
            />
            {formData.cover_image && (
              <div className="image-preview">
                <img
                  src={formData.cover_image}
                  alt="Preview"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Tags (tối đa 10)</label>
            <div className="tag-input-group">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Nhập tag và nhấn Enter"
                maxLength={50}
                disabled={formData.tags.length >= 10}
              />
              <button
                type="button"
                className="btn-add-tag"
                onClick={handleAddTag}
                disabled={!tagInput.trim() || formData.tags.length >= 10}
              >
                + Thêm
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="tags-container">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                    <button
                      type="button"
                      className="btn-remove-tag"
                      onClick={() => handleRemoveTag(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              Tạo bộ sưu tập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
