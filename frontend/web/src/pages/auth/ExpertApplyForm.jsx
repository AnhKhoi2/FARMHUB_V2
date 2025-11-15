import React, { useState } from "react";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

export default function ExpertApplyForm() {
  const [form, setForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""], // mảng url
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const accessToken = useSelector((s) => s.auth?.accessToken);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});

    try {
      const body = {
        ...form,
        experience_years: Number(form.experience_years) || 0,
        certificates: (form.certificates || [])
          .map((c) => (c || "").trim())
          .filter(Boolean),
      };

      const res = await fetch("/api/expert-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}),
        },
        body: JSON.stringify(body),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        // nếu body không phải json thì bỏ qua
      }

      if (!res.ok) {
        const status = res.status;

        // 422: lỗi validate từng field
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
        return;
      }

      // Thành công
      toast.success(
        data?.message || "Đã gửi đơn đăng ký chuyên gia thành công!"
      );

      // Reset form
      setForm({
        full_name: "",
        expertise_area: "",
        experience_years: 0,
        description: "",
        phone_number: "",
        certificates: [""],
      });
    } catch (err) {
      console.error("Submit expert application error:", err);
      toast.error("Không thể kết nối đến server.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="mb-3">Đăng ký trở thành chuyên gia</h3>

      {/* Họ tên */}
      <div className="mb-3">
        <label className="form-label">Họ và tên</label>
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
        <label className="form-label">Lĩnh vực chuyên môn</label>
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

      {/* Certificates */}
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

      <button
        type="submit"
        className="btn btn-success"
        disabled={submitting}
      >
        {submitting ? "Đang gửi..." : "Nộp đơn"}
      </button>
    </form>
  );
}
