import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import plantTemplateApi from "../../api/expert/plantTemplateApi";
import guidesApi from "../../api/shared/guidesApi";
import "../../css/expert/PlantTemplateForm.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PlantTemplateForm = ({ mode = "create" }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    template_name: "",
    plant_group: "leaf_vegetable",
    group_description: "",
    plant_examples: [],
    cover_image: null,
    stages: [],
    status: "draft",
    notes: "",
  });

  const [tempInput, setTempInput] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [availableGuides, setAvailableGuides] = useState([]);
  const [availablePlants, setAvailablePlants] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [showPlantDropdown, setShowPlantDropdown] = useState(false);

  const [plantGroups, setPlantGroups] = useState([
    { value: "leaf_vegetable", label: "Rau ăn lá", icon: "🥬" },
    { value: "root_vegetable", label: "Cây củ", icon: "🥕" },
    { value: "fruit_short_term", label: "Rau/quả ngắn ngày", icon: "🥒" },
    { value: "fruit_long_term", label: "Cây ăn quả dài ngày", icon: "🍊" },
    { value: "bean_family", label: "Họ đậu", icon: "🫘" },
    { value: "herb", label: "Cây gia vị", icon: "🌿" },
    { value: "flower_vegetable", label: "Rau ăn hoa", icon: "🥦" },
    { value: "other", label: "Khác", icon: "🌱" },
  ]);
  const [loadingPlantGroups, setLoadingPlantGroups] = useState(false);

  const steps = [
    { number: 1, title: "Thông tin cơ bản", icon: "📝" },
    { number: 2, title: "Giai đoạn phát triển", icon: "🌱" },
    { number: 3, title: "Nhiệm vụ tự động", icon: "✅" },
    { number: 4, title: "Điều kiện quan sát", icon: "👁️" },
    { number: 5, title: "Xác nhận", icon: "⚙️" },
  ];

  useEffect(() => {
    if (mode === "edit" && id) {
      loadTemplate();
    }
    fetchAvailableGuides();
    fetchPlantGroupsFromApi();
  }, [mode, id]);

  const fetchPlantGroupsFromApi = async () => {
    try {
      setLoadingPlantGroups(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");

      // Build endpoint robustly: allow API_URL to be either with or without trailing '/api'
      let base = API_URL || "http://localhost:5000";
      base = base.replace(/\/+$/, "");
      const apiBase = base.endsWith("/api") ? base : `${base}/api`;
      const endpoint = `${apiBase}/plant-groups`;

      const res = await axios.get(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const items = res.data?.data || [];

      // Map API objects { _id, name, slug } to expected { value, label, icon }
      const iconMap = {
        leaf_vegetable: "🥬",
        root_vegetable: "🥕",
        fruit_short_term: "🥒",
        fruit_long_term: "🍊",
        bean_family: "🫘",
        herb: "🌿",
        flower_vegetable: "🥦",
      };

      if (items.length > 0) {
        const mapped = items.map((it) => ({
          value: it.slug || it._id,
          label: it.name || it.slug || it._id,
          icon: iconMap[it.slug] || "🌱",
          plants: Array.isArray(it.plants) ? it.plants : [],
        }));
        setPlantGroups(mapped);
      }
    } catch (err) {
      console.warn(
        "Could not fetch plant groups, using defaults:",
        err?.message || err
      );
    } finally {
      setLoadingPlantGroups(false);
    }
  };

  const fetchAvailableGuides = async () => {
    // We now source plant examples from the plants collection via /api/plants
    try {
      setLoadingGuides(true);

      let base = API_URL || "http://localhost:5000";
      base = base.replace(/\/+$/, "");
      const apiBase = base.endsWith("/api") ? base : `${base}/api`;
      const endpoint = `${apiBase}/plants?limit=1000`;

      console.log("🔍 Fetching plants from API...", endpoint);
      const res = await axios.get(endpoint);
      const plants = res.data?.data || [];
      console.log("📦 Plants response count:", plants.length);

      // keep full plant objects for filtering by group
      setAvailablePlants(Array.isArray(plants) ? plants : []);

      const plantNames = (Array.isArray(plants) ? plants : [])
        .map((p) => p.name)
        .filter((n) => n && n.toString().trim())
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort();

      setAvailableGuides(plantNames);
    } catch (err) {
      console.error("❌ Error fetching plants:", err);
    } finally {
      setLoadingGuides(false);
    }
  };

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await plantTemplateApi.getTemplateById(id);
      const template = response.data?.data?.template;
      if (template) {
        setFormData({
          template_name: template.template_name,
          plant_group: template.plant_group,
          group_description: template.group_description || "",
          plant_examples: template.plant_examples || [],
          cover_image: template.cover_image || null,
          stages: template.stages || [],
          status: template.status || "draft",
          notes: template.notes || "",
        });
      }
    } catch (err) {
      console.error("Error loading template:", err);
      setError("Không thể tải bộ mẫu");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // rules were removed from template model; no rule-change handler required

  const handleCoverImageUpload = async (file) => {
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      setUploadingCover(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const baseURL = API_URL.replace("/api", "");
      const response = await axios.post(`${API_URL}/upload`, formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = response.data?.data?.url;
      if (imageUrl) {
        const fullImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${baseURL}${imageUrl}`;
        setFormData((prev) => ({ ...prev, cover_image: fullImageUrl }));
      }
    } catch (error) {
      console.error("Error uploading cover image:", error);
      alert("Không thể upload ảnh bìa. Vui lòng thử lại.");
    } finally {
      setUploadingCover(false);
    }
  };

  const addPlantExample = () => {
    if (tempInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        plant_examples: [...prev.plant_examples, tempInput.trim()],
      }));
      setTempInput("");
    }
  };

  const addPlantExampleFromDropdown = (plantName) => {
    if (plantName && !formData.plant_examples.includes(plantName)) {
      setFormData((prev) => ({
        ...prev,
        plant_examples: [...prev.plant_examples, plantName],
      }));
    }
    setShowPlantDropdown(false);
  };

  const removePlantExample = (index) => {
    setFormData((prev) => ({
      ...prev,
      plant_examples: prev.plant_examples.filter((_, i) => i !== index),
    }));
  };

  const addStage = () => {
    const newStageNumber = formData.stages.length + 1;
    const lastStage = formData.stages[formData.stages.length - 1];
    const dayStart = lastStage ? lastStage.day_end + 1 : 1;

    setFormData((prev) => ({
      ...prev,
      stages: [
        ...prev.stages,
        {
          stage_number: newStageNumber,
          name: "",
          description: "",
          day_start: dayStart,
          day_end: dayStart + 6,
          stage_image: null,
          autogenerated_tasks: [],
          observation_required: [],
        },
      ],
    }));
  };

  const updateStage = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === index ? { ...stage, [field]: value } : stage
      ),
    }));
  };

  const removeStage = (index) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages
        .filter((_, i) => i !== index)
        .map((stage, i) => ({ ...stage, stage_number: i + 1 })),
    }));
  };

  const addTaskToStage = (stageIndex) => {
    const newTask = {
      task_name: "",
      description: "",
      frequency: "daily",
      illustration_image: null,
      priority: "medium",
    };

    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              autogenerated_tasks: [...stage.autogenerated_tasks, newTask],
            }
          : stage
      ),
    }));
  };

  const updateTask = (stageIndex, taskIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              autogenerated_tasks: stage.autogenerated_tasks.map((task, j) =>
                j === taskIndex ? { ...task, [field]: value } : task
              ),
            }
          : stage
      ),
    }));
  };

  const removeTask = (stageIndex, taskIndex) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              autogenerated_tasks: stage.autogenerated_tasks.filter(
                (_, j) => j !== taskIndex
              ),
            }
          : stage
      ),
    }));
  };

  const addObservationToStage = (stageIndex) => {
    const newObservation = {
      key: "",
      label: "",
      description: "",
    };

    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              observation_required: [
                ...stage.observation_required,
                newObservation,
              ],
            }
          : stage
      ),
    }));
  };

  const updateObservation = (stageIndex, obsIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              observation_required: stage.observation_required.map((obs, j) =>
                j === obsIndex ? { ...obs, [field]: value } : obs
              ),
            }
          : stage
      ),
    }));
  };

  const removeObservation = (stageIndex, obsIndex) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.map((stage, i) =>
        i === stageIndex
          ? {
              ...stage,
              observation_required: stage.observation_required.filter(
                (_, j) => j !== obsIndex
              ),
            }
          : stage
      ),
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.template_name.trim()) {
          setError("Vui lòng nhập tên bộ mẫu");
          return false;
        }
        if (!formData.plant_group) {
          setError("Vui lòng chọn nhóm cây");
          return false;
        }
        break;
      case 2:
        if (formData.stages.length < 3) {
          setError("Bộ mẫu phải có ít nhất 3 giai đoạn");
          return false;
        }
        for (let stage of formData.stages) {
          if (!stage.name.trim()) {
            setError(`Giai đoạn ${stage.stage_number} chưa có tên`);
            return false;
          }
          if (stage.day_start >= stage.day_end) {
            setError(
              `Giai đoạn ${stage.stage_number}: Ngày bắt đầu phải nhỏ hơn ngày kết thúc`
            );
            return false;
          }
        }
        break;
      case 3:
        // Tasks validation (optional)
        break;
      case 4:
        // Observations validation (optional)
        break;
    }
    setError(null);
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);

      if (mode === "edit") {
        await plantTemplateApi.updateTemplate(id, formData);
        alert("Cập nhật bộ mẫu thành công!");
      } else {
        await plantTemplateApi.createTemplate(formData);
        alert("Tạo bộ mẫu thành công!");
      }

      navigate("/expert/plant-templates");
    } catch (err) {
      console.error("Error saving template:", err);
      setError(err.response?.data?.message || "Không thể lưu bộ mẫu");
    } finally {
      setLoading(false);
    }
  };

  if (loading && mode === "edit") {
    return (
      <div className="plant-template-form">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plant-template-form">
      <div className="form-container">
        <div className="form-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <h1>{mode === "edit" ? "Chỉnh sửa" : "Tạo mới"} Bộ mẫu cây trồng</h1>
        </div>

        {/* Steps Progress */}
        <div className="steps-progress">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`step-item ${
                currentStep === step.number ? "active" : ""
              } ${currentStep > step.number ? "completed" : ""}`}
            >
              <div className="step-number">
                {currentStep > step.number ? "✓" : step.icon}
              </div>
              <div className="step-title">{step.title}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="icon">⚠️</span>
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="step-content">
          {currentStep === 1 && (
            <Step1BasicInfo
              formData={formData}
              handleInputChange={handleInputChange}
              plantGroups={plantGroups}
              tempInput={tempInput}
              setTempInput={setTempInput}
              addPlantExample={addPlantExample}
              removePlantExample={removePlantExample}
              uploadingCover={uploadingCover}
              handleCoverImageUpload={handleCoverImageUpload}
              availableGuides={availableGuides}
              loadingGuides={loadingGuides}
              showPlantDropdown={showPlantDropdown}
              setShowPlantDropdown={setShowPlantDropdown}
              addPlantExampleFromDropdown={addPlantExampleFromDropdown}
            />
          )}

          {currentStep === 2 && (
            <Step2Stages
              stages={formData.stages}
              addStage={addStage}
              updateStage={updateStage}
              removeStage={removeStage}
            />
          )}

          {currentStep === 3 && (
            <Step3Tasks
              stages={formData.stages}
              addTaskToStage={addTaskToStage}
              updateTask={updateTask}
              removeTask={removeTask}
            />
          )}

          {currentStep === 4 && (
            <Step4Observations
              stages={formData.stages}
              addObservationToStage={addObservationToStage}
              updateObservation={updateObservation}
              removeObservation={removeObservation}
            />
          )}

          {currentStep === 5 && (
            <Step5Review
              formData={formData}
              handleInputChange={handleInputChange}
              plantGroups={plantGroups}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="form-navigation">
          <button
            className="btn btn-secondary"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
          >
            ← QUAY LẠI
          </button>

          <div className="nav-info">
            BƯỚC {currentStep} / {steps.length}
          </div>

          {currentStep < 5 ? (
            <button className="btn btn-primary" onClick={nextStep}>
              TIẾP THEO →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? "Đang lưu..."
                : mode === "edit"
                ? "Cập nhật"
                : "Tạo template"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Step 1: Basic Info Component
const Step1BasicInfo = ({
  formData,
  handleInputChange,
  plantGroups,
  tempInput,
  setTempInput,
  addPlantExample,
  removePlantExample,
  uploadingCover,
  handleCoverImageUpload,
  availableGuides,
  loadingGuides,
  showPlantDropdown,
  setShowPlantDropdown,
  addPlantExampleFromDropdown,
}) => (
  <div className="step-basic-info">
    <h2>THÔNG TIN CƠ BẢN</h2>

    <div className="form-group">
      <label>
        TÊN BỘ MẪU <span className="required">*</span>
      </label>
      <input
        type="text"
        className="form-input"
        placeholder="Ví dụ: Rau ăn lá cơ bản"
        value={formData.template_name}
        onChange={(e) => handleInputChange("template_name", e.target.value)}
      />
    </div>

    <div className="form-group">
      <label>
        NHÓM CÂY <span className="required">*</span>
      </label>
      <div className="plant-groups-grid">
        {plantGroups.map((group) => (
          <div
            key={group.value}
            className={`group-card ${
              formData.plant_group === group.value ? "selected" : ""
            }`}
            onClick={() => handleInputChange("plant_group", group.value)}
          >
            <div className="group-icon">{group.icon}</div>
            <div className="group-label">{group.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="form-group">
      <label>MÔ TẢ</label>
      <textarea
        className="form-textarea"
        rows="3"
        placeholder="Mô tả"
        value={formData.group_description}
        onChange={(e) => handleInputChange("group_description", e.target.value)}
      />
    </div>

    <div className="form-group">
      <label>🌱 CÁC LOẠI CÂY PHÙ HỢP</label>
      <p className="hint">CHỎN CÁC LOẠI CÂY TỪ DANH SÁCH CÓ SẴN</p>

      <div className="plant-selector">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setShowPlantDropdown(!showPlantDropdown)}
          disabled={loadingGuides}
        >
          {loadingGuides ? "ĐANG TẢI..." : "➕ CHỎN CÂY TỪ DANH SÁCH"}
        </button>

        {showPlantDropdown && (
          <div className="plant-dropdown">
            <div className="plant-dropdown-header">
              <input
                type="text"
                className="form-input"
                placeholder="Tìm kiếm cây..."
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
              />
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowPlantDropdown(false);
                  setTempInput("");
                }}
              >
                ✕
              </button>
            </div>
            <div className="plant-dropdown-list">
              {(() => {
                // If current plant group provides embedded plants, use them
                if (formData.plant_group) {
                  const group = plantGroups.find(
                    (g) => String(g.value) === String(formData.plant_group)
                  );
                  if (
                    group &&
                    Array.isArray(group.plants) &&
                    group.plants.length
                  ) {
                    const filtered = group.plants
                      .map((pp) => pp.name)
                      .filter(
                        (n) =>
                          n &&
                          n
                            .toString()
                            .toLowerCase()
                            .includes(tempInput.toLowerCase())
                      );
                    if (filtered.length === 0) {
                      return (
                        <div className="plant-dropdown-empty">
                          Không có cây thuộc nhóm này
                        </div>
                      );
                    }
                    return filtered.map((plant, index) => (
                      <div
                        key={index}
                        className={`plant-dropdown-item ${
                          formData.plant_examples.includes(plant)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => addPlantExampleFromDropdown(plant)}
                      >
                        <span>{plant}</span>
                        {formData.plant_examples.includes(plant) && (
                          <span className="check-icon">✓</span>
                        )}
                      </div>
                    ));
                  }
                }

                // Fallback: use global availablePlants filtered by group (if any)
                const pool =
                  Array.isArray(availablePlants) && availablePlants.length
                    ? availablePlants
                    : [];
                const poolFiltered = pool
                  .filter((p) =>
                    tempInput && tempInput.trim()
                      ? p.name.toLowerCase().includes(tempInput.toLowerCase())
                      : true
                  )
                  .filter((p) =>
                    formData.plant_group
                      ? (p.plant_group_slug || p.plant_group) ===
                        formData.plant_group
                      : true
                  );

                if (poolFiltered.length === 0) {
                  return (
                    <div className="plant-dropdown-empty">
                      Không có dữ liệu cây từ guides
                    </div>
                  );
                }

                return poolFiltered.map((p, index) => (
                  <div
                    key={p._id || index}
                    className={`plant-dropdown-item ${
                      formData.plant_examples.includes(p.name) ? "selected" : ""
                    }`}
                    onClick={() => addPlantExampleFromDropdown(p.name)}
                  >
                    <span>{p.name}</span>
                    {formData.plant_examples.includes(p.name) && (
                      <span className="check-icon">✓</span>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>

      {formData.plant_examples.length > 0 && (
        <div className="tags-list">
          {formData.plant_examples.map((example, index) => (
            <span key={index} className="tag">
              {example}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removePlantExample(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="form-group">
      <label>📸 ẢNH BÌA BỘ MẪU</label>
      <div className="upload-area">
        <label className="upload-label">
          {uploadingCover ? (
            <div className="uploading">
              <div className="spinner-upload"></div>
              <span>Đang upload...</span>
            </div>
          ) : formData.cover_image ? (
            <div className="image-uploaded">
              <img src={formData.cover_image} alt="Cover" />
              <div className="image-actions">
                <button
                  type="button"
                  className="btn-change-image"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("cover-image-input").click();
                  }}
                >
                  🔄 Thay đổi
                </button>
                <button
                  type="button"
                  className="btn-remove-image"
                  onClick={(e) => {
                    e.preventDefault();
                    handleInputChange("cover_image", null);
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">🖼️</div>
              <div className="upload-text">
                <strong>Click để chọn ảnh bìa</strong>
                <span>Ảnh này sẽ hiển thị trong danh sách bộ mẫu</span>
              </div>
              <div className="upload-hint">PNG, JPG, JPEG (tối đa 5MB)</div>
            </div>
          )}
          <input
            id="cover-image-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleCoverImageUpload(e.target.files[0])}
            disabled={uploadingCover}
          />
        </label>
      </div>
    </div>

    {/* <div className="form-group">
      <label>Ví dụ cây thuộc nhóm</label>
      <div className="input-with-button">
        <input
          type="text"
          className="form-input"
          placeholder="Nhập tên cây, ví dụ: Xà lách"
          value={tempInput}
          onChange={(e) => setTempInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addPlantExample()}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={addPlantExample}
        >
          Thêm
        </button>
      </div>

      {formData.plant_examples.length > 0 && (
        <div className="tags-list">
          {formData.plant_examples.map((example, index) => (
            <span key={index} className="tag">
              {example}
              <button
                type="button"
                className="tag-remove"
                onClick={() => removePlantExample(index)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div> */}
  </div>
);

// Step 2: Stages Setup with Image Upload
const Step2Stages = ({ stages, addStage, updateStage, removeStage }) => {
  const [uploadingStage, setUploadingStage] = useState(null);

  const handleStageImageUpload = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadingStage(index);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const baseURL = API_URL.replace("/api", "");
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = response.data?.data?.url;
      if (imageUrl) {
        // Add base URL if it's a relative path
        const fullImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${baseURL}${imageUrl}`;
        updateStage(index, "stage_image", fullImageUrl);
      }
    } catch (error) {
      console.error("Error uploading stage image:", error);
      alert("Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingStage(null);
    }
  };

  return (
    <div className="step-stages">
      <div className="step-header">
        <h2>🌱 GIAI ĐOẠN PHÁT TRIỂN</h2>
        <p className="hint">
          BỘ MẪU CẦN CÓ ÍT NHẤT 3 GIAI ĐOẠN. BẠN CÓ THỂ UPLOAD ẢNH MẪU CHO MỖI
          GIAI ĐOẠN.
        </p>
      </div>

      {stages.map((stage, index) => (
        <div key={index} className="stage-card">
          <div className="stage-card-header">
            <h3>Giai đoạn {stage.stage_number}</h3>
            <button
              type="button"
              className="btn-icon btn-danger"
              onClick={() => {
                // Nếu xóa sẽ khiến tổng giai đoạn < 3 thì cảnh báo người dùng
                if (stages.length <= 3) {
                  const confirmDelete = window.confirm(
                    "Bạn sắp xóa giai đoạn. Lưu ý: Bộ mẫu cần ít nhất 3 giai đoạn để lưu. Bạn vẫn muốn xóa?"
                  );
                  if (!confirmDelete) return;
                }

                removeStage(index);
              }}
              title="Xóa giai đoạn"
            >
              🗑️
            </button>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label>
                TÊN GIAI ĐOẠN <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Nảy mầm"
                value={stage.name}
                onChange={(e) => updateStage(index, "name", e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>MÔ TẢ GIAI ĐOẠN</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Mô tả chi tiết về giai đoạn này..."
              value={stage.description}
              onChange={(e) =>
                updateStage(index, "description", e.target.value)
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                NGÀY BẮT ĐẦU <span className="required">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                min="1"
                value={stage.day_start}
                onChange={(e) =>
                  updateStage(index, "day_start", parseInt(e.target.value))
                }
              />
            </div>

            <div className="form-group">
              <label>
                NGÀY KẾT THÚC <span className="required">*</span>
              </label>
              <input
                type="number"
                className="form-input"
                min={stage.day_start + 1}
                value={stage.day_end}
                onChange={(e) =>
                  updateStage(index, "day_end", parseInt(e.target.value))
                }
              />
            </div>

            <div className="form-group">
              <label>TỔNG NGÀY</label>
              <div className="form-static">
                {stage.day_end - stage.day_start + 1} NGÀY
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>📸 ẢNH MẪU GIAI ĐOẠN</label>
            <div className="upload-area">
              <div className="upload-icon">🖼️</div>
              <label className="upload-label">
                {uploadingStage === index ? (
                  <div className="uploading">
                    <div className="spinner-upload"></div>
                    <span>Đang upload...</span>
                  </div>
                ) : stage.stage_image ? (
                  <div className="image-uploaded">
                    <img
                      src={stage.stage_image}
                      alt={`Stage ${stage.stage_number}`}
                    />
                    <div className="image-actions">
                      <button
                        type="button"
                        className="btn-change-image"
                        onClick={(e) => {
                          e.preventDefault();
                          document
                            .getElementById(`stage-image-${index}`)
                            .click();
                        }}
                      >
                        🔄 Thay đổi
                      </button>
                      <button
                        type="button"
                        className="btn-remove-image"
                        onClick={(e) => {
                          e.preventDefault();
                          updateStage(index, "stage_image", null);
                        }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="upload-placeholder">
                    <div className="upload-icon">📁</div>
                    <div className="upload-text">
                      <strong>Click để chọn ảnh</strong>
                      <span>hoặc kéo thả ảnh vào đây</span>
                    </div>
                    <div className="upload-hint">
                      PNG, JPG, JPEG (tối đa 5MB)
                    </div>
                  </div>
                )}
                <input
                  id={`stage-image-${index}`}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) =>
                    handleStageImageUpload(index, e.target.files[0])
                  }
                  disabled={uploadingStage === index}
                />
              </label>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline btn-block"
        onClick={addStage}
      >
        + Thêm giai đoạn
      </button>
    </div>
  );
};

// Step 3: Tasks with Image Upload
const Step3Tasks = ({ stages, addTaskToStage, updateTask, removeTask }) => {
  const [uploadingTask, setUploadingTask] = useState(null);

  const handleTaskImageUpload = async (stageIndex, taskIndex, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploadingTask(`${stageIndex}-${taskIndex}`);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const baseURL = API_URL.replace("/api", "");
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const imageUrl = response.data?.data?.url;
      if (imageUrl) {
        // Add base URL if it's a relative path
        const fullImageUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `${baseURL}${imageUrl}`;
        updateTask(stageIndex, taskIndex, "illustration_image", fullImageUrl);
      }
    } catch (error) {
      console.error("Error uploading task image:", error);
      alert("Không thể upload ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingTask(null);
    }
  };

  return (
    <div className="step-tasks">
      <div className="step-header">
        <h2>✅ Nhiệm vụ tự động</h2>
        <p className="hint">
          Các nhiệm vụ này sẽ được tự động sinh ra cho người dùng mỗi ngày
        </p>
      </div>

      {stages.map((stage, stageIndex) => (
        <div key={stageIndex} className="stage-section">
          <div className="stage-section-header">
            <h3>
              Giai đoạn {stage.stage_number}: {stage.name}
            </h3>
            <span className="badge">
              {stage.autogenerated_tasks?.length || 0} nhiệm vụ
            </span>
          </div>

          {stage.autogenerated_tasks?.map((task, taskIndex) => (
            <div key={taskIndex} className="task-card">
              <div className="task-card-header">
                <span className="task-number">Nhiệm vụ {taskIndex + 1}</span>
                <button
                  type="button"
                  className="btn-icon btn-sm"
                  onClick={() => {
                    const confirmDelete = window.confirm(
                      "Bạn có chắc muốn xóa nhiệm vụ này? Hành động này không thể hoàn tác."
                    );
                    if (!confirmDelete) return;
                    removeTask(stageIndex, taskIndex);
                  }}
                  title="Xóa nhiệm vụ"
                >
                  ×
                </button>
              </div>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>TÊN NHIỆM VỤ</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ví dụ: Tưới nước"
                    value={task.task_name}
                    onChange={(e) =>
                      updateTask(
                        stageIndex,
                        taskIndex,
                        "task_name",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group flex-1">
                  <label>TẦN SUẤT</label>
                  <select
                    className="form-select"
                    value={task.frequency}
                    onChange={(e) =>
                      updateTask(
                        stageIndex,
                        taskIndex,
                        "frequency",
                        e.target.value
                      )
                    }
                  >
                    <option value="daily">HÀNG NGÀY</option>
                    <option value="every_2_days">2 NGÀY/LẦN</option>
                    <option value="every_3_days">3 NGÀY/LẦN</option>
                    <option value="weekly">HÀNG TUẦN</option>
                    <option value="once">MỘT LẦN (CHỈ XUẤT HIỆN 1 LẦN)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label>ĐỘ ƯU TIÊN</label>
                  <select
                    className="form-select"
                    value={task.priority}
                    onChange={(e) =>
                      updateTask(
                        stageIndex,
                        taskIndex,
                        "priority",
                        e.target.value
                      )
                    }
                  >
                    <option value="low">THẤP</option>
                    <option value="medium">TRUNG BÌNH</option>
                    <option value="high">CAO</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>MÔ TẢ</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="MÔ TẢ CHI TIẼT NHIỆM VỤ..."
                  value={task.description}
                  onChange={(e) =>
                    updateTask(
                      stageIndex,
                      taskIndex,
                      "description",
                      e.target.value
                    )
                  }
                />
              </div>

              <div className="form-group">
                <label>📸 ẢNH MINH HỌA NHIỆM VỤ</label>
                <div className="upload-area upload-area-sm">
                  <label className="upload-label">
                    {uploadingTask === `${stageIndex}-${taskIndex}` ? (
                      <div className="uploading">
                        <div className="spinner-upload"></div>
                        <span>Đang upload...</span>
                      </div>
                    ) : task.illustration_image ? (
                      <div className="image-uploaded">
                        <img
                          src={task.illustration_image}
                          alt={`Task ${taskIndex + 1}`}
                        />
                        <div className="image-actions">
                          <button
                            type="button"
                            className="btn-change-image"
                            onClick={(e) => {
                              e.preventDefault();
                              document
                                .getElementById(
                                  `task-image-${stageIndex}-${taskIndex}`
                                )
                                .click();
                            }}
                          >
                            🔄 Thay đổi
                          </button>
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={(e) => {
                              e.preventDefault();
                              updateTask(
                                stageIndex,
                                taskIndex,
                                "illustration_image",
                                null
                              );
                            }}
                          >
                            🗑️ Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-placeholder upload-placeholder-sm">
                        <div className="upload-icon">📁</div>
                        <div className="upload-text">
                          <strong>Click để chọn ảnh</strong>
                        </div>
                      </div>
                    )}
                    <input
                      id={`task-image-${stageIndex}-${taskIndex}`}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) =>
                        handleTaskImageUpload(
                          stageIndex,
                          taskIndex,
                          e.target.files[0]
                        )
                      }
                      disabled={uploadingTask === `${stageIndex}-${taskIndex}`}
                    />
                  </label>
                </div>
              </div>
            </div>
          ))}

          <div className="tasks-actions-row">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => addTaskToStage(stageIndex)}
            >
              + Thêm nhiệm vụ
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm btn-danger"
              onClick={() => {
                const tasks = stage.autogenerated_tasks || [];
                if (tasks.length === 0) return;
                const lastIndex = tasks.length - 1;
                const confirmDelete = window.confirm(
                  "Bạn sắp xóa nhiệm vụ vừa thêm. Bạn có chắc chắn?"
                );
                if (!confirmDelete) return;
                removeTask(stageIndex, lastIndex);
              }}
              title="Xóa nhiệm vụ cuối"
            >
              ⤺ Hoàn tác
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Step 4: Observations
const Step4Observations = ({
  stages,
  addObservationToStage,
  updateObservation,
  removeObservation,
}) => (
  <div className="step-observations">
    <div className="step-header">
      <h2>👁️ ĐIỀU KIỆN QUAN SÁT</h2>
      <p className="hint">
        CÁC ĐIỀU KIỆN QUAN SÁT ĐỂ THEO DÕI TIẾN ĐỘ PHÁT TRIỂN CỦA CÂY
      </p>
    </div>

    {stages.map((stage, stageIndex) => (
      <div key={stageIndex} className="stage-section">
        <div className="stage-section-header">
          <h3>
            GIAI ĐOẠN {stage.stage_number}: {stage.name.toUpperCase()}
          </h3>
          <span className="badge">
            {stage.observation_required?.length || 0} ĐIỀU KIỆN
          </span>
        </div>

        {stage.observation_required?.map((obs, obsIndex) => (
          <div key={obsIndex} className="observation-card">
            <div className="observation-card-header">
              <span className="obs-number">ĐIỀU KIỆN {obsIndex + 1}</span>
              <button
                type="button"
                className="btn-icon btn-sm"
                onClick={() => {
                  const confirmDelete = window.confirm(
                    "Bạn có chắc muốn xóa điều kiện quan sát này? Hành động này không thể hoàn tác."
                  );
                  if (!confirmDelete) return;
                  removeObservation(stageIndex, obsIndex);
                }}
                title="Xóa điều kiện"
              >
                ×
              </button>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>KEY (ĐỊNH DANH)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: has_sprout"
                  value={obs.key}
                  onChange={(e) =>
                    updateObservation(
                      stageIndex,
                      obsIndex,
                      "key",
                      e.target.value
                    )
                  }
                />
                <small className="hint">Dùng snake_case, không dấu</small>
              </div>

              <div className="form-group flex-1">
                <label>CÂU HỊI HIỂN THỊ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Đã nảy mầm?"
                  value={obs.label}
                  onChange={(e) =>
                    updateObservation(
                      stageIndex,
                      obsIndex,
                      "label",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Mô tả</label>
              <input
                type="text"
                className="form-input"
                placeholder="Mô tả chi tiết để user dễ quan sát"
                value={obs.description}
                onChange={(e) =>
                  updateObservation(
                    stageIndex,
                    obsIndex,
                    "description",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        ))}

        <div className="observations-actions-row">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => addObservationToStage(stageIndex)}
          >
            + Thêm điều kiện quan sát
          </button>

          <button
            type="button"
            className="btn btn-outline btn-sm btn-danger"
            onClick={() => {
              const obs = stage.observation_required || [];
              if (obs.length === 0) return;
              const lastIndex = obs.length - 1;
              const confirmDelete = window.confirm(
                "Bạn sắp xóa điều kiện vừa thêm. Bạn có chắc chắn?"
              );
              if (!confirmDelete) return;
              removeObservation(stageIndex, lastIndex);
            }}
            title="Xóa điều kiện cuối"
          >
            ⤺ Hoàn tác
          </button>
        </div>
      </div>
    ))}
  </div>
);

// Step 5: Review (confirmation)
const Step5Review = ({ formData, handleInputChange, plantGroups }) => (
  <div className="step-review">
    <div className="step-header">
      <h2>🔎 XÁC NHẬN</h2>
      <p className="hint">XEM LẠI TOÀN BỘ MẪU TRƯỚC KHI LƯU</p>
    </div>

    <div className="section">
      <h3>📋 TRẠNG THÁI & GHI CHÚ</h3>

      <div className="form-group">
        <label>TRẠNG THÁI</label>
        <select
          className="form-select"
          value={formData.status}
          onChange={(e) => handleInputChange("status", e.target.value)}
        >
          <option value="draft">NHÁP (DRAFT)</option>
          <option value="active">HOẠT ĐỘNG (ACTIVE)</option>
        </select>
      </div>

      <div className="form-group">
        <label>GHI CHÚ</label>
        <textarea
          className="form-textarea"
          rows="3"
          placeholder="GHI CHÚ THÊM VỀ BỘ MẪU NÀY..."
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
        />
      </div>
    </div>

    <div className="section">
      <h3>📊 TỔNG QUAN BỘ MẪU</h3>
      <div className="summary-grid">
        <div className="summary-item">
          <div className="summary-label">TÊN BỘ MẪU</div>
          <div className="summary-value">{formData.template_name}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">NHÓM CÂY</div>
          <div className="summary-value">
            {plantGroups.find((g) => g.value === formData.plant_group)?.label ||
              formData.plant_group}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">SỐ GIAI ĐOẠN</div>
          <div className="summary-value">{formData.stages.length}</div>
        </div>
        <div className="summary-item">
          <div className="summary-label">TỔNG NGÀY</div>
          <div className="summary-value">
            {formData.stages.length > 0
              ? Math.max(...formData.stages.map((s) => s.day_end))
              : 0}{" "}
            ngày
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">TỔNG NHIỆM VỤ</div>
          <div className="summary-value">
            {formData.stages.reduce(
              (sum, stage) => sum + (stage.autogenerated_tasks?.length || 0),
              0
            )}
          </div>
        </div>
        <div className="summary-item">
          <div className="summary-label">TỔNG ĐIỀU KIỆN</div>
          <div className="summary-value">
            {formData.stages.reduce(
              (sum, stage) => sum + (stage.observation_required?.length || 0),
              0
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Continue with other step components in next file...
export default PlantTemplateForm;
