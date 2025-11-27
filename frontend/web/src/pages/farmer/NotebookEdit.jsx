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
      alert("Không thể tải nhật ký");
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
      alert("Vui lòng nhập tên nhật ký");
      return;
    }

    try {
      setSaving(true);
      await notebookApi.updateNotebook(id, formData);
      alert("Cập nhật nhật ký thành công!");
      navigate(`/farmer/notebooks/${id}`);
    } catch (err) {
      console.error("Error updating notebook:", err);
      alert("Không thể cập nhật nhật ký. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")
    ) {
      navigate(`/farmer/notebooks/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="notebook-form-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="notebook-form-container">
        <div className="alert alert-error">
          <span>⚠️</span> Không tìm thấy nhật ký
        </div>
      </div>
    );
  }

  return (
    <div className="notebook-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={handleCancel}>
          ← Quay lại
        </button>
        <h1>Chỉnh Sửa Nhật Ký</h1>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="notebook_name">
              Tên Nhật Ký <span className="required">*</span>
            </label>
            <input
              type="text"
              id="notebook_name"
              name="notebook_name"
              value={formData.notebook_name}
              onChange={handleInputChange}
              placeholder="Ví dụ: Vườn rau nhà tôi"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Mô Tả</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Ghi chú về cây trồng của bạn..."
              rows={4}
            />
          </div>

          {/* Image Uploader Component */}
          <ImageUploader
            label="Ảnh Bìa"
            currentImage={formData.cover_image}
            onImageSelect={handleImageSelect}
          />

          <div className="form-group">
            <label htmlFor="status">Trạng Thái</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">Đang trồng</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
            <p className="form-hint">
              Lưu trữ nhật ký khi bạn đã thu hoạch hoặc không theo dõi nữa
            </p>
          </div>

          {/* Non-editable Info */}
          <div className="info-section">
            <h3>Thông Tin Không Thể Chỉnh Sửa</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Loại cây trồng:</span>
                <span className="info-value">🌿 {notebook.plant_type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ngày trồng:</span>
                <span className="info-value">
                  📅 {formatVietnamLocale(notebook.planted_date)}
                </span>
              </div>
              {notebook.template_id && (
                <div className="info-item">
                  <span className="info-label">Bộ mẫu:</span>
                  <span className="info-value">
                    🌱 {notebook.template_id.template_name || "N/A"}
                  </span>
                </div>
              )}
            </div>
            <p className="info-note">
              ℹ️ Loại cây, ngày trồng và bộ mẫu không thể thay đổi vì ảnh hưởng
              đến tính toán giai đoạn
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-submit" disabled={saving}>
              {saving ? "Đang lưu..." : "💾 Lưu Thay Đổi"}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>💡 Lưu Ý</h3>
        <ul>
          <li>Bạn chỉ có thể chỉnh sửa tên, mô tả, ảnh bìa và trạng thái</li>
          <li>Loại cây trồng và ngày trồng không thể thay đổi</li>
          <li>
            Bộ mẫu đã gán không thể thay đổi vì ảnh hưởng đến lịch chăm sóc
          </li>
          <li>
            Để thêm/xóa hình ảnh hoặc cập nhật ghi chú, vào tab "Nhật Ký & Hình
            Ảnh"
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NotebookEdit;
