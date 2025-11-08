import React, { useEffect, useMemo, useState } from "react";
import { profileApi } from "../../api/shared/profileApi.js";
import { toast } from "react-toastify";
// thêm ở đầu file
import authApi from "../../api/shared/authApi.js";
import expertApplicationApi from "../../api/shared/expertApplicationApi.js";

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

  // ---------- Expert Application states ----------
  const [appsLoading, setAppsLoading] = useState(true);
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

  // load profile + my applications
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
      setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPwOpen(false);
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
        <div className="animate-pulse text-gray-500">Đang tải hồ sơ…</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-4 space-y-4">
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
              {fieldErrors?.__server && (
                <p className="text-sm text-red-600">{fieldErrors.__server}</p>
              )}

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
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-4 space-y-4">
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

        {/* ----- Card Đăng ký trở thành Expert ----- */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Đăng ký trở thành Expert</h2>
            {hasApproved && (
              <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm">
                Bạn đã là Expert ✅
              </span>
            )}
            {!hasApproved && hasPending && (
              <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-sm">
                Đơn của bạn đang chờ duyệt…
              </span>
            )}
          </div>

          {/* Nếu chưa là expert và không có đơn pending => hiển thị form */}
          {!hasApproved && !hasPending && (
            <form onSubmit={submitApplication} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={applyForm.full_name}
                    onChange={(e) => onApplyChange("full_name", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={applyForm.phone_number}
                    onChange={(e) => onApplyChange("phone_number", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                    placeholder="090… hoặc +8490…"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Lĩnh vực chuyên môn *</label>
                <input
                  type="text"
                  value={applyForm.expertise_area}
                  onChange={(e) => onApplyChange("expertise_area", e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 focus:ring"
                  placeholder="Bệnh cây ăn lá, dinh dưỡng, tưới tiêu…"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số năm kinh nghiệm</label>
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
                    className="w-full border rounded-xl px-3 py-2 focus:ring"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Giới thiệu / Mô tả</label>
                <textarea
                  rows={4}
                  value={applyForm.description}
                  onChange={(e) => onApplyChange("description", e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 focus:ring"
                  placeholder="Tóm tắt kinh nghiệm, ca tư vấn đã làm…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Chứng chỉ / Portfolio (URL)</label>
                <div className="space-y-2">
                  {applyForm.certificates.map((url, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => setCertAt(i, e.target.value)}
                        className="flex-1 border rounded-xl px-3 py-2 focus:ring"
                        placeholder="https://…"
                      />
                      {i === applyForm.certificates.length - 1 && (
                        <button
                          type="button"
                          onClick={addCertField}
                          className="px-3 py-2 rounded-xl border"
                        >
                          +
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={applySaving}
                  className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
                >
                  {applySaving ? "Đang gửi…" : "Nộp đơn"}
                </button>
              </div>
            </form>
          )}

          {/* Danh sách đơn của tôi */}
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Đơn đã nộp</h3>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Họ tên</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Lĩnh vực</th>
                    <th className="text-left p-2">Kinh nghiệm</th>
                    <th className="text-left p-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {appsLoading ? (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={5}>
                        Đang tải…
                      </td>
                    </tr>
                  ) : myApps?.length ? (
                    myApps.map((it) => (
                      <tr key={it._id} className="border-t">
                        <td className="p-2">{it.full_name}</td>
                        <td className="p-2">{it.email}</td>
                        <td className="p-2">{it.expertise_area}</td>
                        <td className="p-2">{it.experience_years ?? 0} năm</td>
                        <td className="p-2">
                          <span
                            className={
                              "px-2 py-0.5 rounded-lg " +
                              (it.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : it.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700")
                            }
                          >
                            {it.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={5}>
                        Chưa có đơn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!hasApproved && hasPending && (
              <p className="text-sm text-gray-600 mt-3">
                Đơn của bạn đang chờ duyệt. Khi được chấp thuận, vai trò sẽ chuyển sang <b>expert</b>.
                Bạn có thể đăng xuất/đăng nhập lại hoặc tải thông tin tài khoản để cập nhật giao diện.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
