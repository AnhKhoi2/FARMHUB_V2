import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import expertApplicationApi from "../../api/expert/expertApplicationApi";
import Footer from "../../components/shared/Footer";
import "../../css/auth/Login.css"; // Reuse auth styles

const ApplyExpert = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  const [formData, setFormData] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: "",
    description: "",
    phone_number: "",
    certificates: [""],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if user already has a pending application
    const checkExisting = async () => {
      try {
        const apps = await expertApplicationApi.getMine();
        const pending = apps.find((app) => app.status === "pending");
        if (pending) {
          setExistingApplication(pending);
        }
      } catch (err) {
        console.error("Error checking existing applications:", err);
      }
    };
    checkExisting();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleCertificateChange = (index, value) => {
    const newCertificates = [...formData.certificates];
    newCertificates[index] = value;
    setFormData((prev) => ({
      ...prev,
      certificates: newCertificates,
    }));
  };

  const addCertificate = () => {
    setFormData((prev) => ({
      ...prev,
      certificates: [...prev.certificates, ""],
    }));
  };

  const removeCertificate = (index) => {
    if (formData.certificates.length > 1) {
      const newCertificates = formData.certificates.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        certificates: newCertificates,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Họ tên là bắt buộc";
    }

    if (!formData.expertise_area.trim()) {
      newErrors.expertise_area = "Lĩnh vực chuyên môn là bắt buộc";
    }

    const expYears = parseInt(formData.experience_years);
    if (isNaN(expYears) || expYears < 0) {
      newErrors.experience_years = "Số năm kinh nghiệm phải là số không âm";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả kinh nghiệm là bắt buộc";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        experience_years: parseInt(formData.experience_years),
        certificates: formData.certificates.filter(
          (cert) => cert.trim() !== ""
        ),
      };

      await expertApplicationApi.create(submitData);
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate("/expert/home");
      }, 2000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Có lỗi xảy ra khi nộp đơn";
      setError(errorMessage);

      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      }
    } finally {
      setLoading(false);
    }
  };

  if (existingApplication) {
    return (
      <div className="login-page">
        <div className="wrapper">
          <div className="form-box register">
            <h2>Đơn Đăng Ký Chuyên Gia</h2>
            <div className="success-message">
              Bạn đã có đơn đăng ký đang chờ duyệt.
              <br />
              Trạng thái: <strong>{existingApplication.status}</strong>
              <br />
              Ngày nộp:{" "}
              {new Date(existingApplication.createdAt).toLocaleDateString(
                "vi-VN"
              )}
            </div>
            <button
              className="btn"
              onClick={() => navigate("/expert/home")}
              style={{ marginTop: "20px" }}
            >
              Về Trang Chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-page">
        <div className="wrapper">
          <div className="form-box register">
            <h2>Đơn Đăng Ký Chuyên Gia</h2>
            <div className="success-message">
              Đơn đăng ký của bạn đã được nộp thành công!
              <br />
              Chúng tôi sẽ xem xét và phản hồi trong thời gian sớm nhất.
            </div>
            <p style={{ textAlign: "center", marginTop: "20px" }}>
              Chuyển hướng về trang chủ...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="wrapper">
        <div className="form-box register">
          <h2>Đăng Ký Trở Thành Chuyên Gia</h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <span className="icon">
                <ion-icon name="person"></ion-icon>
              </span>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
              <label>Họ và tên *</label>
              {errors.full_name && (
                <span
                  style={{
                    color: "red",
                    fontSize: "12px",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {errors.full_name}
                </span>
              )}
            </div>

            <div className="input-box">
              <span className="icon">
                <ion-icon name="leaf"></ion-icon>
              </span>
              <input
                type="text"
                name="expertise_area"
                value={formData.expertise_area}
                onChange={handleInputChange}
                placeholder="Ví dụ: Trồng cà phê, Nuôi trồng thủy sản,..."
                required
              />
              <label>Lĩnh vực chuyên môn *</label>
              {errors.expertise_area && (
                <span
                  style={{
                    color: "red",
                    fontSize: "12px",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {errors.expertise_area}
                </span>
              )}
            </div>

            <div className="input-box">
              <span className="icon">
                <ion-icon name="time"></ion-icon>
              </span>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                min="0"
                required
              />
              <label>Số năm kinh nghiệm *</label>
              {errors.experience_years && (
                <span
                  style={{
                    color: "red",
                    fontSize: "12px",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {errors.experience_years}
                </span>
              )}
            </div>

            <div className="input-box">
              <span className="icon">
                <ion-icon name="call"></ion-icon>
              </span>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
              />
              <label>Số điện thoại</label>
            </div>

            <div className="input-box">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả kinh nghiệm, chứng chỉ, thành tích của bạn..."
                rows="4"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  fontSize: "16px",
                  resize: "vertical",
                }}
                required
              />
              <label
                style={{
                  position: "absolute",
                  top: "-10px",
                  left: "10px",
                  background: "white",
                  padding: "0 5px",
                }}
              >
                Mô tả kinh nghiệm *
              </label>
              {errors.description && (
                <span
                  style={{
                    color: "red",
                    fontSize: "12px",
                    display: "block",
                    marginTop: "5px",
                  }}
                >
                  {errors.description}
                </span>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                Chứng chỉ (tùy chọn)
              </label>
              {formData.certificates.map((cert, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) =>
                      handleCertificateChange(index, e.target.value)
                    }
                    placeholder="URL hoặc tên chứng chỉ"
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      fontSize: "16px",
                    }}
                  />
                  {formData.certificates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCertificate(index)}
                      style={{
                        marginLeft: "10px",
                        padding: "10px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCertificate}
                style={{
                  padding: "8px 16px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                + Thêm chứng chỉ
              </button>
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Đang nộp đơn..." : "Nộp Đơn Đăng Ký"}
            </button>
          </form>

          <div className="login-register" style={{ marginTop: "20px" }}>
            <p>
              <button
                onClick={() => navigate("/expert/home")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Quay lại trang chủ
              </button>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ApplyExpert;
