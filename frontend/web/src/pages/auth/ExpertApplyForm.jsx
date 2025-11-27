import React, { useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import expertApplicationApi from "../../api/shared/expertApplicationApi.js";
import axiosClient from "../../api/shared/axiosClient.js";

export default function ExpertApplyForm() {
  const [form, setForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""], // các URL chứng chỉ nhập tay
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // files chứng chỉ upload
  const [certFiles, setCertFiles] = useState([]);
  const fileInputRef = useRef(null);

  // popup sau khi nộp đơn
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  const navigate = useNavigate();

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCertChange = (index, value) => {
    setForm((prev) => {
      const certs = [...prev.certificates];
      certs[index] = value;
      return { ...prev, certificates: certs };
    });
  };

  const addCertField = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, ""],
    }));
  };

  const removeCertField = (index) => {
    setForm((prev) => {
      const certs = prev.certificates.filter((_, i) => i !== index);
      return { ...prev, certificates: certs.length ? certs : [""] };
    });
  };

  const handleCertFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setCertFiles(files);
  };

  const resetForm = () => {
    setForm({
      full_name: "",
      expertise_area: "",
      experience_years: 0,
      description: "",
      phone_number: "",
      certificates: [""],
    });
    setCertFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =========================
  // VALIDATE FRONTEND
  // =========================
  const validateForm = () => {
    const errors = {};

    // Họ tên bắt buộc
    if (!form.full_name || !form.full_name.trim()) {
      errors.full_name = "Họ và tên là bắt buộc.";
    }

    // Lĩnh vực chuyên môn bắt buộc
    if (!form.expertise_area || !form.expertise_area.trim()) {
      errors.expertise_area = "Lĩnh vực chuyên môn là bắt buộc.";
    }

    // Số năm kinh nghiệm >= 0
    const exp = Number(form.experience_years);
    if (Number.isNaN(exp) || exp < 0) {
      errors.experience_years = "Số năm kinh nghiệm phải ≥ 0.";
    }

    // Số điện thoại: nếu có thì phải đúng pattern VN: 0xxxxxxxxx hoặc +84xxxxxxxxx
    if (form.phone_number && form.phone_number.trim()) {
      const phone = form.phone_number.trim();
      const phoneRegex = /^((0\d{9})|(\+84\d{9}))$/;
      if (!phoneRegex.test(phone)) {
        errors.phone_number =
          "Số điện thoại không hợp lệ. Ví dụ: 0912345678 hoặc +84912345678.";
      }
    }

    // Nếu có lỗi → setFieldErrors + toast
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error("Vui lòng kiểm tra lại các thông tin bắt buộc.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    // kiểm tra frontend trước
    const isValid = validateForm();
    if (!isValid) return;

    setSubmitting(true);

    try {
      // 1) Upload các file chứng chỉ (nếu có) lên /api/upload
      let uploadedUrls = [];
      if (certFiles.length > 0) {
        for (const file of certFiles) {
          const fd = new FormData();
          // backend hiện đang dùng field "image" cho upload avatar → tái sử dụng cho chứng chỉ
          fd.append("image", file);

          const resUpload = await axiosClient.post("/api/upload", fd);
          const url = resUpload?.data?.data?.url || resUpload?.data?.url;
          if (!url) {
            throw new Error("Upload chứng chỉ thất bại");
          }
          uploadedUrls.push(url);
        }
      }

      // 2) Gom URL chứng chỉ (nhập tay + upload)
      const body = {
        ...form,
        experience_years: Number(form.experience_years) || 0,
        certificates: [
          ...(form.certificates || [])
            .map((c) => (c || "").trim())
            .filter(Boolean),
          ...uploadedUrls,
        ],
      };

      // 3) Gửi đơn đăng ký expert
      const res = await expertApplicationApi.create(body);
      const data = res?.data;

      toast.success(
        data?.message || "Đã gửi đơn đăng ký chuyên gia thành công!"
      );

      // 4) Reset form + mở popup thông báo
      resetForm();
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Submit expert application error:", err);

      const status = err?.response?.status;
      const data = err?.response?.data;

      // 422: lỗi validate từng field (backend trả errors theo field)
      if (status === 422) {
        const errs = data?.errors || {};
        setFieldErrors(errs);
        toast.error(
          data?.message || "Vui lòng kiểm tra lại các thông tin."
        );
        return;
      }

      // 409: đã có đơn pending
      if (status === 409) {
        toast.error(
          data?.message || "Bạn đã có đơn đăng ký đang chờ duyệt."
        );
        return;
      }

      // 400 | 404: request sai / không tìm thấy
      if (status === 400 || status === 404) {
        toast.error(
          data?.error || data?.message || "Yêu cầu không hợp lệ."
        );
        return;
      }

      // 5xx: lỗi server
      if (status >= 500) {
        toast.error("Lỗi server, vui lòng thử lại sau.");
        return;
      }

      // fallback
      toast.error(
        data?.error || data?.message || "Gửi đơn thất bại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* FORM ĐĂNG KÝ EXPERT */}
      <form onSubmit={handleSubmit}>
        <h3 className="mb-3">Đăng ký trở thành chuyên gia</h3>

        {/* Họ tên */}
        <div className="mb-3">
          <label className="form-label">Họ và tên *</label>
          <input
            type="text"
            className="form-control"
            value={form.full_name}
            onChange={(e) => setField("full_name", e.target.value)}
          />
          {fieldErrors.full_name && (
            <div className="text-danger small mt-1">
              {fieldErrors.full_name}
            </div>
          )}
        </div>

        {/* Lĩnh vực */}
        <div className="mb-3">
          <label className="form-label">Lĩnh vực chuyên môn *</label>
          <input
            type="text"
            className="form-control"
            value={form.expertise_area}
            onChange={(e) => setField("expertise_area", e.target.value)}
          />
          {fieldErrors.expertise_area && (
            <div className="text-danger small mt-1">
              {fieldErrors.expertise_area}
            </div>
          )}
        </div>

        {/* Số năm kinh nghiệm */}
        <div className="mb-3">
          <label className="form-label">Số năm kinh nghiệm</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={form.experience_years}
            onChange={(e) => setField("experience_years", e.target.value)}
          />
          {fieldErrors.experience_years && (
            <div className="text-danger small mt-1">
              {fieldErrors.experience_years}
            </div>
          )}
        </div>

        {/* Số điện thoại */}
        <div className="mb-3">
          <label className="form-label">Số điện thoại</label>
          <input
            type="text"
            className="form-control"
            value={form.phone_number}
            onChange={(e) => setField("phone_number", e.target.value)}
          />
          {fieldErrors.phone_number && (
            <div className="text-danger small mt-1">
              {fieldErrors.phone_number}
            </div>
          )}
        </div>

        {/* Mô tả */}
        <div className="mb-3">
          <label className="form-label">Giới thiệu / mô tả</label>
          <textarea
            className="form-control"
            rows={4}
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
          />
        </div>

        {/* Certificates (URL) */}
        <div className="mb-3">
          <label className="form-label">Chứng chỉ (URL)</label>
          {form.certificates.map((c, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input
                type="text"
                className="form-control"
                value={c}
                placeholder="https://..."
                onChange={(e) => handleCertChange(i, e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => removeCertField(i)}
                disabled={form.certificates.length === 1}
              >
                −
              </button>
              {i === form.certificates.length - 1 && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={addCertField}
                >
                  +
                </button>
              )}
            </div>
          ))}
          {fieldErrors.certificates && (
            <div className="text-danger small mt-1">
              {fieldErrors.certificates}
            </div>
          )}
        </div>

        {/* Upload chứng chỉ (file) */}
        <div className="mb-3">
          <label className="form-label">Upload chứng chỉ (file)</label>
          <input
            ref={fileInputRef}
            type="file"
            className="form-control"
            multiple
            onChange={handleCertFileChange}
          />
          <div className="form-text">
            Bạn có thể chọn nhiều file (PDF, ảnh...). Hệ thống sẽ tự upload và
            lưu link chứng chỉ.
          </div>
          {certFiles.length > 0 && (
            <ul className="mt-2 small">
              {certFiles.map((f, idx) => (
                <li key={idx}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-success"
          disabled={submitting}
        >
          {submitting ? "Đang gửi..." : "Nộp đơn"}
        </button>
      </form>

      {/* POPUP THÔNG BÁO SAU KHI NỘP ĐƠN */}
      {successModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-50"
          style={{ zIndex: 1050 }}
        >
          <div
            className="bg-white rounded shadow p-4"
            style={{ maxWidth: "480px", width: "100%" }}
          >
            <h4 className="mb-3">🎉 Đã gửi đơn đăng ký Expert</h4>
            <p className="mb-3">
              Đơn đăng ký của bạn đã được gửi thành công và đang ở trạng thái{" "}
              <strong>pending</strong>. Admin sẽ xem xét và duyệt trong thời
              gian sớm nhất.
            </p>
            <p className="mb-3">
              Bạn có thể kiểm tra lịch sử đơn trong mục{" "}
              <strong>Hồ sơ cá nhân / Đăng ký Expert</strong>.
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setSuccessModalOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSuccessModalOpen(false);
                  navigate(-1); // quay lại trang trước (vd: ProfilePage)
                }}
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
