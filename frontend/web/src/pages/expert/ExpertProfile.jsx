"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import axiosClient from "../../api/shared/axiosClient";
import { logoutThunk } from "../../redux/authThunks";
import { Mail, User, Shield, ArrowLeft, LogOut, Phone } from "lucide-react";
import { toast } from "react-toastify";
import "../../css/expert/expertProfile.css";

// Fallback: lấy thông tin cơ bản từ localStorage nếu API lỗi
function getLocalUserFallback() {
  try {
    const keys = ["authUser", "user", "profile"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const u = JSON.parse(raw);
      if (!u) continue;

      const name =
        u.fullName ||
        u.username ||
        (u.email ? String(u.email).split("@")[0] : "Expert");

      const email = u.email || "";

      return {
        name,
        email,
        role: "Chuyên gia nông nghiệp",
        phone: u.phone || "",
        avatarSeed: "",
        avatar: "",
        notifications: 0,
      };
    }
  } catch {}

  return {
    name: "Expert",
    email: "",
    role: "Chuyên gia nông nghiệp",
    phone: "",
    avatarSeed: "",
    avatar: "",
    notifications: 0,
  };
}

export default function ExpertProfile() {
  const [loading, setLoading] = useState(true);
  const [basic, setBasic] = useState(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    avatarSeed: "",
  });
  const [errors, setErrors] = useState({});

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    (async () => {
      const candidates = ["/api/experts/me/basic", "/experts/me/basic"];
      let ok = false;

      for (const url of candidates) {
        try {
          const res = await axiosClient.get(url);
          const data = res?.data?.data;
          if (data && (data.name || data.email)) {
            const payload = {
              name: data.name || "Expert",
              email: data.email || "",
              role: data.role || "Chuyên gia nông nghiệp",
              phone: data.phone || "",
              avatarSeed: data.avatarSeed || "",
              avatar: data.avatar || "",
              notifications: Number(data.notifications || 0),
            };

            setBasic(payload);
            setForm({
              name: payload.name,
              email: payload.email,
              role: payload.role,
              phone: payload.phone,
              avatarSeed: payload.avatarSeed || "",
            });

            setPhotoPreview(payload.avatar || null);

            ok = true;
            break;
          }
        } catch {}
      }

      if (!ok) {
        const fallback = getLocalUserFallback();
        setBasic(fallback);
        setForm({
          name: fallback.name,
          email: fallback.email,
          role: fallback.role,
          phone: fallback.phone,
          avatarSeed: fallback.avatarSeed || "",
        });
        setPhotoPreview(fallback.avatar || null);
      }

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="xp-loader">
        <div className="xp-spinner" />
        <span>Đang tải hồ sơ chuyên gia…</span>
      </div>
    );
  }

  const data = basic || getLocalUserFallback();
  const name = data.name || "Expert";
  const email = data.email || "";
  const role = data.role || "Chuyên gia nông nghiệp";
  const phone = data.phone || "";

  const avatar = photoPreview || data.avatar || "";

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const validateForm = () => {
    const newErrors = {};

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();
    const trimmedRole = form.role.trim();
    const trimmedPhone = form.phone.trim();

    if (!trimmedName) newErrors.name = "Họ tên không được để trống";
    else if (trimmedName.length > 50)
      newErrors.name = "Họ tên tối đa 50 ký tự";

    if (!trimmedEmail) newErrors.email = "Email không được để trống";
    else if (trimmedEmail.length > 50)
      newErrors.email = "Email tối đa 50 ký tự";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      newErrors.email = "Định dạng email không hợp lệ";

    if (!trimmedRole) newErrors.role = "Vai trò không được để trống";
    else if (trimmedRole.length > 50)
      newErrors.role = "Vai trò tối đa 50 ký tự";

    if (!trimmedPhone) newErrors.phone = "Số điện thoại không được để trống";
    else if (!/^[0-9]{9,11}$/.test(trimmedPhone))
      newErrors.phone = "Số điện thoại phải từ 9–11 chữ số";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);

    try {
      let avatarUrlToSend = null;

      if (photoFile) {
        try {
          const fd = new FormData();
          fd.append("image", photoFile);

          const upRes = await axiosClient.post("/api/upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          let returnedUrl = upRes?.data?.data?.url;
          if (returnedUrl) {
            if (!/^https?:\/\//i.test(returnedUrl)) {
              const base =
                axiosClient.defaults?.baseURL ||
                window.location.origin ||
                "";
              returnedUrl =
                base.replace(/\/$/, "") +
                (returnedUrl.startsWith("/") ? returnedUrl : "/" + returnedUrl);
            }
            avatarUrlToSend = returnedUrl;
          } else {
            toast.error("Upload ảnh thất bại: không có URL trả về");
            setSaving(false);
            return;
          }
        } catch {
          toast.error("Không thể upload ảnh.");
          setSaving(false);
          return;
        }
      }

      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        phone: form.phone.trim(),
        avatarSeed: form.avatarSeed.trim(),
      };

      if (avatarUrlToSend) body.avatar = avatarUrlToSend;

      const res = await axiosClient.put("/api/experts/me/basic", body);
      const updated = res?.data?.data;

      if (updated) {
        const payload = {
          name: updated.name || "Expert",
          email: updated.email || "",
          role: updated.role || "Chuyên gia nông nghiệp",
          phone: updated.phone || "",
          avatarSeed: updated.avatarSeed || "",
          avatar: updated.avatar || "",
          notifications: Number(updated.notifications || 0),
        };

        setBasic(payload);
        setForm({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          phone: payload.phone,
          avatarSeed: payload.avatarSeed || "",
        });
        setPhotoFile(null);
        setPhotoPreview(payload.avatar || null);
        setErrors({});
      }

      toast.success("Cập nhật hồ sơ thành công");
      setEditing(false);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Cập nhật hồ sơ thất bại";

      toast.error(msg);

      if (msg.toLowerCase().includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: msg,
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="xp-wrap">
      {/* ⭐️ TOPBAR — logo FarmHub + 2 nút trong 1 khung */}
      <header className="xp-topbar">
        <div className="xp-topbar-left">
          <div
            className="xp-logo xp-logo-bg"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/expert")}
          >
            <span
              style={{
                fontSize: "1.9rem",
                fontWeight: 800,
                display: "flex",
                lineHeight: 1,
                letterSpacing: "0.5px",
              }}
            >
              <span style={{ color: "#0f7a3b" }}>Farm</span>
              <span style={{ color: "#ffffff", marginLeft: 3 }}>Hub</span>
            </span>
          </div>
        </div>

        <div className="xp-topbar-right">
          <div className="xp-topbar-actions">
            <button
              className="xp-topbar-btn xp-topbar-btn-back"
              onClick={() => navigate("/expert/home")}
            >
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </button>

            <button
              className="xp-topbar-btn xp-topbar-btn-logout"
              onClick={async () => {
                try {
                  await dispatch(logoutThunk());
                } catch {}
                  navigate("/login");
              }}
            >
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO CARD */}
      <section className="xp-hero">
        <div className="xp-hero-bg" />
        <div className="xp-card">
          <div className="xp-card-header">
            <div className="xp-avatar">
              <img src={avatar} alt={name} />
            </div>

            {editing && (
              <div style={{ marginLeft: 16 }}>
                <label className="xp-btn outline" style={{ cursor: "pointer" }}>
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            )}

            <div className="xp-title">
              <h1>{name}</h1>
              <p>{role}</p>
            </div>
          </div>

          <div className="xp-divider" />

          <div className="xp-info-grid">
            <div className="xp-info-item">
              <div className="xp-info-icon">
                <User size={18} />
              </div>
              <div className="xp-info-text">
                <span className="xp-info-label">Họ tên</span>
                <span className="xp-info-value">{name}</span>
              </div>
            </div>

            <div className="xp-info-item">
              <div className="xp-info-icon">
                <Mail size={18} />
              </div>
              <div className="xp-info-text">
                <span className="xp-info-label">Email</span>
                <span className="xp-info-value">{email}</span>
              </div>
            </div>

            <div className="xp-info-item">
              <div className="xp-info-icon">
                <Shield size={18} />
              </div>
              <div className="xp-info-text">
                <span className="xp-info-label">Vai trò</span>
                <span className="xp-info-value">{role}</span>
              </div>
            </div>

            <div className="xp-info-item">
              <div className="xp-info-icon">
                <Phone size={18} />
              </div>
              <div className="xp-info-text">
                <span className="xp-info-label">Số điện thoại</span>
                <span className="xp-info-value">
                  {phone || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {editing && (
            <form className="xp-edit-form" onSubmit={handleSave}>
              <div className="xp-edit-grid">
                <div className="xp-edit-field">
                  <label>Họ tên</label>
                  <input
                    type="text"
                    value={form.name}
                    maxLength={50}
                    onChange={handleChange("name")}
                    className={errors.name ? "xp-input-error" : ""}
                  />
                  {errors.name && <p className="xp-error">{errors.name}</p>}
                </div>

                <div className="xp-edit-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    maxLength={50}
                    onChange={handleChange("email")}
                    className={errors.email ? "xp-input-error" : ""}
                  />
                  {errors.email && <p className="xp-error">{errors.email}</p>}
                </div>

                <div className="xp-edit-field">
                  <label>Vai trò</label>
                  <input
                    type="text"
                    value={form.role}
                    maxLength={50}
                    onChange={handleChange("role")}
                    className={errors.role ? "xp-input-error" : ""}
                  />
                  {errors.role && <p className="xp-error">{errors.role}</p>}
                </div>

                <div className="xp-edit-field">
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    value={form.phone}
                    maxLength={50}
                    onChange={handleChange("phone")}
                    className={errors.phone ? "xp-input-error" : ""}
                  />
                  {errors.phone && <p className="xp-error">{errors.phone}</p>}
                </div>
              </div>

              <div className="xp-actions xp-edit-actions">
                <button
                  type="button"
                  className="xp-btn outline"
                  onClick={() => {
                    const d = basic || getLocalUserFallback();
                    setForm({
                      name: d.name,
                      email: d.email,
                      role: d.role,
                      phone: d.phone,
                      avatarSeed: d.avatarSeed || "",
                    });
                    setErrors({});
                    setPhotoFile(null);
                    setPhotoPreview(d.avatar || null);
                    setEditing(false);
                  }}
                >
                  Hủy
                </button>
                <button className="xp-btn" disabled={saving}>
                  {saving ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          )}

          {!editing && (
            <div className="xp-actions">
              <button
                className="xp-btn"
                onClick={() => navigate("/expert/home")}
              >
                Trở về trang chuyên gia
              </button>

              <button
                className="xp-btn outline"
                onClick={() => setEditing(true)}
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
