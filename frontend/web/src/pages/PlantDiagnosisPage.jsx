// src/pages/PlantDiagnosisPage.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import plantApi from "../api/plantApi"; // chỉnh lại path nếu khác
import Header from "../components/shared/Header";

// Mapping “vấn đề sức khỏe” -> tiếng Việt + hướng dẫn
const mapIssueToVi = (name) => {
  if (!name) {
    return {
      viTitle: "Vấn đề khác",
      viAdvice:
        "Quan sát thêm lá, thân và giá thể; điều chỉnh tưới nước, ánh sáng và dinh dưỡng từ từ, tránh thay đổi đột ngột.",
    };
  }

  const key = name.toLowerCase();

  if (key.includes("abiotic")) {
    return {
      viTitle: "Tác nhân phi sinh học (abiotic)",
      viAdvice:
        "Xem lại điều kiện tưới, ánh sáng, nhiệt độ, gió, độ ẩm và giá thể; điều chỉnh từng yếu tố một cách từ từ.",
    };
  }

  if (key.includes("senescence")) {
    return {
      viTitle: "Lão hóa tự nhiên (senescence)",
      viAdvice:
        "Lá già vàng và rụng là quá trình tự nhiên; cắt bỏ lá quá già, đồng thời quan sát thêm toàn bộ cây để loại trừ bệnh hại.",
    };
  }

  if (key.includes("nutrient") && !key.includes("nitrogen")) {
    return {
      viTitle: "Thiếu dinh dưỡng",
      viAdvice:
        "Bổ sung dinh dưỡng đa, trung, vi lượng (NPK, phân hữu cơ hoai mục) với liều lượng hợp lý, kết hợp tưới đủ ẩm.",
    };
  }

  if (key.includes("nutrition")) {
    return {
      viTitle: "Vấn đề liên quan đến dinh dưỡng",
      viAdvice:
        "Kiểm tra lại lịch bón phân, pH giá thể và khả năng thoát nước; hạn chế bón tập trung một chỗ hoặc quá liều.",
    };
  }

  if (key.includes("water-related")) {
    return {
      viTitle: "Vấn đề liên quan đến nước",
      viAdvice:
        "Quan sát thêm lá, thân và giá thể; điều chỉnh tưới nước, ánh sáng và dinh dưỡng từ từ, tránh thay đổi đột ngột.",
    };
  }

  if (key.includes("water excess") || key.includes("uneven watering")) {
    return {
      viTitle: "Tưới quá nhiều hoặc tưới không đều",
      viAdvice:
        "Tránh để giá thể luôn ướt sũng; để mặt đất se khô rồi mới tưới lại, tưới đều quanh gốc, tránh đọng nước.",
    };
  }

  if (key.includes("water deficiency") || key.includes("drought")) {
    return {
      viTitle: "Thiếu nước",
      viAdvice:
        "Tăng tần suất tưới nhưng lượng vừa phải; ưu tiên tưới vào gốc, hạn chế tưới mạnh trực tiếp lên lá khi trời nắng gắt.",
    };
  }

  if (key.includes("mechanical") || key.includes("physical")) {
    return {
      viTitle: "Tổn thương do va đập / cọ xát",
      viAdvice:
        "Tránh va quẹt, thú nuôi hoặc đồ vật làm gãy cành; loại bỏ lá, cành bị dập nát để hạn chế nấm/bệnh xâm nhập.",
    };
  }

  if (key.includes("nitrogen deficiency")) {
    return {
      viTitle: "Thiếu đạm (nitrogen deficiency)",
      viAdvice:
        "Bón bổ sung phân có hàm lượng đạm phù hợp (NPK cân đối, phân hữu cơ hoai mục); không bón quá liều trong một lần.",
    };
  }

  if (key.includes("fungi") || key.includes("fungus") || key.includes("fungal")) {
    return {
      viTitle: "Nấm bệnh (Fungi)",
      viAdvice:
        "Loại bỏ lá, cành bị bệnh nặng; cải thiện thông thoáng, tránh ẩm độ quá cao; nếu cần, dùng thuốc BVTV phù hợp và tuân thủ hướng dẫn.",
    };
  }

  // Mặc định
  return {
    viTitle: name,
    viAdvice:
      "Quan sát thêm lá, thân và giá thể; điều chỉnh tưới nước, ánh sáng và dinh dưỡng từ từ, tránh thay đổi đột ngột.",
  };
};

