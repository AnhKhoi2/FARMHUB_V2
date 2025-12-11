import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import ImageUploader from "../../components/farmer/ImageUploader";
import "../../css/farmer/NotebookForm.css";
import { formatVietnamLocale } from "../../utils/timezone";

const NotebookEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notebook, setNotebook] = useState(null);
  const [formData, setFormData] = useState({
    notebook_name: "",
    description: "",
    cover_image: "",
    status: "active",
  });

  useEffect(() => {
    fetchNotebook();
  }, [id]);

  const fetchNotebook = async () => {
    try {
      setLoading(true);
      const response = await notebookApi.getNotebookById(id);
      const notebookData = response.data?.data || response.data;
      setNotebook(notebookData);
      setFormData({
        notebook_name: notebookData.notebook_name || "",
        description: notebookData.description || "",
        cover_image: notebookData.cover_image || "",
        status: notebookData.status || "active",
      });
    } catch (err) {
      console.error("Error fetching notebook:", err);
      alert("KHÔNG THỂ TẢI SỔ TAY");
      navigate("/farmer/notebooks");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageSelect = (imageUrl) => {
    setFormData((prev) => ({
      ...prev,
      cover_image: imageUrl || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.notebook_name.trim()) {
      alert("VUI LÒNG NHẬP TÊN SỔ TAY");
      return;
    }

    try {
      setSaving(true);
      await notebookApi.updateNotebook(id, formData);
      alert("CẬP NHẬT SỔ TAY THÀNH CÔNG!");
      navigate(`/farmer/notebooks/${id}`);
    } catch (err) {
      console.error("Error updating notebook:", err);
      alert("KHÔNG THỂ CẬP NHẬT SỔ TAY. VUI LÒNG THỬ LẠI.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm("BẠN CÓ CHẮC MUỐN HỦY? CÁC THAY ĐỔI SẼ KHÔNG ĐƯỢC LƯU.")
    ) {
      navigate(`/farmer/notebooks/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="notebook-form-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>ĐANG TẢI...</p>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="notebook-form-container">
        <div className="alert alert-error">
          <span>⚠️</span> KHÔNG TÌM THẤY SỔ TAY
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={handleCancel}>
          ← QUAY LẠI
        </button>
        <h1>CHỈNH SỬA SỔ TAY</h1>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="notebook_name">
              TÊN SỔ TAY <span className="required">*</span>
            </label>
            <input
              type="text"
              id="notebook_name"
              name="notebook_name"
              value={formData.notebook_name}
              onChange={handleInputChange}
              placeholder="VÍ DỤ: VƯỜN RAU NHÀ TÔI"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">MÔ TẢ</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="GHI CHÚ VỀ CÂY TRỒNG CỦA BẠN..."
              rows={4}
            />
          </div>

          {/* Image Uploader Component */}
          <ImageUploader
            label="ẢNH BÌA"
            currentImage={formData.cover_image}
            onImageSelect={handleImageSelect}
          />

          <div className="form-group">
            <label htmlFor="status">TRẠNG THÁI</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">ĐANG TRỒNG</option>
              <option value="archived">ĐÃ LƯU TRỮ</option>
            </select>
            <p className="form-hint">
              LƯU TRỮ SỔ TAY KHI BẠN ĐÃ THU HOẠCH HOẶC KHÔNG THEO DÕI NỮA
            </p>
          </div>

          {/* Non-editable Info */}
          <div className="info-section">
            <h3>THÔNG TIN KHÔNG THỂ CHỈNH SỬA</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">LOẠI CÂY TRỒNG:</span>
                <span className="info-value">🌿 {notebook.plant_type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">NGÀY TRỒNG:</span>
                <span className="info-value">
                  📅 {formatVietnamLocale(notebook.planted_date)}
                </span>
              </div>
              {notebook.template_id && (
                <div className="info-item">
                  <span className="info-label">BỘ MẪU:</span>
                  <span className="info-value">
                    🌱 {notebook.template_id.template_name || "N/A"}
                  </span>
                </div>
              )}
            </div>
            <p className="info-note">
              ℹ️ LOẠI CÂY, NGÀY TRỒNG VÀ BỘ MẪU KHÔNG THỂ THAY ĐỔI VÌ ẢNH HƯỞNG
              ĐẾN TÍNH TOÁN GIAI ĐOẠN
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              HỦY
            </button>
            <button type="submit" className="btn btn-submit" disabled={saving}>
              {saving ? "ĐANG LƯU..." : "💾 LƯU THAY ĐỔI"}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>💡 LƯU Ý</h3>
        <ul>
          <li>BẠN CHỈ CÓ THỂ CHỈNH SỬA TÊN, MÔ TẢ, ẢNH BÌA VÀ TRẠNG THÁI</li>
          <li>LOẠI CÂY TRỒNG VÀ NGÀY TRỒNG KHÔNG THỂ THAY ĐỔI</li>
          <li>
            BỘ MẪU ĐÃ GÁN KHÔNG THỂ THAY ĐỔI VÌ ẢNH HƯỞNG ĐẾN LỊCH CHĂM SÓC
          </li>
          <li>
            ĐỂ THÊM/XÓA HÌNH ẢNH HOẶC CẬP NHẬT GHI CHÚ, VÀO TAB "SỔ TAY & HÌNH
            ẢNH"
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotebookEdit;
