import React, { useEffect, useMemo, useState } from "react";
import { profileApi } from "../../api/shared/profileApi.js";
import { toast } from "react-toastify";
// thêm ở đầu file
import authApi from "../../api/shared/authApi.js";

function toDateDisplay(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("vi-VN");
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverUser, setServerUser] = useState(null);

  const [form, setForm] = useState({});
  const [snapshot, setSnapshot] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({}); // 🔹 lỗi theo field (422)

  const [hasPassword, setHasPassword] = useState(true);

  // state cho Đổi mật khẩu
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // const isGoogleUser = serverUser?.provider === "google";
  const avatarPreview = useMemo(() => form.avatar?.trim(), [form.avatar]);
  const needsSetPassword = hasPassword === false;
  useEffect(() => {
    (async () => {
      try {
        const { data } = await profileApi.getProfile();
        const payload = data?.data || {};
        setServerUser(payload.user || null);
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
      } catch (err) {
        console.error(err);
        toast.error("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // 🔹 clear lỗi của field đang gõ để UX mượt
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
        // 🔹 backend Joi trả { success:false, message, errors:{ field: msg } }
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
    // new + confirm là bắt buộc
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
      // 👇 Google user: oldPassword có thể rỗng; BE sẽ cho set lần đầu
      await authApi.changePassword(
        needsSetPassword ? "" : pwForm.oldPassword,
        pwForm.newPassword
      );
      toast.success(
        needsSetPassword
          ? "Tạo mật khẩu thành công ✅"
          : "Đổi mật khẩu thành công ✅"
      );
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPwOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "Thao tác thất bại";
      toast.error(msg);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="animate-pulse text-gray-500">Đang tải hồ sơ…</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Hồ sơ cá nhân</h1>
      {serverUser && (
        <p className="text-sm text-gray-500 mb-6">
          Tài khoản: <span className="font-medium">{serverUser.username}</span>
          {" · "}Email: <span className="font-mono">{serverUser.email}</span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Avatar section */}
        <div className="bg-white rounded-2xl shadow p-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 grid place-items-center">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-400 text-sm">(Chưa có ảnh)</div>
            )}
          </div>
          <p className="text-center text-sm mt-3 font-medium">
            {form.fullName || "Người dùng"}
          </p>
        </div>

        {/* Info viewer / editor */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow p-4 space-y-4">
          {!editMode ? (
            <>
              <div>
                <span className="font-semibold">Số điện thoại:</span>{" "}
                {form.phone || "-"}
              </div>
              <div>
                <span className="font-semibold">Ngày sinh:</span>{" "}
                {toDateDisplay(form.dob)}
              </div>
              <div>
                <span className="font-semibold">Giới tính:</span>{" "}
                {form.gender === "male"
                  ? "Nam"
                  : form.gender === "female"
                  ? "Nữ"
                  : "Khác"}
              </div>
              <div>
                <span className="font-semibold">Địa chỉ:</span>{" "}
                {form.address || "-"}
              </div>
              <div>
                <span className="font-semibold">Giới thiệu:</span>
                <p className="whitespace-pre-wrap text-gray-700 mt-1">
                  {form.bio || "(Chưa có nội dung)"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartEdit}
                className="px-4 py-2 rounded-xl bg-black text-white"
              >
                Chỉnh sửa
              </button>
            </>
          ) : (
            <>
              {/* Hiển thị lỗi server chung nếu có */}
              {fieldErrors?.__server && (
                <p className="text-sm text-red-600">{fieldErrors.__server}</p>
              )}

              {/* Avatar URL (optional) */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Avatar URL
                </label>
                <input
                  type="text"
                  name="avatar"
                  value={form.avatar || ""}
                  onChange={handleChange}
                  placeholder="https://…"
                  className="w-full border rounded-xl px-3 py-2 focus:ring"
                />
                {fieldErrors?.avatar && (
                  <p className="text-xs text-red-600 mt-1">
                    {fieldErrors.avatar}
                  </p>
                )}
              </div>

              {/* Full name */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={form.fullName || ""}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  className="w-full border rounded-xl px-3 py-2 focus:ring"
                />
                {fieldErrors?.fullName && (
                  <p className="text-xs text-red-600 mt-1">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone || ""}
                    onChange={handleChange}
                    placeholder="090… hoặc +8490…"
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                  />
                  {fieldErrors?.phone && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob?.split("T")[0] || ""}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                  />
                  {fieldErrors?.dob && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.dob}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Giới tính
                  </label>
                  <select
                    name="gender"
                    value={form.gender || "other"}
                    onChange={handleChange}
                    className="w-full border rounded-xl px-3 py-2 focus:ring bg-white"
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

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={form.address || ""}
                    onChange={handleChange}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành…"
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                  />
                  {fieldErrors?.address && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Giới thiệu
                </label>
                <textarea
                  name="bio"
                  value={form.bio || ""}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Mô tả ngắn về bạn, sở thích, kinh nghiệm…"
                  className="w-full border rounded-xl px-3 py-2 focus:ring"
                />
                {fieldErrors?.bio && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.bio}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
                >
                  {saving ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-xl border"
                  disabled={saving}
                >
                  Hủy
                </button>
              </div>
            </>
          )}
        </div>

        {/* ----- Card Đổi mật khẩu ----- */}
        <div className="md:col-span-2 bg-white rounded-2xl shadow p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Đổi mật khẩu</h2>
            <button
              type="button"
              onClick={() => setPwOpen((v) => !v)}
              className="px-3 py-1.5 rounded-xl border"
            >
              {pwOpen ? "Đóng" : "Mở form"}
            </button>
          </div>

          {pwOpen && (
            <div className="grid gap-4">
              {/* 👇 Ẩn ô mật khẩu cũ cho Google user; hiển thị ghi chú */}
              {needsSetPassword ? (
  <p className="text-sm text-gray-600">
    Lần đầu tạo mật khẩu (tài khoản Google): <b>không cần</b> nhập mật khẩu hiện tại.
  </p>
) : (
  <div>
    <label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label>
    <input
      type="password"
      value={pwForm.oldPassword}
      onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
      className="w-full border rounded-xl px-3 py-2 focus:ring"
      placeholder="Nhập mật khẩu hiện tại"
    />
  </div>
)}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, newPassword: e.target.value })
                    }
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                    placeholder="Ít nhất 8 ký tự, gồm chữ/số/ký tự đặc biệt"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Xác nhận mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={(e) =>
                      setPwForm({ ...pwForm, confirmPassword: e.target.value })
                    }
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={pwSaving}
                  className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
                >
                  {pwSaving ? "Đang đổi…" : needsSetPassword ? "Tạo mật khẩu" : "Đổi mật khẩu"}

                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPwForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                    setPwOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border"
                  disabled={pwSaving}
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
