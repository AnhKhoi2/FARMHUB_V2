// src/pages/PlantDiagnosisPage.jsx
import React, { useState } from "react";
import { useSelector } from "react-redux";
import plantApi from "../api/plantApi";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

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

  if (
    key.includes("fungi") ||
    key.includes("fungus") ||
    key.includes("fungal")
  ) {
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

  const [previewUrl, setPreviewUrl] = useState("");
  const [base64, setBase64] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [symptomText, setSymptomText] = useState("");
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);

  // tab chế độ: “image” | “text”
  const [mode, setMode] = useState("image");

  const handleTextDiagnose = async (e) => {
    e.preventDefault();

    if (!symptomText.trim()) {
      setError("Vui lòng nhập mô tả triệu chứng trước khi phân tích bằng AI.");
      return;
    }

    try {
      setTextLoading(true);
      setError("");
      setTextResult(null);

      const payload = {
        description: symptomText,
        userId: user?._id,
      };

      const res = await plantApi.aiTextDiagnose(payload);
      setTextResult(res.data);
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Có lỗi xảy ra khi phân tích mô tả. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setTextLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (f.size > MAX_SIZE) {
      setError("Ảnh quá lớn (>4MB). Vui lòng chọn ảnh dung lượng nhỏ hơn.");
      setPreviewUrl("");
      setBase64("");
      setResult(null);
      return;
    }

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
    if (
      !health ||
      !Array.isArray(health.diseases) ||
      health.diseases.length === 0
    ) {
      return (
        <p className="text-muted">
          Chưa ghi nhận vấn đề sức khỏe rõ ràng từ hình ảnh này. Bạn vẫn nên
          quan sát thêm lá, thân và giá thể để kịp thời phát hiện bất thường.
        </p>
      );
    }

    return (
      <ul className="list-unstyled">
        {health.diseases.map((d, idx) => {
          const { viTitle, viAdvice } = mapIssueToVi(d.name);
          const prob =
            typeof d.probability === "number"
              ? (d.probability * 100).toFixed(1)
              : null;

          let colorClass = "text-warning-emphasis";
          let borderColor = "border-warning-subtle";

          if (prob !== null) {
            const p = parseFloat(prob);
            if (p > 70) {
              colorClass = "text-danger";
              borderColor = "border-danger-subtle";
            } else if (p > 50) {
              colorClass = "text-warning";
              borderColor = "border-warning-subtle";
            } else {
              colorClass = "text-success";
              borderColor = "border-success-subtle";
            }
          }

          const treatment = d?.disease_details?.treatment || null;

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

              {/* Lời khuyên tổng quát của FarmHub */}
              <p className="mb-1 small text-dark">
                <i className="bi bi-lightbulb-fill me-1"></i>
                {viAdvice}
              </p>

              {/* Gợi ý xử lý cụ thể từ Plant.id */}
              {treatment && (
                <div className="mt-2">
                  <h6 className="fw-bold text-primary mb-1">
                    <i className="bi bi-tools me-2"></i>
                    Gợi ý xử lý từ Plant.id
                  </h6>
                  <ul className="small mb-0">
                    {Array.isArray(treatment.chemical) &&
                      treatment.chemical.length > 0 && (
                        <li>
                          <strong className="text-danger">🧪 Hóa học:</strong>
                          <ul className="mb-1">
                            {treatment.chemical.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      )}

                    {Array.isArray(treatment.biological) &&
                      treatment.biological.length > 0 && (
                        <li>
                          <strong className="text-success">🧫 Sinh học:</strong>
                          <ul className="mb-1">
                            {treatment.biological.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      )}

                    {Array.isArray(treatment.organic) &&
                      treatment.organic.length > 0 && (
                        <li>
                          <strong className="text-warning">🌱 Hữu cơ:</strong>
                          <ul className="mb-1">
                            {treatment.organic.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      )}

                    {Array.isArray(treatment.cultural) &&
                      treatment.cultural.length > 0 && (
                        <li>
                          <strong className="text-info">🪴 Canh tác:</strong>
                          <ul className="mb-1">
                            {treatment.cultural.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      )}

                    {Array.isArray(treatment.prevention) &&
                      treatment.prevention.length > 0 && (
                        <li>
                          <strong className="text-primary">
                            🛡 Phòng ngừa:
                          </strong>
                          <ul className="mb-1">
                            {treatment.prevention.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ul>
                        </li>
                      )}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Header />
      <div className="py-4" style={{ background: "linear-gradient(90deg,#e8f5e9,#e3f2fd)" }}>
        <div className="container">
          {/* Tiêu đề & mô tả ngắn */}
          <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4">
            <div className="mb-3 mb-md-0">
              <h2 className="mb-2 fw-bold">
                <span className="me-2">🌿</span>
                Chẩn Đoán Sức Khỏe Cây Trồng
              </h2>
              <p className="text-muted mb-0">
                Tải ảnh lá/thân cây hoặc mô tả triệu chứng để FarmHub AI hỗ trợ
                nhận diện bệnh và gợi ý cách xử lý cụ thể.
              </p>
            </div>
            <div className="text-md-end small text-muted">
              <span className="badge bg-success-subtle text-success me-2">
                <i className="bi bi-cpu me-1"></i>AI Diagnosis
              </span>
              <span className="badge bg-primary-subtle text-primary">
                <i className="bi bi-shield-check me-1"></i>Cho người trồng tại nhà
              </span>
            </div>
          </div>

          <div className="row g-4">
            {/* Khối bên trái: Form */}
            <div className="col-md-5">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-0 pb-0">
                  {/* Tabs chọn chế độ */}
                  <ul className="nav nav-pills nav-fill small fw-semibold">
                    <li className="nav-item">
                      <button
                        type="button"
                        className={
                          "nav-link d-flex align-items-center justify-content-center " +
                          (mode === "image" ? "active" : "")
                        }
                        onClick={() => setMode("image")}
                      >
                        <i className="bi bi-image me-1"></i> Chẩn đoán bằng ảnh
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        type="button"
                        className={
                          "nav-link d-flex align-items-center justify-content-center " +
                          (mode === "text" ? "active" : "")
                        }
                        onClick={() => setMode("text")}
                      >
                        <i className="bi bi-chat-text me-1"></i> Mô tả bằng chữ
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="card-body">
                  {/* Thông báo lỗi chung */}
                  {error && (
                    <div className="alert alert-danger py-2 small">
                      <i className="bi bi-exclamation-octagon me-1"></i>
                      {error}
                    </div>
                  )}

                  {/* FORM ẢNH */}
                  {mode === "image" && (
                    <>
                      <p className="small text-muted mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Gợi ý: chụp rõ lá/bộ phận bị bệnh, hạn chế nền phức tạp,
                        tránh bị ngược sáng.
                      </p>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-success">
                            1. Chọn ảnh cây trồng
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            className="form-control"
                            onChange={handleFileChange}
                          />
                          <div className="form-text">
                            Dung lượng tối đa 4MB • Hỗ trợ: JPG, PNG...
                          </div>
                        </div>

                        {previewUrl && (
                          <div className="mb-3 text-center">
                            <div className="rounded overflow-hidden border">
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="img-fluid"
                                style={{ maxHeight: 260, objectFit: "cover" }}
                              />
                            </div>
                            <small className="text-muted d-block mt-1">
                              Xem lại ảnh trước khi gửi cho AI phân tích.
                            </small>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-success w-100 fw-bold"
                          disabled={loading || !base64}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang phân tích ảnh...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-search me-2"></i>
                              CHẨN ĐOÁN NGAY
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}

                  {/* FORM MÔ TẢ BẰNG CHỮ */}
                  {mode === "text" && (
                    <>
                      <p className="small text-muted mb-2">
                        Mô tả tình trạng cây: màu lá, vết đốm, tình trạng
                        tưới/nắng, sâu hại nhìn thấy được, thời gian xuất hiện...
                      </p>
                      <form onSubmit={handleTextDiagnose}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-primary">
                            Mô tả triệu chứng
                          </label>
                          <textarea
                            className="form-control"
                            rows={5}
                            placeholder="Ví dụ: Cây rau thơm trồng chậu, lá bị vàng từ mép vào, một số lá có đốm nâu, tưới mỗi ngày 2 lần..."
                            value={symptomText}
                            onChange={(e) => setSymptomText(e.target.value)}
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn btn-outline-primary w-100 fw-semibold"
                          disabled={textLoading || !symptomText.trim()}
                        >
                          {textLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2"></span>
                              Đang phân tích mô tả...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-stars me-1"></i>
                              PHÂN TÍCH MÔ TẢ BẰNG AI
                            </>
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>

                <div className="card-footer bg-light border-0 small text-muted">
                  <i className="bi bi-shield-lock me-1"></i>
                  Hình ảnh & mô tả chỉ dùng để AI gợi ý chăm sóc, không chia sẻ công khai.
                </div>
              </div>
            </div>

            {/* Khối bên phải: Kết quả */}
            <div className="col-md-7">
              <div className="card shadow-sm border-0 h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0 text-primary">
                      <i className="bi bi-bar-chart-line-fill me-2"></i>
                      Kết quả chẩn đoán
                    </h4>
                    <span className="badge bg-light text-secondary small">
                      Real-time từ Plant.id & FarmHub AI
                    </span>
                  </div>

                  {/* Nếu chưa có kết quả ảnh */}
                  {!result && !textResult && (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-search-heart fs-1 mb-2 d-block"></i>
                      <p className="mb-1">
                        Hãy chọn 1 trong 2 chế độ bên trái để bắt đầu chẩn đoán.
                      </p>
                      <small>
                        • Ảnh: phù hợp khi bạn muốn AI nhận diện bệnh theo hình ảnh.
                        <br />
                        • Mô tả: dùng khi bạn chưa kịp chụp ảnh hoặc cần hỏi nhanh.
                      </small>
                    </div>
                  )}

                  {/* Kết quả từ ảnh */}
                  {result && (
                    <>
                      {notPlant && (
                        <div className="alert alert-warning small">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          <strong>Có vẻ đối tượng trong ảnh không phải là cây trồng.</strong>
                          <br />
                          Vui lòng chụp rõ cây (lá, thân, cành) và tránh nền phức tạp rồi thử lại.
                        </div>
                      )}

                      {!notPlant && (
                        <>
                          {/* Nhận diện cây */}
                          <section className="mb-3">
                            <h5 className="border-bottom pb-2 text-info d-flex align-items-center">
                              <i className="bi bi-flower1 me-2"></i>
                              Nhận diện cây
                            </h5>

                            {suggestions.length === 0 && (
                              <p className="text-muted small mb-0">
                                Không tìm thấy gợi ý loài cây phù hợp từ hình ảnh này.
                              </p>
                            )}

                            {suggestions.length > 0 && (
                              <ul className="list-group list-group-flush">
                                {suggestions.map((sugg, idx) => {
                                  const prob =
                                    typeof sugg.probability === "number"
                                      ? (sugg.probability * 100).toFixed(1)
                                      : null;
                                  const commonNames =
                                    sugg.common_names &&
                                    sugg.common_names.length > 0
                                      ? sugg.common_names.join(", ")
                                      : null;

                                  return (
                                    <li
                                      key={sugg.id || idx}
                                      className="list-group-item px-0"
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
                                          <span className="badge bg-success-subtle text-success py-1 px-2">
                                            {prob}%
                                          </span>
                                        )}
                                      </div>

                                      {Array.isArray(sugg.similar_images) &&
                                        sugg.similar_images.length > 0 && (
                                          <div className="mt-2 d-flex flex-wrap gap-2">
                                            {sugg.similar_images
                                              .slice(0, 4)
                                              .map((img, i) => (
                                                <img
                                                  key={i}
                                                  src={img.url}
                                                  alt={img.similarity || "similar"}
                                                  className="rounded border"
                                                  style={{
                                                    width: 72,
                                                    height: 72,
                                                    objectFit: "cover",
                                                  }}
                                                />
                                              ))}
                                          </div>
                                        )}

                                      {/* {sugg.plant_details?.wiki_description
                                        ?.value && (
                                        <p className="mt-2 mb-0 small text-dark">
                                          {
                                            sugg.plant_details.wiki_description
                                              .value
                                          }
                                        </p>
                                      )} */}
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </section>

                          {/* Đánh giá sức khỏe & bệnh hại */}
                          <section className="mt-3">
                            <h5 className="border-bottom pb-2 text-danger d-flex align-items-center">
                              <i className="bi bi-virus me-2"></i>
                              Đánh giá sức khỏe & bệnh hại
                            </h5>
                            {renderHealthIssues()}
                          </section>
                        </>
                      )}
                    </>
                  )}

                  {/* Kết quả từ mô tả bằng chữ */}
                  {(textResult || mode === "text") && (
                    <section className="mt-4">
                      <h5 className="border-bottom pb-2 text-secondary d-flex align-items-center">
                        <i className="bi bi-chat-square-text me-2"></i>
                        Kết quả từ mô tả bằng chữ (AI)
                      </h5>

                      {!textResult && (
                        <p className="text-muted small mb-0">
                          Bạn có thể nhập mô tả triệu chứng ở tab{" "}
                          <strong>“Mô tả bằng chữ”</strong> bên trái để AI phân tích mà không cần ảnh.
                        </p>
                      )}

                      {textResult?.aiAdvice && (
                        <div className="mt-2">
                          {textResult.aiAdvice.summaryVi && (
                            <p className="small text-dark">
                              {textResult.aiAdvice.summaryVi}
                            </p>
                          )}

                          {Array.isArray(textResult.aiAdvice.possibleDiseases) &&
                            textResult.aiAdvice.possibleDiseases.length > 0 && (
                              <div className="mb-2">
                                <h6 className="fw-bold text-danger mb-1">
                                  <i className="bi bi-bug me-1"></i>
                                  Các khả năng bệnh:
                                </h6>
                                <ul className="small mb-1">
                                  {textResult.aiAdvice.possibleDiseases.map(
                                    (d, i) => (
                                      <li key={i}>
                                        <strong>{d.name}</strong>{" "}
                                        {d.likelihood && (
                                          <span>({d.likelihood})</span>
                                        )}
                                        {d.reason && <> – {d.reason}</>}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                          {textResult.aiAdvice.actions && (
                            <div className="mb-2">
                              <h6 className="fw-bold text-success mb-1">
                                <i className="bi bi-list-check me-1"></i>
                                Việc nên làm:
                              </h6>
                              <ul className="small mb-1">
                                {textResult.aiAdvice.actions.today && (
                                  <li>
                                    <strong>Hôm nay:</strong>{" "}
                                    {textResult.aiAdvice.actions.today}
                                  </li>
                                )}
                                {textResult.aiAdvice.actions.next_3_7_days && (
                                  <li>
                                    <strong>3–7 ngày tới:</strong>{" "}
                                    {textResult.aiAdvice.actions.next_3_7_days}
                                  </li>
                                )}
                                {textResult.aiAdvice.actions.monitor && (
                                  <li>
                                    <strong>Cần theo dõi:</strong>{" "}
                                    {textResult.aiAdvice.actions.monitor}
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}

                          {textResult.aiAdvice.warning && (
                            <div className="alert alert-warning py-2 small mb-0">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>
                              {textResult.aiAdvice.warning}
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
      <Footer />
    </>
  );
};

export default PlantDiagnosisPage;
