import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import notebookApi from "../../api/farmer/notebookApi";
import axiosClient from "../../api/shared/axiosClient";
import ImageUploader from "../../components/farmer/ImageUploader";
import "../../css/farmer/NotebookForm.css";

const NotebookCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [guides, setGuides] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    notebook_name: "",
    guide_id: "",
    plant_type: "",
    description: "",
    planted_date: new Date().toISOString().split("T")[0],
    cover_image: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [autoMatchedTemplate, setAutoMatchedTemplate] = useState(null);
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);

  useEffect(() => {
    fetchGuides();
    fetchTemplates();
  }, []);

  const fetchGuides = async () => {
    try {
      // Request with a large limit so frontend gets all published guides
      const response = await axiosClient.get("/guides", {
        params: { limit: 1000, page: 1 },
      });
      const guidesData = response.data?.data || response.data || [];
      setGuides(
        Array.isArray(guidesData)
          ? guidesData.filter((g) => g.status === "published")
          : []
      );
    } catch (err) {
      console.error("Error fetching guides:", err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await axiosClient.get("/api/plant-templates");
      const templatesData = response.data?.data || response.data || [];
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Enforce planted_date must be today's date when creating a notebook
    if (name === "planted_date") {
      const todayStr = new Date().toISOString().split("T")[0];
      if (value !== todayStr) {
        alert("Ngày trồng chỉ được chọn là ngày hiện tại.");
        setFormData((prev) => ({ ...prev, planted_date: todayStr }));
        return;
      }
    }

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

    if (!formData.guide_id) {
      alert("Vui lòng chọn loại cây trồng");
      return;
    }

    try {
      setLoading(true);

      // Backend will auto-assign template based on guide_id → plant_group
      const notebookData = {
        notebook_name: formData.notebook_name,
        guide_id: formData.guide_id,
        planted_date: formData.planted_date,
        description: formData.description,
        cover_image: formData.cover_image,
      };

      console.log("📤 Creating notebook with data:", notebookData);

      const response = await notebookApi.createNotebook(notebookData);
      const newNotebook = response.data?.data || response.data;
      const notebookId = newNotebook._id || newNotebook.id;

      console.log("✅ Notebook created:", newNotebook);

      alert("Tạo nhật ký thành công!");
      navigate(`/farmer/notebooks/${notebookId}`);
    } catch (err) {
      console.error("❌ Error creating notebook:", err);
      alert(
        err.response?.data?.message ||
          "Không thể tạo nhật ký. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm("Bạn có chắc muốn hủy? Các thay đổi sẽ không được lưu.")
    ) {
      navigate("/farmer/notebooks");
    }
  };

  return (
    <div className="notebook-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={handleCancel}>
          ← Quay lại
        </button>
        <h1>Tạo Nhật Ký Mới</h1>
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
            <label htmlFor="guide_id">
              Chọn Loại Cây <span className="required">*</span>
            </label>
            <select
              id="guide_id"
              name="guide_id"
              value={formData.guide_id}
              onChange={(e) => {
                const selectedGuide = guides.find(
                  (g) => g._id === e.target.value
                );
                setFormData((prev) => ({
                  ...prev,
                  guide_id: e.target.value,
                  plant_type: selectedGuide ? selectedGuide.plant_name : "",
                }));
              }}
              required
            >
              <option value="">-- Chọn loại cây --</option>
              {guides.map((guide) => (
                <option key={guide._id} value={guide._id}>
                  {guide.plant_name || guide.title}
                </option>
              ))}
            </select>
            <p className="form-hint">
              🌱 Hệ thống sẽ tự động gán bộ mẫu chăm sóc dựa trên loại cây bạn
              chọn
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="planted_date">
              Ngày Trồng <span className="required">*</span>
            </label>
            <input
              type="date"
              id="planted_date"
              name="planted_date"
              value={formData.planted_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              max={new Date().toISOString().split("T")[0]}
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

          {/* Template selection is now automatic based on plant_type - dropdown hidden */}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button type="submit" className="btn btn-submit" disabled={loading}>
              {loading ? "Đang tạo..." : "🌱 Tạo Nhật Ký"}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="info-card">
        <h3>💡 Gợi Ý</h3>
        <ul>
          <li>Nhập tên dễ nhớ để quản lý nhiều nhật ký</li>
          <li>Chọn bộ mẫu phù hợp với loại cây bạn trồng</li>
          <li>Ngày trồng giúp hệ thống tính toán giai đoạn tự động</li>
          <li>Bạn có thể thêm hình ảnh và ghi chú sau khi tạo</li>
        </ul>
      </div>
    </div>
  );
};

export default NotebookCreate;
