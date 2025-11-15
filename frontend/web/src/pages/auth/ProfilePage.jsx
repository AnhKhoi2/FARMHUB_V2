import React, { useEffect, useMemo, useState } from "react";
import { profileApi } from "../../api/shared/profileApi.js";
import { toast } from "react-toastify";
import authApi from "../../api/shared/authApi.js";
import expertApplicationApi from "../../api/shared/expertApplicationApi.js";
import "../../css/auth/ProfilePage.css";
import "../../css/auth/Profile.css";

function toDateDisplay(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("vi-VN");
}

/* ============================
   1. MODAL ĐỔI MẬT KHẨU
============================ */
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

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div
        className="agri-card w-full max-w-lg space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-agri-primary border-b pb-2">
          🔑 Đổi Mật Khẩu
        </h2>

        <div className="grid gap-4">
          {needsSetPassword ? (
            <p className="text-sm text-agri-gray bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              ⚠️ Lần đầu tạo mật khẩu — không cần nhập mật khẩu cũ.
            </p>
          ) : (
            <div>
              <label className="agri-label">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={pwForm.oldPassword}
                onChange={(e) => handlePwChange("oldPassword", e.target.value)}
                className="agri-input"
              />
            </div>
          )}

          <div>
            <label className="agri-label">Mật khẩu mới</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => handlePwChange("newPassword", e.target.value)}
              className="agri-input"
            />
          </div>

          <div>
            <label className="agri-label">Xác nhận mật khẩu</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) =>
                handlePwChange("confirmPassword", e.target.value)
              }
              className="agri-input"
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
/* ============================
   2. MODAL ĐĂNG KÝ EXPERT
============================ */
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

  if (hasApproved || hasPending) {
    return (
      <div
        className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex justify-center items-center p-4"
        onClick={onClose}
      >
        <div
          className="agri-card w-full max-w-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-semibold mb-4 text-agri-primary">Thông báo</h2>
          <p className="text-agri-gray">
            {hasApproved
              ? "Bạn đã là Expert. Không cần nộp đơn."
              : "Bạn đã có đơn đang chờ duyệt."}
          </p>
          <button onClick={onClose} className="mt-4 agri-btn-primary">Đóng</button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-semibold text-agri-primary">
            🧑‍🌾 Đăng ký trở thành Expert
          </h2>
          <button className="text-2xl text-agri-gray hover:text-agri-primary">&times;</button>
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
              />
            </div>

            <div>
              <label className="agri-label">Số điện thoại</label>
              <input
                type="text"
                value={applyForm.phone_number}
                onChange={(e) => onApplyChange("phone_number", e.target.value)}
                className="agri-input"
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
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="agri-label">Số năm kinh nghiệm</label>
              <input
                type="number"
                value={applyForm.experience_years}
                min="0"
                onChange={(e) =>
                  onApplyChange(
                    "experience_years",
                    Number(e.target.value) || 0
                  )
                }
                className="agri-input"
              />
            </div>
          </div>

          <div>
            <label className="agri-label">Giới thiệu</label>
            <textarea
              rows={4}
              value={applyForm.description}
              onChange={(e) => onApplyChange("description", e.target.value)}
              className="agri-input"
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
            <button type="button" onClick={onClose} className="agri-btn-secondary">
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
/* ============================
   3. COMPONENT CHÍNH
============================ */
export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverUser, setServerUser] = useState(null);

  const [form, setForm] = useState({});
  const [snapshot, setSnapshot] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [earnedBadges, setEarnedBadges] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const [hasPassword, setHasPassword] = useState(true);

  /* Đổi mật khẩu */
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  /* Expert apply */
  const [appsLoading, setAppsLoading] = useState(true);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [myApps, setMyApps] = useState([]);

  const [applySaving, setApplySaving] = useState(false);
  const [applyForm, setApplyForm] = useState({
    full_name: "",
    expertise_area: "",
    experience_years: 0,
    description: "",
    phone_number: "",
    certificates: [""],
  });

  const avatarPreview = useMemo(() => form.avatar?.trim(), [form.avatar]);
  const needsSetPassword = hasPassword === false;

  const BADGE_META = {
    "hat-giong": { label: "Hạt Giống", emoji: "🌱" },
    "first-streak": { label: "Khởi đầu", emoji: "✨" },
    "streak-7": { label: "7 ngày liên tiếp", emoji: "🏅" },
    "streak-30": { label: "30 ngày kiên trì", emoji: "🥇" },
  };

  const badgeLabel = (slug) => {
    if (!slug) return "";
    if (BADGE_META[slug]) return `${BADGE_META[slug].emoji} ${BADGE_META[slug].label}`;
    return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  /* =====================================================
     LOAD PROFILE + ĐƠN EXPERT
  ===================================================== */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.getProfile();
        const payload = data?.data || {};

        setServerUser(payload.user || null);
        setEarnedBadges(payload.earned_badges || []);
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

        setApplyForm((prev) => ({
          ...prev,
          full_name: profileData.fullName,
          phone_number: profileData.phone,
        }));
      } catch (err) {
        toast.error("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }

      try {
        setAppsLoading(true);
        const res = await expertApplicationApi.getMine();
        setMyApps(res?.data?.data || []);
      } catch (_) {}
      finally {
        setAppsLoading(false);
      }
    })();
  }, []);

  /* =====================================================
     HANDLER PROFILE
  ===================================================== */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: undefined, __server: undefined }));
  }

  function handleStartEdit() {
    setEditMode(true);
    setFieldErrors({});
  }

  function handleCancel() {
    if (snapshot) setForm(snapshot);
    setEditMode(false);
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
      toast.success("Đã lưu hồ sơ thành công");
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data;

      if (status === 422) {
        setFieldErrors(body?.errors || {});
        if (body?.message) toast.error(body.message);
      } else {
        toast.error(body?.message || "Lỗi khi lưu hồ sơ");
      }
    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     ĐỔI MẬT KHẨU
  ===================================================== */
  async function handleChangePassword() {
    if (!pwForm.newPassword || !pwForm.confirmPassword)
      return toast.error("Vui lòng nhập mật khẩu mới + xác nhận.");

    if (!needsSetPassword && !pwForm.oldPassword)
      return toast.error("Vui lòng nhập mật khẩu hiện tại.");

    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast.error("Mật khẩu xác nhận không khớp.");

    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(pwForm.newPassword))
      return toast.error("Mật khẩu ≥8 ký tự và có chữ + số + ký tự đặc biệt.");

    try {
      setPwSaving(true);

      await authApi.changePassword(
        needsSetPassword ? "" : pwForm.oldPassword,
        pwForm.newPassword
      );

      toast.success("Đổi mật khẩu thành công");
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPwOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setPwSaving(false);
    }
  }

  /* =====================================================
      EXPERT APPLY
  ===================================================== */
  const hasApproved = serverUser?.role === "expert";
  const hasPending = myApps?.some((a) => a.status === "pending");

  const onApplyChange = (name, value) => {
    setApplyForm((prev) => ({ ...prev, [name]: value }));
  };

  const addCertField = () => {
    setApplyForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, ""],
    }));
  };

  const setCertAt = (i, value) => {
    const next = [...applyForm.certificates];
    next[i] = value;
    setApplyForm((prev) => ({ ...prev, certificates: next }));
  };

  async function submitApplication(e) {
    e.preventDefault();

    if (hasApproved) return toast.info("Bạn đã là Expert.");
    if (hasPending) return toast.info("Bạn đã có đơn đang chờ duyệt.");

    if (!applyForm.full_name?.trim() || !applyForm.expertise_area?.trim()) {
      return toast.error("Họ tên + lĩnh vực là bắt buộc.");
    }

    setApplySaving(true);
    try {
      const payload = {
        ...applyForm,
        certificates: applyForm.certificates.filter(Boolean),
      };

      await expertApplicationApi.create(payload);
      toast.success("Đã gửi đơn đăng ký Expert!");

      setAppModalOpen(false);

      const res = await expertApplicationApi.getMine();
      setMyApps(res?.data?.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Nộp đơn thất bại");
    } finally {
      setApplySaving(false);
    }
  }

  /* =====================================================
      RENDER
  ===================================================== */
  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="animate-pulse text-agri-gray">
          Đang tải hồ sơ…
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="agri-theme-container">
        <h1 className="text-3xl font-bold mb-4 agri-theme-heading">
          🌿 Hồ sơ cá nhân
        </h1>

        {serverUser && (
          <p className="text-sm text-agri-gray mb-6">
            Tài khoản:{" "}
            <span className="font-medium text-agri-primary">
              {serverUser.username}
            </span>{" "}
            · Email:{" "}
            <span className="font-mono">{serverUser.email}</span>{" "}
            · Vai trò:{" "}
            <span className="font-bold text-agri-primary">
              {serverUser.role?.toUpperCase()}
            </span>
          </p>
        )}

        {/* ==============================
            GRID 3 CỘT
        =============================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ========== CỘT 1: AVATAR =========== */}
          <div className="agri-card avatar-section">
            <div className="avatar-wrapper">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="grid place-items-center w-full h-full text-gray-400 bg-gray-50">
                  🌱 Chưa có ảnh
                </div>
              )}
            </div>

            <p className="text-center text-lg mt-3 font-semibold text-agri-primary">
              {form.fullName || "Người dùng"}
            </p>

            <button
              type="button"
              onClick={() => setPwOpen(true)}
              className="w-full agri-btn-secondary mt-4 flex items-center justify-center gap-2"
            >
              🔑 Đổi mật khẩu
            </button>
          </div>

          {/* ========== CỘT 2 + 3: THÔNG TIN CƠ BẢN =========== */}
          <div className="agri-card lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-agri-primary">
              Thông tin cơ bản
            </h2>

            {!editMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3">
                  <div><span className="agri-label">Số điện thoại:</span> {form.phone || "-"}</div>
                  <div><span className="agri-label">Ngày sinh:</span> {toDateDisplay(form.dob)}</div>
                  <div>
                    <span className="agri-label">Giới tính:</span>{" "}
                    {form.gender === "male"
                      ? "Nam 👨"
                      : form.gender === "female"
                      ? "Nữ 👩"
                      : "Khác ❓"}
                  </div>
                  <div><span className="agri-label">Địa chỉ:</span> {form.address || "-"}</div>
                </div>

                <div>
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
                {fieldErrors.__server && (
                  <p className="text-sm text-red-600">{fieldErrors.__server}</p>
                )}

                <div>
                  <label className="agri-label">Avatar URL</label>
                  <input
                    type="text"
                    name="avatar"
                    value={form.avatar || ""}
                    onChange={handleChange}
                    className="agri-input"
                  />
                </div>

                <div>
                  <label className="agri-label">Họ và tên</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName || ""}
                    onChange={handleChange}
                    className="agri-input"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="agri-label">Số điện thoại</label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone || ""}
                      onChange={handleChange}
                      className="agri-input"
                    />
                  </div>

                  <div>
                    <label className="agri-label">Ngày sinh</label>
                    <input
                      type="date"
                      name="dob"
                      value={form.dob?.split("T")[0] || ""}
                      onChange={handleChange}
                      className="agri-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="agri-label">Giới tính</label>
                    <select
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      className="agri-input"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="agri-label">Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address || ""}
                      onChange={handleChange}
                      className="agri-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="agri-label">Giới thiệu</label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={form.bio || ""}
                    onChange={handleChange}
                    className="agri-input"
                  />
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

          {/* ========== ĐĂNG KÝ EXPERT (FULL WIDTH) =========== */}
          <div className="agri-card lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-agri-primary">
                🧑‍🌾 Đăng ký trở thành Expert
              </h2>

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

            {/* Lịch sử đơn */}
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
                        <td colSpan="5" className="p-3 text-center text-agri-gray">
                          Đang tải…
                        </td>
                      </tr>
                    ) : myApps.length ? (
                      myApps.map((it) => (
                        <tr key={it._id}>
                          <td>{it.full_name}</td>
                          <td>{it.email}</td>
                          <td>{it.expertise_area}</td>
                          <td>{it.experience_years} năm</td>
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
                        <td colSpan="5" className="p-3 text-center text-agri-gray">
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
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ==============================
          MODALS
      =============================== */}
      <ChangePasswordModal
        isOpen={pwOpen}
        onClose={() => setPwOpen(false)}
        needsSetPassword={needsSetPassword}
        pwForm={pwForm}
        setPwForm={setPwForm}
        pwSaving={pwSaving}
        handleChangePassword={handleChangePassword}
      />

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
