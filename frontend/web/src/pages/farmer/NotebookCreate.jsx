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
  const [plants, setPlants] = useState([]);
  const [plantGroups, setPlantGroups] = useState([]);
  const [loadingPlantGroups, setLoadingPlantGroups] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [formData, setFormData] = useState({
    notebook_name: "",
    guide_id: "",
    plant_type: "",
    plant_group: "",
    selected_plant_id: "",
    description: "",
    planted_date: new Date().toISOString().split("T")[0],
    cover_image: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [autoMatchedTemplate, setAutoMatchedTemplate] = useState(null);
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);

  useEffect(() => {
    fetchGuidesAndPlants();
    fetchTemplates();
  }, []);

  const fetchGuidesAndPlants = async () => {
    try {
      const guidesRes = await axiosClient.get("/guides", {
        params: { limit: 1000, page: 1 },
      });
      const guidesData = guidesRes.data?.data || guidesRes.data || [];
      setGuides(
        Array.isArray(guidesData)
          ? guidesData.filter((g) => g.status === "published")
          : []
      );
    } catch (err) {
      console.error("Error fetching guides:", err);
    }

    try {
      const plantsRes = await axiosClient.get("/api/plants", {
        params: { limit: 1000 },
      });
      const plantsData = plantsRes.data?.data || plantsRes.data || [];
      setPlants(Array.isArray(plantsData) ? plantsData : []);
    } catch (err) {
      console.error("Error fetching plants:", err);
    }

    // Fetch plant groups for notebook UI (same mapping as PlantTemplateForm)
    try {
      setLoadingPlantGroups(true);
      let base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      base = base.replace(/\/+$/, "");
      const apiBase = base.endsWith("/api")
        ? base
        : base.replace(/\/api\/?$/, "").concat("/api");
      const endpoint = `${apiBase}/plant-groups`;
      const res = await axiosClient.get(endpoint.replace(/\/api\/api/, "/api"));
      const items = res.data?.data || res.data || [];

      const iconMap = {
        leaf_vegetable: "🥬",
        root_vegetable: "🥕",
        fruit_short_term: "🥒",
        fruit_long_term: "🍊",
        bean_family: "🫘",
        herb: "🌿",
        flower_vegetable: "🥦",
      };

      const mapped = Array.isArray(items)
        ? items.map((it) => ({
            // keep original plants array (if any) so frontend can show types per group
            value: it.slug || it._id,
            label: it.name || it.slug || it._id,
            icon: iconMap[it.slug] || "🌱",
            plants: Array.isArray(it.plants) ? it.plants : [],
          }))
        : [];

      setPlantGroups(mapped);
    } catch (err) {
      console.warn(
        "Could not fetch plant groups for notebook:",
        err?.message || err
      );
    } finally {
      setLoadingPlantGroups(false);
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

    if (!formData.guide_id && !formData.plant_type) {
      alert("Vui lòng chọn loại cây trồng");
      return;
    }

    try {
      setLoading(true);

      // Backend will auto-assign template based on guide_id → plant_group
      // If there is no guide_id but we have a selected plant, send plant_type and plant_group
      const notebookData = {
        notebook_name: formData.notebook_name,
        guide_id: formData.guide_id || undefined,
        planted_date: formData.planted_date,
        description: formData.description,
        cover_image: formData.cover_image,
        ...(formData.guide_id
          ? {}
          : {
              plant_type: formData.plant_type,
              plant_group: formData.plant_group,
            }),
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
            <label>
              Nhóm cây <span className="required">*</span>
            </label>
            <div className="plant-groups-grid">
              {plantGroups.map((group) => (
                <div
                  key={group.value}
                  className={`group-card ${
                    formData.plant_group === group.value ? "selected" : ""
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      plant_group: group.value,
                      // reset plant selection when group changes
                      selected_plant_id: "",
                      guide_id: "",
                      plant_type: "",
                    }))
                  }
                >
                  <div className="group-icon">{group.icon}</div>
                  <div className="group-label">{group.label}</div>
                </div>
              ))}
            </div>

            <label htmlFor="guide_id">
              Chọn Loại Cây <span className="required">*</span>
            </label>
            <select
              id="guide_id"
              name="guide_id"
              value={formData.selected_plant_id || ""}
              onChange={(e) => {
                const plantId = e.target.value;

                // First try to find a plant by its _id in global plants
                const selectedPlant = plants.find(
                  (p) => String(p._id) === String(plantId)
                );

                // If not found, try to resolve from the selected plant group's embedded plants
                let selectedGroupPlant = null;
                if (!selectedPlant && formData.plant_group) {
                  const group = plantGroups.find(
                    (g) => String(g.value) === String(formData.plant_group)
                  );
                  if (group && Array.isArray(group.plants)) {
                    selectedGroupPlant = group.plants.find(
                      (pp) =>
                        String(pp.slug) === String(plantId) ||
                        String(pp.name) === String(plantId)
                    );
                  }
                }

                // Try to find a published guide that matches this plant name (case-insensitive)
                const plantNameForGuide =
                  (selectedPlant && selectedPlant.name) ||
                  (selectedGroupPlant && selectedGroupPlant.name) ||
                  "";

                const matchedGuide = guides.find(
                  (g) =>
                    g.plant_name &&
                    plantNameForGuide &&
                    String(g.plant_name).toLowerCase() ===
                      String(plantNameForGuide).toLowerCase()
                );

                if (matchedGuide) {
                  setFormData((prev) => ({
                    ...prev,
                    guide_id: matchedGuide._id,
                    plant_type: matchedGuide.plant_name || matchedGuide.title,
                    selected_plant_id: plantId,
                    plant_group:
                      (selectedPlant &&
                        (selectedPlant.plant_group_slug ||
                          selectedPlant.plant_group)) ||
                      formData.plant_group ||
                      "",
                  }));
                } else if (selectedPlant) {
                  setFormData((prev) => ({
                    ...prev,
                    guide_id: "",
                    plant_type: selectedPlant.name,
                    plant_group:
                      selectedPlant.plant_group_slug ||
                      selectedPlant.plant_group ||
                      "",
                    selected_plant_id: plantId,
                  }));
                } else if (selectedGroupPlant) {
                  setFormData((prev) => ({
                    ...prev,
                    guide_id: "",
                    plant_type: selectedGroupPlant.name,
                    plant_group: formData.plant_group || "",
                    selected_plant_id: plantId,
                  }));
                } else {
                  setFormData((prev) => ({
                    ...prev,
                    guide_id: "",
                    plant_type: "",
                    plant_group: "",
                    selected_plant_id: "",
                  }));
                }
              }}
              required
            >
              <option value="">-- Chọn loại cây --</option>

              {/* If current plant group provides an embedded list, render those first */}
              {formData.plant_group &&
                (() => {
                  const group = plantGroups.find(
                    (g) => String(g.value) === String(formData.plant_group)
                  );
                  if (
                    group &&
                    Array.isArray(group.plants) &&
                    group.plants.length
                  ) {
                    return group.plants.map((pp) => (
                      <option
                        key={pp.slug || pp.name}
                        value={pp.slug || pp.name}
                      >
                        {pp.name}
                      </option>
                    ));
                  }

                  // Fallback: use global plants filtered by group
                  return plants
                    .filter((p) =>
                      formData.plant_group
                        ? (p.plant_group_slug || p.plant_group) ===
                          formData.plant_group
                        : true
                    )
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ));
                })()}
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
          <li>Ngày trồng giúp hệ thống tính toán giai đoạn tự động</li>
          <li>Bạn có thể thêm hình ảnh và ghi chú sau khi tạo</li>
        </ul>
      </div>
    </div>
  );
};

export default NotebookCreate;
