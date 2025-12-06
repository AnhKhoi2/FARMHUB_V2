import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import { FaBug, FaArrowLeft, FaLeaf, FaInfoCircle } from "react-icons/fa";
import "../../css/farmer/DiseaseDetail.css";

const DiseaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disease, setDisease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiseaseDetail();
  }, [id]);

  const fetchDiseaseDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get disease by slug from public endpoint
      const response = await axiosClient.get(`/diseases/${id}`);
      console.log("Full API Response:", response);
      console.log("Response.data:", response.data);
      
      // Backend returns: { success: true, data: diseaseObject }
      const diseaseData = response.data.data;
      console.log("Disease Object:", diseaseData);
      
      setDisease(diseaseData);
    } catch (err) {
      console.error("Error fetching disease detail:", err);
      setError("Không thể tải thông tin bệnh. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityInfo = (severity) => {
    const severityMap = {
      low: { class: "bg-success", text: "Nhẹ", color: "#28a745" },
      medium: { class: "bg-warning", text: "Trung bình", color: "#ffc107" },
      high: { class: "bg-danger", text: "Cao", color: "#dc3545" }
    };
    return severityMap[severity] || { class: "bg-secondary", text: severity, color: "#6c757d" };
  };

  const getSeverityIcon = (severity) => {
    if (severity === "high") return "🔴";
    if (severity === "medium") return "🟡";
    return "🟢";
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="disease-detail-page">
          <div className="container my-5 text-center">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-dark">Đang tải thông tin bệnh...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !disease) {
    return (
      <>
        <Header />
        <div className="disease-detail-page">
          <div className="container my-5">
            <div className="card border">
              <div className="card-body text-center py-5">
                <FaBug size={64} className="text-muted mb-3 opacity-50" />
                <h4 className="text-dark">Không tìm thấy thông tin bệnh</h4>
                <p className="text-secondary">{error || "Bệnh không tồn tại hoặc đã bị xóa."}</p>
                <button 
                  className="btn btn-success mt-3"
                  onClick={() => navigate("/diseases")}
                >
                  <FaArrowLeft className="me-2" />
                  Quay lại danh sách
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const severityInfo = getSeverityInfo(disease.severity);

  return (
    <>
      <Header />
      <div className="disease-detail-page">
        <div className="container py-4">
          {/* Back button */}
          <div className="mb-4">
            <button 
              className="btn-back d-inline-flex align-items-center"
              onClick={() => navigate("/diseases")}
            >
              <FaArrowLeft className="me-2" />
              <span>Quay lại</span>
            </button>
          </div>

          {/* Main Content */}
          <div className="row g-4">
            {/* Left Column - Main Info */}
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                  {/* Title Section */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="disease-icon-circle me-3">
                        <FaBug size={32} className="text-white" />
                      </div>
                      <div className="flex-grow-1">
                        <h1 className="h3 mb-2 text-dark fw-bold">{disease.name}</h1>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="me-2">{getSeverityIcon(disease.severity)}</span>
                          <span className={`badge ${severityInfo.class} px-3 py-2`}>
                            Mức độ: {severityInfo.text}
                          </span>
                          {disease.category && (
                            <span className="badge bg-light text-dark border px-3 py-2">
                              {disease.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {disease.description && (
                    <div className="description-section">
                      <h5 className="text-dark mb-3 d-flex align-items-center">
                        <FaInfoCircle className="me-2 text-primary" />
                        Mô tả chi tiết
                      </h5>
                      <p className="text-dark mb-0" style={{ 
                        lineHeight: "1.8", 
                        fontSize: "1rem",
                        textAlign: "justify" 
                      }}>
                        {disease.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Quick Info */}
            <div className="col-lg-4">
              {/* Plant Types Card */}
              {disease.plantTypes && disease.plantTypes.length > 0 && (
                <div className="card border-0 shadow-sm mb-4">
                  <div className="card-body p-4">
                    <h6 className="text-dark mb-3 d-flex align-items-center">
                      <FaLeaf className="me-2 text-success" />
                      Cây bị ảnh hưởng
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                      {disease.plantTypes.map((plant, idx) => (
                        <span 
                          key={idx} 
                          className="badge bg-success text-white px-3 py-2"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {plant}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Stats Card */}
              <div className="card border-0 shadow-sm bg-light">
                <div className="card-body p-4">
                  <h6 className="text-dark mb-3">Thông tin tóm tắt</h6>
                  <div className="quick-stats">
                    <div className="stat-item mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary">Tên bệnh:</span>
                        <strong className="text-dark">{disease.name}</strong>
                      </div>
                    </div>
                    {disease.category && (
                      <div className="stat-item mb-3 pb-3 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-secondary">Danh mục:</span>
                          <strong className="text-dark">{disease.category}</strong>
                        </div>
                      </div>
                    )}
                    <div className="stat-item mb-3 pb-3 border-bottom">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-secondary">Mức độ:</span>
                        <strong className={`text-${severityInfo.class.includes('success') ? 'success' : severityInfo.class.includes('warning') ? 'warning' : 'danger'}`}>
                          {severityInfo.text}
                        </strong>
                      </div>
                    </div>
                    {disease.plantTypes && disease.plantTypes.length > 0 && (
                      <div className="stat-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-secondary">Số cây ảnh hưởng:</span>
                          <strong className="text-dark">{disease.plantTypes.length}</strong>
                        </div>
                      </div>
                    )}
                  </div>
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

export default DiseaseDetail;
