import React, { useEffect, useMemo, useState } from "react";
import { profileApi } from "../../api/shared/profileApi.js";
import { toast } from "react-toastify";
// thêm ở đầu file
import authApi from "../../api/shared/authApi.js";
import expertApplicationApi from "../../api/shared/expertApplicationApi.js";
import "../../css/auth/ProfilePage.css";

// Đã cập nhật để dùng CSS theo theme
import "../../css/auth/Profile.css";

function toDateDisplay(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("vi-VN");
}

// ----------------------------------------------------
// 1. Component Modal Đổi Mật Khẩu (Popup làm mờ nền)
// ----------------------------------------------------
function ChangePasswordModal({
  isOpen,
  onClose,
  needsSetPassword,
  pwForm,
  setPwForm,
  pwSaving,
  handleChangePassword,
}) {
  if (!isOpen) return null;

  const handlePwChange = (name, value) => {
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  // backdrop: fixed inset-0 z-50 bg-black bg-opacity-50
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex justify-center items-center p-4 transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="agri-card w-full max-w-lg space-y-4 animate-fade-in-up"
        onClick={(e) => e.stopPropagation()} // Ngăn chặn đóng khi click vào modal
      >
        <h2 className="text-xl font-semibold text-agri-primary border-b pb-2">
          🔑 Đổi Mật Khẩu
        </h2>

        <div className="grid gap-4">
          {needsSetPassword ? (
            <p className="text-sm text-agri-gray bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              ⚠️ Đây là lần đầu tạo mật khẩu. <b>Không cần</b> nhập mật khẩu hiện tại.
            </p>
          ) : (
            <div>
              <label className="agri-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={pwForm.oldPassword}
                onChange={(e) => handlePwChange("oldPassword", e.target.value)}
                className="agri-input"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
          )}

          <div>
            <label className="agri-label">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) =>
                handlePwChange("newPassword", e.target.value)
              }
              className="agri-input"
              placeholder="Ít nhất 8 ký tự, gồm chữ/số/ký tự đặc biệt"
            />
          </div>
          <div>
            <label className="agri-label">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) =>
                handlePwChange("confirmPassword", e.target.value)
              }
              className="agri-input"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="agri-btn-secondary"
            disabled={pwSaving}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={pwSaving}
            className="agri-btn-primary disabled:opacity-60"
          >
            {pwSaving ? "Đang xử lý…" : needsSetPassword ? "✨ Tạo mật khẩu" : "🔄 Đổi mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}


// ----------------------------------------------------
// 2. Component Modal Đăng ký Expert (Popup làm mờ nền)
// ----------------------------------------------------
function ExpertApplicationModal({
  isOpen,
  onClose,
  applyForm,
  onApplyChange,
  addCertField,
  setCertAt,
  submitApplication,
  applySaving,
  hasApproved,
  hasPending,
}) {
  if (!isOpen) return null;

  // Xử lý khi người dùng cố gắng mở modal dù đã có đơn/đã được duyệt
  if (hasApproved || hasPending) {
    return (
        <div className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="agri-card w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-semibold mb-4 text-agri-primary">Thông báo</h2>
                <p className="text-agri-gray">
                    {hasApproved ? "Bạn đã là Expert. Không cần nộp đơn nữa." : "Bạn đã có đơn đang chờ duyệt. Vui lòng chờ kết quả."}
                </p>
                <button onClick={onClose} className="mt-4 agri-btn-primary">Đóng</button>
            </div>
        </div>
    );
  }

  // Form đăng ký chính
  return (
    <div
      className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex justify-center items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="agri-card w-full max-w-3xl my-8 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-xl font-semibold text-agri-primary">🧑‍🌾 Đăng ký trở thành Expert</h2>
            <button onClick={onClose} className="text-agri-gray hover:text-agri-primary text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={submitApplication} className="profile-form space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="agri-label">Họ và tên *</label>
              <input
                type="text"
                value={applyForm.full_name}
                onChange={(e) => onApplyChange("full_name", e.target.value)}
                className="agri-input"
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="agri-label">Số điện thoại</label>
              <input
                type="text"
                value={applyForm.phone_number}
                onChange={(e) => onApplyChange("phone_number", e.target.value)}
                className="agri-input"
                placeholder="090… hoặc +8490…"
              />
            </div>
          </div>

          <div>
            <label className="agri-label">Lĩnh vực chuyên môn *</label>
            <input
              type="text"
              value={applyForm.expertise_area}
              onChange={(e) => onApplyChange("expertise_area", e.target.value)}
              className="agri-input"
              placeholder="Bệnh cây ăn lá, dinh dưỡng, tưới tiêu…"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="agri-label">Số năm kinh nghiệm</label>
              <input
                type="number"
                min="0"
                value={applyForm.experience_years}
                onChange={(e) =>
                  onApplyChange(
                    "experience_years",
                    isNaN(Number(e.target.value)) ? 0 : Number(e.target.value)
                  )
                }
                className="agri-input"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="agri-label">Giới thiệu / Mô tả</label>
            <textarea
              rows={4}
              value={applyForm.description}
              onChange={(e) => onApplyChange("description", e.target.value)}
              className="agri-input"
              placeholder="Tóm tắt kinh nghiệm, ca tư vấn đã làm…"
            />
          </div>

          <div>
            <label className="agri-label">Chứng chỉ / Portfolio (URL)</label>
            <div className="space-y-2">
              {applyForm.certificates.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setCertAt(i, e.target.value)}
                    className="flex-1 agri-input"
                    placeholder="https://…"
                  />
                  {i === applyForm.certificates.length - 1 && (
                    <button
                      type="button"
                      onClick={addCertField}
                      className="px-3 py-2 rounded-xl border text-agri-primary hover:bg-agri-green-light"
                    >
                      +
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="agri-btn-secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={applySaving}
              className="agri-btn-primary disabled:opacity-60"
            >
              {applySaving ? "Đang gửi…" : "✉️ Nộp đơn"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ----------------------------------------------------
// ProfilePage Component Chính
// ----------------------------------------------------

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverUser, setServerUser] = useState(null);

  const [form, setForm] = useState({});
  const [snapshot, setSnapshot] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // 🔹 lỗi theo field (422)
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const [hasPassword, setHasPassword] = useState(true);

  // state cho Đổi mật khẩu
  const [pwOpen, setPwOpen] = useState(false); // <--- Mở/Đóng Modal PW
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ---------- Expert Application states ----------
  const [appsLoading, setAppsLoading] = useState(true);
  const [appModalOpen, setAppModalOpen] = useState(false); // <--- Mở/Đóng Modal Expert
  const [myApps, setMyApps] = useState([]); // danh sách đơn của tôi
  const [applySaving, setApplySaving] = useState(false);
  const [applyForm, setApplyForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""], // mảng URL
  });

  const avatarPreview = useMemo(() => form.avatar?.trim(), [form.avatar]);
  const needsSetPassword = hasPassword === false;

  const BADGE_META = {
    "hat-giong": { label: "Hạt Giống", emoji: "🌱", color: "bg-amber-100 text-amber-800" },
    "first-streak": { label: "Khởi đầu", emoji: "✨", color: "bg-amber-100 text-amber-800" },
    "streak-7": { label: "7 ngày liên tiếp", emoji: "🏅", color: "bg-emerald-100 text-emerald-800" },
    "streak-30": { label: "30 ngày kiên trì", emoji: "🥇", color: "bg-emerald-100 text-emerald-800" },
    // fallback mapping for other slugs
  };

  const badgeLabel = (slug) => {
    if (!slug) return "";
    if (BADGE_META[slug]) return `${BADGE_META[slug].emoji} ${BADGE_META[slug].label}`;
    // prettify slug -> Title Case
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // load profile + my applications
  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.getProfile();
        const payload = data?.data || {};
        setServerUser(payload.user || null);
        setEarnedBadges(Array.isArray(payload.earned_badges) ? payload.earned_badges : []);
        setTotalPoints(payload.total_points || 0);
        setHasPassword(Boolean(payload.hasPassword));
        const profileData = {
          fullName: payload.fullName || "",
          avatar: payload.avatar || "",
          phone: payload.phone || "",
          dob: payload.dob || "",
          gender: payload.gender || "other",
          address: payload.address || "",
          bio: payload.bio || "",
        };
        setForm(profileData);
        setSnapshot(profileData);

        // gợi ý trước cho form Expert
        setApplyForm((prev) => ({
          ...prev,
          full_name: profileData.fullName || "",
          phone_number: profileData.phone || "",
        }));
      } catch (err) {
        console.error(err);
        toast.error("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }

      // load đơn đăng ký expert của chính mình
      try {
        setAppsLoading(true);
        const res = await expertApplicationApi.getMine();
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setMyApps(list);
      } catch (err) {
        console.error(err);
        // không toast lỗi ồn ào
      } finally {
        setAppsLoading(false);
      }
    })();
  }, []);

  // ---------------- Profile handlers ----------------
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({
      ...prev,
      [name]: undefined,
      __server: undefined,
    }));
  }

  function handleStartEdit() {
    setEditMode(true);
    setFieldErrors({});
  }

  function handleCancel() {
    if (snapshot) setForm(snapshot);
    setEditMode(false);
    setFieldErrors({});
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        dob: form.dob ? new Date(form.dob).toISOString() : undefined,
      };
      const { data } = await profileApi.updateProfile(payload);
      const updated = data?.data || {};
      const normalized = {
        ...form,
        ...updated,
        dob: updated.dob || form.dob,
      };
      setForm(normalized);
      setSnapshot(normalized);
      setEditMode(false);
      setFieldErrors({});
      toast.success("Đã lưu hồ sơ thành công");
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const body = err?.response?.data;
      if (status === 422) {
        setFieldErrors(body?.errors || {});
        if (body?.message) toast.error(body.message);
      } else {
        toast.error(body?.message || "Lưu hồ sơ thất bại");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!pwForm.newPassword || !pwForm.confirmPassword) {
      return toast.error("Vui lòng nhập mật khẩu mới và xác nhận.");
    }
    if (!needsSetPassword && !pwForm.oldPassword) {
      return toast.error("Vui lòng nhập mật khẩu hiện tại.");
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp.");
    }
    const strong = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(
      pwForm.newPassword
    );
    if (!strong) {
      return toast.error(
        "Mật khẩu mới phải ≥8 ký tự, gồm chữ, số và ký tự đặc biệt."
      );
    }

    try {
      setPwSaving(true);
      await authApi.changePassword(
        needsSetPassword ? "" : pwForm.oldPassword,
        pwForm.newPassword
      );
      toast.success(
        needsSetPassword
          ? "Tạo mật khẩu thành công ✅"
          : "Đổi mật khẩu thành công ✅"
      );
      // Đóng modal và reset form sau khi thành công
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPwOpen(false); // <--- Đóng Modal
    } catch (err) {
      const msg = err?.response?.data?.message || "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  }

  // ---------------- Expert Apply handlers ----------------
  const hasApproved = !!serverUser && serverUser.role === "expert";
  const hasPending = myApps?.some?.((a) => a.status === "pending");

  const onApplyChange = (name, value) => {
    setApplyForm((prev) => ({ ...prev, [name]: value }));
  };

  const addCertField = () => {
    setApplyForm((prev) => ({ ...prev, certificates: [...prev.certificates, ""] }));
  };

  const setCertAt = (idx, value) => {
    const next = [...applyForm.certificates];
    next[idx] = value;
    setApplyForm((p) => ({ ...p, certificates: next }));
  };

  async function submitApplication(e) {
    e?.preventDefault?.();
    if (hasApproved) {
      return toast.info("Bạn đã là Expert.");
    }
    if (hasPending) {
      return toast.info("Bạn đã có đơn đang chờ duyệt.");
    }
    if (!applyForm.full_name?.trim() || !applyForm.expertise_area?.trim()) {
      return toast.error("Vui lòng nhập Họ tên và Lĩnh vực chuyên môn.");
    }
    setApplySaving(true);
    try {
      const payload = {
        ...applyForm,
        certificates: (applyForm.certificates || []).filter(Boolean),
      };
      await expertApplicationApi.create(payload);
      toast.success("Đã nộp đơn. Vui lòng chờ admin duyệt!");

      setAppModalOpen(false); // <--- Đóng Modal Expert khi thành công

      // reload my applications
      const res = await expertApplicationApi.getMine();
      setMyApps(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Nộp đơn thất bại";
      toast.error(msg);
    } finally {
      setApplySaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="animate-pulse text-agri-gray">Đang tải hồ sơ…</div>
      </div>
    );
  }

  return (
    <div className="profile-page max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Hồ sơ cá nhân</h1>
      {serverUser && (
        <p className="text-sm text-gray-500 mb-6">
          Tài khoản: <span className="font-medium">{serverUser.username}</span>
          {" · "}Email: <span className="font-mono">{serverUser.email}</span>
          {" · "}Vai trò: <span className="font-semibold">{serverUser.role}</span>
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <div className="pf-card">
          <div className="pf-hero" />
          <div className="pf-avatar-wrap">
            <div className="pf-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" />
              ) : (
                <div className="text-gray-400 text-sm">(Chưa có ảnh)</div>
              )}
            </div>

            <div className="pf-maininfo">
              <p className="pf-name">{form.fullName || "Người dùng"}</p>
              <p className="pf-username">{serverUser?.username ? `@${serverUser.username}` : ""}</p>

              <div className="pf-stats">Điểm: <span className="font-medium">{totalPoints}</span></div>

              {earnedBadges?.length > 0 ? (
                <div className="pf-badges">
                  {earnedBadges.map((slug) => (
                    <div key={slug} className={`pf-badge-chip ${slug === 'hat-giong' ? 'important' : ''}`} title={badgeLabel(slug)}>
                      <span className="pf-emoji">{BADGE_META[slug]?.emoji || '🏅'}</span>
                      <span>{badgeLabel(slug)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-400">Chưa có danh hiệu</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Avatar & Summary (Cột 1) */}
          <div className="agri-card avatar-section">
            <div className="avatar-wrapper">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-gray-400 text-sm grid place-items-center w-full h-full bg-gray-50">
                  🌱 Chưa có ảnh
                </div>
              )}
            </div>
            <p className="text-center text-lg mt-3 font-semibold text-agri-primary">
              {form.fullName || "Người dùng"}
            </p>

            {/* NÚT MỞ MODAL ĐỔI MẬT KHẨU */}
            <button
                type="button"
                onClick={() => setPwOpen(true)}
                className="w-full agri-btn-secondary mt-4 flex items-center justify-center gap-2"
              >
                <span className="text-lg">🔑</span> Đổi mật khẩu
            </button>
          </div>

          {/* Info viewer / editor (Cột 2 & 3) */}
          <div className="agri-card lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-agri-primary">Thông tin cơ bản</h2>

            {!editMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
                  <div>
                    <span className="agri-label">Số điện thoại:</span>{" "}
                    <span className="text-agri-gray">{form.phone || "-"}</span>
                  </div>
                  <div>
                    <span className="agri-label">Ngày sinh:</span>{" "}
                    <span className="text-agri-gray">{toDateDisplay(form.dob)}</span>
                  </div>
                  <div>
                    <span className="agri-label">Giới tính:</span>{" "}
                    <span className="text-agri-gray">
                      {form.gender === "male"
                        ? "Nam 👨"
                        : form.gender === "female"
                        ? "Nữ 👩"
                        : "Khác ❓"}
                    </span>
                  </div>
                  <div>
                    <span className="agri-label">Địa chỉ:</span>{" "}
                    <span className="text-agri-gray">{form.address || "-"}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="agri-label">Giới thiệu:</span>
                  <p className="whitespace-pre-wrap text-agri-gray mt-1">
                    {form.bio || "(Chưa có nội dung)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="agri-btn-primary mt-4"
                >
                  📝 Chỉnh sửa hồ sơ
                </button>
              </>
            ) : (
              <>
                {fieldErrors?.__server && (
                  <p className="text-sm text-red-600">{fieldErrors.__server}</p>
                )}

                <div>
                  <label className="agri-label">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    name="avatar"
                    value={form.avatar || ""}
                    onChange={handleChange}
                    placeholder="https://…"
                    className="agri-input"
                  />
                  {fieldErrors?.avatar && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.avatar}
                    </p>
                  )}
                </div>

                <div>
                  <label className="agri-label">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName || ""}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    className="agri-input"
                  />
                  {fieldErrors?.fullName && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="agri-label">
                      Số điện thoại
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone || ""}
                      onChange={handleChange}
                      placeholder="090… hoặc +8490…"
                      className="agri-input"
                    />
                    {fieldErrors?.phone && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="agri-label">
                      Ngày sinh
                    </label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob?.split("T")[0] || ""}
                      onChange={handleChange}
                      className="agri-input"
                    />
                    {fieldErrors?.dob && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors.dob}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="agri-label">
                      Giới tính
                    </label>
                    <select
                      name="gender"
                      value={form.gender || "other"}
                      onChange={handleChange}
                      className="agri-input bg-white"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    {fieldErrors?.gender && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors.gender}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="agri-label">
                      Địa chỉ
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={form.address || ""}
                      onChange={handleChange}
                      placeholder="Số nhà, đường, quận/huyện, tỉnh/thành…"
                      className="agri-input"
                    />
                    {fieldErrors?.address && (
                      <p className="text-xs text-red-600 mt-1">
                        {fieldErrors.address}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="agri-label">
                    Giới thiệu
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Mô tả ngắn về bạn, sở thích, kinh nghiệm…"
                    className="agri-input"
                  />
                  {fieldErrors?.bio && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.bio}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="agri-btn-primary disabled:opacity-60"
                  >
                    {saving ? "Đang lưu…" : "💾 Lưu thay đổi"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="agri-btn-secondary"
                    disabled={saving}
                  >
                    Hủy
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ----- Card Đăng ký trở thành Expert (Full width) ----- */}
        <div className="agri-card lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-agri-primary">🧑‍🌾 Đăng ký trở thành Expert</h2>
              <div className="flex items-center gap-3">
                {hasApproved && (
                  <span className="status-tag status-approved">
                    Đã là Expert ✅
                  </span>
                )}
                {!hasApproved && hasPending && (
                  <span className="status-tag status-pending">
                    Đơn đang chờ duyệt…
                  </span>
                )}
                {/* NÚT MỞ MODAL ĐĂNG KÝ EXPERT */}
                {!hasApproved && !hasPending && (
                    <button
                        type="button"
                        onClick={() => setAppModalOpen(true)}
                        className="agri-btn-primary"
                    >
                        ✉️ Nộp đơn Expert
                    </button>
                )}
              </div>
            </div>


            {/* Danh sách đơn của tôi */}
            <div className="pt-4 border-t">
              <h3 className="font-semibold mb-2 text-agri-primary">Lịch sử Đơn đã nộp</h3>
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-sm agri-table">
                  <thead>
                    <tr>
                      <th>Họ tên</th>
                      <th>Email</th>
                      <th>Lĩnh vực</th>
                      <th>Kinh nghiệm</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appsLoading ? (
                      <tr>
                        <td className="p-3 text-center text-agri-gray" colSpan={5}>
                          Đang tải…
                        </td>
                      </tr>
                    ) : myApps?.length ? (
                      myApps.map((it) => (
                        <tr key={it._id} className="border-t">
                          <td>{it.full_name}</td>
                          <td>{it.email}</td>
                          <td>{it.expertise_area}</td>
                          <td>{it.experience_years ?? 0} năm</td>
                          <td>
                            <span
                              className={
                                "status-tag " +
                                (it.status === "pending"
                                  ? "status-pending"
                                  : it.status === "approved"
                                  ? "status-approved"
                                  : "status-rejected")
                              }
                            >
                              {it.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 text-center text-agri-gray" colSpan={5}>
                          Chưa có đơn nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {!hasApproved && hasPending && (
                <p className="text-sm text-agri-gray mt-3 p-3 bg-agri-green-light rounded-lg">
                  Đơn của bạn đang chờ duyệt. Khi được chấp thuận, vai trò sẽ chuyển sang <b>expert</b>.
                  Bạn có thể đăng xuất/đăng nhập lại hoặc tải thông tin tài khoản để cập nhật giao diện.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RENDER CÁC MODAL Ở CUỐI COMPONENT */}
      {/* ---------------------------------------------------- */}

      {/* MODAL ĐỔI MẬT KHẨU */}
      <ChangePasswordModal
        isOpen={pwOpen}
        onClose={() => setPwOpen(false)}
        needsSetPassword={needsSetPassword}
        pwForm={pwForm}
        setPwForm={setPwForm}
        pwSaving={pwSaving}
        handleChangePassword={handleChangePassword}
      />

      {/* MODAL ĐĂNG KÝ EXPERT */}
      <ExpertApplicationModal
        isOpen={appModalOpen}
        onClose={() => setAppModalOpen(false)}
        applyForm={applyForm}
        onApplyChange={onApplyChange}
        addCertField={addCertField}
        setCertAt={setCertAt}
        submitApplication={submitApplication}
        applySaving={applySaving}
        hasApproved={hasApproved}
        hasPending={hasPending}
      />
    </div>
  );
}