const PlantDiagnosisPage = () => {
  const user = useSelector((state) => state.auth?.user);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
 void file;

  // ✅ CÓ CHECK SIZE 4MB
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (f.size > MAX_SIZE) {
      setError("Ảnh quá lớn (>4MB). Vui lòng chọn ảnh dung lượng nhỏ hơn.");
      setFile(null);
      setPreviewUrl("");
      setBase64("");
      setResult(null);
      return;
    }

    setFile(f);
    setError("");
    setResult(null);

    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      setBase64(reader.result); // data:image/jpeg;base64,...
    };
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!base64) {
      setError("Vui lòng chọn ảnh trước khi chẩn đoán.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const payload = {
        base64,
        userId: user?._id,
      };

      const res = await plantApi.diagnose(payload);
      setResult(res.data);
    } catch (err) {
      console.error(err);

      // ✅ BẮT RIÊNG LỖI 413
      if (err?.response?.status === 413) {
        setError(
          "Ảnh quá lớn, máy chủ không thể xử lý (413). Vui lòng chọn ảnh dung lượng nhỏ hơn hoặc giảm độ phân giải rồi thử lại."
        );
        return;
      }

      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Có lỗi xảy ra khi chẩn đoán. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Dữ liệu thô từ Plant.id
  const apiData = result?.data || {};
  const suggestions = apiData.suggestions || [];
  const health = apiData.health_assessment;

  // Xác định có phải cây không
  const isPlantFlag =
    typeof apiData.is_plant === "boolean" ? apiData.is_plant : null;
  const plantProb =
    typeof apiData.is_plant_probability === "number"
      ? apiData.is_plant_probability
      : null;

  const notPlant =
    isPlantFlag === false ||
    (plantProb !== null && plantProb < 0.5 && suggestions.length === 0);

  const renderHealthIssues = () => {
    if (!health || !Array.isArray(health.diseases) || health.diseases.length === 0) {
      return (
        <p className="text-muted">
          Chưa ghi nhận vấn đề sức khỏe rõ ràng từ hình ảnh này. Bạn vẫn nên quan sát thêm lá, thân
          và giá thể để kịp thời phát hiện bất thường.
        </p>
      );
    }

    return (
      // Sử dụng list-unstyled để loại bỏ bullet point mặc định
      <ul className="list-unstyled">
        {health.diseases.map((d, idx) => {
          const { viTitle, viAdvice } = mapIssueToVi(d.name);
          const prob =
            typeof d.probability === "number"
              ? (d.probability * 100).toFixed(1)
              : null;

          // === THIẾT KẾ MỚI: Dùng màu sắc cảnh báo ===
          let colorClass = "text-warning-emphasis"; // Mặc định
          let borderColor = "border-warning-subtle";

          if (prob !== null) {
            const p = parseFloat(prob);
            if (p > 70) {
              colorClass = "text-danger"; // Nguy cơ cao -> Đỏ
              borderColor = "border-danger-subtle";
            } else if (p > 50) {
              colorClass = "text-warning"; // Nguy cơ vừa -> Cam
              borderColor = "border-warning-subtle";
            } else {
              colorClass = "text-success"; // Nguy cơ thấp/khác -> Xanh
              borderColor = "border-success-subtle";
            }
          }
          // ===========================================

          return (
            <li
              key={idx}
              className={`mb-3 p-3 border-start border-4 ${borderColor} bg-light rounded`}
            >
              <h6 className="mb-1">
                <span className={`${colorClass} fw-bold`}>
                  {viTitle}
                  {prob && ` (${prob}%)`}
                </span>
              </h6>
              <p className="mb-0 small text-dark">
                <i className="bi bi-lightbulb-fill me-1"></i>
                {viAdvice}
              </p>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Header />
      <div className="container mt-4 mb-5">
        {/* === THIẾT KẾ MỚI: Tiêu đề trực quan === */}
        <h2 className="mb-3">
          <span className="me-2">🌿</span>
          Chẩn Đoán Sức Khỏe Cây Trồng
        </h2>
        <p className="text-muted">
          Chụp hoặc tải ảnh lá, thân cây để AI nhận diện bệnh và đưa ra hướng dẫn
          xử lý kịp thời.
        </p>
        {/* ======================================= */}

        <div className="row">
          {/* Cột upload */}
          <div className="col-md-4">
            {/* === THIẾT KẾ MỚI: Card nổi bật === */}
            <div className="card shadow-sm border-success">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold text-success">
                      1. Chọn ảnh cây trồng
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileChange}
                    />
                  </div>

                  {previewUrl && (
                    <div className="mb-3 text-center">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="img-fluid rounded shadow-sm"
                        style={{ maxHeight: 250, objectFit: "cover" }}
                      />
                    </div>
                  )}

                  {error && (
                    <div className="alert alert-danger py-2">{error}</div>
                  )}

                  {/* === THIẾT KẾ MỚI: Nút lớn, nổi bật === */}
                  <button
                    type="submit"
                    className="btn btn-lg btn-success w-100 fw-bold"
                    disabled={loading || !base64}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang phân tích ảnh...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>CHẨN ĐOÁN NGAY
                      </>
                    )}
                  </button>
                  {/* ======================================= */}
                </form>
              </div>
            </div>
          </div>

          {/* Cột kết quả */}
          <div className="col-md-8 mt-4 mt-md-0">
            <div className="card h-100 shadow-sm">
              <div className="card-body">
                <h4 className="mb-3 text-primary">
                  <i className="bi bi-bar-chart-line-fill me-2"></i>
                  Kết quả chẩn đoán
                </h4>

                {!result && (
                  <p className="text-muted">
                    Vui lòng tải ảnh và bấm{" "}
                    <strong>
                      <span className="text-success">CHẨN ĐOÁN NGAY</span>
                    </strong>{" "}
                    để xem kết quả.
                  </p>
                )}

                {result && (
                  <>
                    {/* TH: không phải cây */}
                    {notPlant && (
                      <div className="alert alert-warning">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>
                          Có vẻ đối tượng trong ảnh không phải là cây trồng.
                        </strong>
                        <br />
                        Vui lòng chụp rõ cây (lá, thân, cành) và tránh nền phức
                        tạp rồi thử lại.
                      </div>
                    )}

                    {/* Thông tin nhận diện cây */}
                    {!notPlant && (
                      <>
                        <h5 className="border-bottom pb-2 text-info">
                          <i className="bi bi-flower1 me-2"></i>
                          Nhận diện cây
                        </h5>
                        {suggestions.length === 0 && (
                          <p className="text-muted">
                            Không tìm thấy gợi ý loài cây phù hợp từ hình ảnh
                            này.
                          </p>
                        )}

                        {suggestions.length > 0 && (
                          <ul className="list-group mb-4">
                            {suggestions.map((sugg, idx) => {
                              const prob =
                                typeof sugg.probability === "number"
                                  ? (sugg.probability * 100).toFixed(1)
                                  : null;
                              const commonNames =
                                sugg.common_names && sugg.common_names.length > 0
                                  ? sugg.common_names.join(", ")
                                  : null;

                              // === THIẾT KẾ MỚI: Bố cục List Item ===
                              return (
                                <li
                                  key={sugg.id || idx}
                                  className="list-group-item list-group-item-action"
                                >
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="me-2">
                                      <h6 className="mb-0 text-success fw-bold">
                                        {sugg.plant_name || "Không rõ tên cây"}
                                      </h6>
                                      {commonNames && (
                                        <div className="text-muted small">
                                          Tên thường gọi: {commonNames}
                                        </div>
                                      )}
                                    </div>
                                    {prob && (
                                      <span className="badge bg-success-subtle text-success py-2 px-3">
                                        {prob}%
                                      </span>
                                    )}
                                  </div>

                                  {/* Ảnh tương tự */}
                                  {Array.isArray(sugg.similar_images) &&
                                    sugg.similar_images.length > 0 && (
                                      <div className="mt-2 d-flex flex-wrap gap-2">
                                        {sugg.similar_images
                                          .slice(0, 4)
                                          .map((img, i) => (
                                            <img
                                              key={i}
                                              src={img.url}
                                              alt={
                                                img.similarity || "similar"
                                              }
                                              className="rounded border"
                                              style={{
                                                width: 80,
                                                height: 80,
                                                objectFit: "cover",
                                              }}
                                            />
                                          ))}
                                      </div>
                                    )}

                                  {sugg.plant_details?.wiki_description?.value && (
                                    <p className="mt-2 mb-0 small text-dark">
                                      {
                                        sugg.plant_details.wiki_description
                                          .value
                                      }
                                    </p>
                                  )}
                                </li>
                              );
                              // =======================================
                            })}
                          </ul>
                        )}
                      </>
                    )}

                    {/* Đánh giá sức khỏe & bệnh hại */}
                    {!notPlant && (
                      <div className="mt-3">
                        <h5 className="border-bottom pb-2 text-danger">
                          <i className="bi bi-virus me-2"></i>
                          Đánh giá sức khỏe & bệnh hại
                        </h5>
                        {/* renderHealthIssues đã được sửa đổi bên trên */}
                        {renderHealthIssues()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlantDiagnosisPage;