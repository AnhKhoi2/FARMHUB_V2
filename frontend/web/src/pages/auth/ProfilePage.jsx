import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { profileApi } from "../../api/shared/profileApi.js";
import axiosClient from "../../api/shared/axiosClient.js";
import { toast } from "react-toastify";
import authApi from "../../api/shared/authApi.js";
import expertApplicationApi from "../../api/shared/expertApplicationApi.js";
import { updateUserProfile, setUser } from "../../redux/authSlice";
import { useSelector } from "react-redux";

import "../../css/auth/Profile.css";
import Header from "../../components/shared/Header.jsx";

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
  // Hooks gọi luôn, nhưng effect chỉ thực hiện khi isOpen = true
  useEffect(() => {
    if (!isOpen) return;

    const d = document.body;
    const current = Number(d.dataset.scrollLockCount || 0);
    d.dataset.scrollLockCount = String(current + 1);
    if (current === 0) d.style.overflow = "hidden";

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
      const after = Math.max(0, Number(d.dataset.scrollLockCount || 1) - 1);
      if (after === 0) {
        d.style.overflow = "";
        delete d.dataset.scrollLockCount;
      } else {
        d.dataset.scrollLockCount = String(after);
      }
    };
  }, [isOpen, onClose]);

  // nếu đóng thì vẫn an toàn trả về null (hooks đã được gọi)
  if (!isOpen) return null;

  const handlePwChange = (name, value) => {
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="pw-popup fixed inset-0 z-[2000] flex items-center justify-center"
      onMouseDown={(e) => {
        // click ngoài để đóng
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        className="pw-popup-card agri-card w-full max-w-md p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Đổi mật khẩu"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Đóng"
          className="pw-popup-close"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="mb-2">
          <h2 className="text-xl font-semibold text-agri-primary">
            🔑 Đổi Mật Khẩu
          </h2>
        </div>

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

        <div className="flex justify-end gap-3 pt-4">
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
            className="agri-btn-primary"
          >
            {pwSaving
              ? "Đang xử lý…"
              : needsSetPassword
              ? "✨ Tạo mật khẩu"
              : "🔄 Đổi mật khẩu"}
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
  applyFieldErrors,
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
          <h2 className="text-xl font-semibold mb-4 text-agri-primary">
            Thông báo
          </h2>
          <p className="text-agri-gray">
            {hasApproved
              ? "Bạn đã là Expert. Không cần nộp đơn."
              : "Bạn đã có đơn đang chờ duyệt."}
          </p>
          <button onClick={onClose} className="mt-4 agri-btn-primary">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const getApplyError = (path, applyFieldErrorsLocal) => {
    if (!applyFieldErrorsLocal) return undefined;
    if (applyFieldErrorsLocal[path]) return applyFieldErrorsLocal[path];
    const dotKey = path.replace(/\[(\d+)\]/g, ".$1");
    if (applyFieldErrorsLocal[dotKey]) return applyFieldErrorsLocal[dotKey];
    const bracketKey = path.replace(/\.(\d+)/g, "[$1]");
    if (applyFieldErrorsLocal[bracketKey])
      return applyFieldErrorsLocal[bracketKey];
    return undefined;
  };

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
          <button className="text-2xl text-agri-gray hover:text-agri-primary">
            &times;
          </button>
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
              {getApplyError("full_name", applyFieldErrors) && (
                <p className="text-sm text-red-600 mt-1">
                  {getApplyError("full_name", applyFieldErrors)}
                </p>
              )}
            </div>

            <div>
              <label className="agri-label">Số điện thoại</label>
              <input
                type="text"
                value={applyForm.phone_number}
                onChange={(e) =>
                  onApplyChange("phone_number", e.target.value)
                }
                className="agri-input"
              />
              {getApplyError("phone_number", applyFieldErrors) && (
                <p className="text-sm text-red-600 mt-1">
                  {getApplyError("phone_number", applyFieldErrors)}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="agri-label">Lĩnh vực chuyên môn *</label>
            <input
              type="text"
              value={applyForm.expertise_area}
              onChange={(e) =>
                onApplyChange("expertise_area", e.target.value)
              }
              className="agri-input"
            />
            {getApplyError("expertise_area", applyFieldErrors) && (
              <p className="text-sm text-red-600 mt-1">
                {getApplyError("expertise_area", applyFieldErrors)}
              </p>
            )}
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
              {getApplyError("experience_years", applyFieldErrors) && (
                <p className="text-sm text-red-600 mt-1">
                  {getApplyError("experience_years", applyFieldErrors)}
                </p>
              )}
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
            {getApplyError("description", applyFieldErrors) && (
              <p className="text-sm text-red-600 mt-1">
                {getApplyError("description", applyFieldErrors)}
              </p>
            )}
          </div>

          <div>
            <label className="agri-label">Chứng chỉ / Portfolio (URL)</label>
            <div className="space-y-2">
              {applyForm.certificates.map((url, i) => {
                const err =
                  getApplyError(`certificates.${i}`, applyFieldErrors) ||
                  getApplyError(`certificates[${i}]`, applyFieldErrors);

                return (
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
                    {err ? (
                      <p className="text-sm text-red-600 w-full mt-1">{err}</p>
                    ) : null}
                  </div>
                );
              })}
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

/* ============================
   3. COMPONENT CHÍNH
============================ */
export default function ProfilePage() {
  const dispatch = useDispatch();
  const reduxUser = useSelector((s) => s.auth.user);
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
  const [applyFieldErrors, setApplyFieldErrors] = useState({});

  const [pendingAvatarFile, setPendingAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const avatarPreview =
    previewUrl || (form.avatar ? String(form.avatar).trim() : null);
  const needsSetPassword = hasPassword === false;

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleAvatarSelect = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    setPendingAvatarFile(f);
    setFieldErrors((prev) => ({ ...prev, avatar: undefined }));
  };

  // preview handling for pending file or existing avatar URL
  useEffect(() => {
    let objectUrl;
    if (pendingAvatarFile) {
      objectUrl = URL.createObjectURL(pendingAvatarFile);
      setPreviewUrl(objectUrl);
    } else {
      setPreviewUrl(form.avatar || null);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [pendingAvatarFile, form.avatar]);

  const clearAvatar = () => {
    setPendingAvatarFile(null);
    setForm((prev) => ({ ...prev, avatar: "" }));
    try {
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      void e;
    }
  };

  const isDirty = useMemo(() => {
    try {
      if (pendingAvatarFile) return true; // chọn avatar => coi là dirty
      return JSON.stringify(form || {}) !== JSON.stringify(snapshot || {});
    } catch {
      return true;
    }
  }, [form, snapshot, pendingAvatarFile]);

  const BADGE_META = {
    "hat-giong": { label: "Hạt Giống", emoji: "🌱" },
    "first-streak": { label: "Khởi đầu", emoji: "✨" },
    "streak-7": { label: "7 ngày liên tiếp", emoji: "🏅" },
    "streak-30": { label: "30 ngày kiên trì", emoji: "🥇" },
  };

  const badgeLabel = (slug) => {
    if (!slug) return "";
    if (BADGE_META[slug])
      return `${BADGE_META[slug].emoji} ${BADGE_META[slug].label}`;
    return slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
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

        // 🔹 fullName ưu tiên: profile.fullName → user.profile.name → user.username
        const profileData = {
          fullName:
            payload.fullName ||
            payload.user?.profile?.name ||
            payload.user?.username ||
            "",
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
        console.log(err);
        toast.error("Không tải được hồ sơ.");
      } finally {
        setLoading(false);
      }

      try {
        setAppsLoading(true);
        const res = await expertApplicationApi.getMine();
        setMyApps(res?.data?.data || []);
      } catch (err) {
        console.log(err);
      } finally {
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
    try {
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // ignore
    }
    setPendingAvatarFile(null); // bỏ file tạm đi
    setEditMode(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      // =========================
      // 1. VALIDATE CLIENT-SIDE
      // =========================
      const errors = {};

      // SỐ ĐIỆN THOẠI: 10 số, bắt đầu bằng 0
      const phoneValue = (form.phone || "").trim();
      if (phoneValue) {
        const phoneRegex = /^0\d{9}$/;
        if (!phoneRegex.test(phoneValue)) {
          errors.phone =
            "Số điện thoại không đúng định dạng (phải gồm 10 số và bắt đầu bằng 0).";
        }
      }

      // NGÀY SINH: không được hôm nay / tương lai, không được trong 9 năm đổ lại (tuổi < 10)
      if (form.dob) {
        const dt = new Date(form.dob);
        if (Number.isNaN(dt.getTime())) {
          errors.dob = "Ngày sinh không hợp lệ.";
        } else {
          const today = new Date();
          const todayDateOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const dobDateOnly = new Date(
            dt.getFullYear(),
            dt.getMonth(),
            dt.getDate()
          );

          if (dobDateOnly >= todayDateOnly) {
            errors.dob = "Ngày sinh không được là ngày hiện tại hoặc tương lai.";
          } else {
            // hôm nay trừ 9 năm -> nếu dob > mốc này thì là trong 9 năm đổ lại
            const nineYearsAgo = new Date(
              todayDateOnly.getFullYear() - 9,
              todayDateOnly.getMonth(),
              todayDateOnly.getDate()
            );
            if (dobDateOnly > nineYearsAgo) {
              errors.dob =
                "Ngày sinh không được trong 9 năm đổ lại (người dùng phải từ 10 tuổi trở lên).";
            }
          }
        }
      }

      // ĐỊA CHỈ: tối đa 150 ký tự
      const addressVal = (form.address || "").trim();
      if (addressVal.length > 150) {
        errors.address = "Địa chỉ tối đa 150 ký tự.";
      }

      // GIỚI THIỆU: tối đa 150 ký tự
      const bioVal = (form.bio || "").trim();
      if (bioVal.length > 150) {
        errors.bio = "Giới thiệu tối đa 150 ký tự.";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setSaving(false);
        toast.error("Vui lòng kiểm tra lại các trường đã nhập.");
        return;
      }

      // =========================
      // 2. GỬI LÊN SERVER
      // =========================
      const payload = { ...form };
      if (form.dob) payload.dob = new Date(form.dob).toISOString();

      // ⭐ Nếu có chọn avatar mới → upload Cloudinary trước
      if (pendingAvatarFile) {
        try {
          const fd = new FormData();
          // Dùng key "file" và route cloudinary-upload
          fd.append("file", pendingAvatarFile);

          const upRes = await axiosClient.post("/api/cloudinary-upload", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          const returnedUrl = upRes?.data?.url;
          if (!returnedUrl) {
            toast.error(
              "Upload avatar thất bại: không có URL trả về từ Cloudinary"
            );
            setSaving(false);
            return;
          }

          // Cloudinary trả URL absolute → gán thẳng vào payload
          payload.avatar = returnedUrl;

          // 🔥 Cập nhật ngay form + snapshot để UI đổi ảnh liền
          setForm((prev) => ({ ...prev, avatar: returnedUrl }));
          setSnapshot((prev) =>
            prev ? { ...prev, avatar: returnedUrl } : prev
          );

          // 🔥 Cập nhật ngay Redux user để Header đổi avatar không cần F5
          try {
            const cacheBusted = returnedUrl + "?v=" + Date.now();
            const currentUser =
              reduxUser || JSON.parse(localStorage.getItem("user")) || {};
            const mergedUser = {
              ...currentUser,
              profile: {
                ...(currentUser.profile || {}),
                avatar: cacheBusted,
              },
            };
            dispatch(setUser(mergedUser));

            // DOM fallback: cập nhật trực tiếp các thẻ img.avatar nếu có
            try {
              const domImages = document.querySelectorAll("img.avatar");
              domImages.forEach((el) => {
                el.src = cacheBusted;
                el.dataset.retry = "1";
              });
              const headerImg = document.querySelector(".user-menu-header img");
              if (headerImg) headerImg.src = cacheBusted;
            } catch (e) {
              // ignore
            }
          } catch (e) {
            console.log("Redux update avatar error:", e);
          }
        } catch (err) {
          console.error(err);
          toast.error("Không thể upload avatar lên Cloudinary.");
          setSaving(false);
          return;
        }
      }

      const { data } = await profileApi.updateProfile(payload);
      const raw = data?.data || {};
      const updatedProfile = raw.profile || raw;

      const normalized = {
        ...form,
        ...updatedProfile,
        dob: updatedProfile.dob || form.dob,
      };

      setForm(normalized);
      // update local serverUser if backend returned user info
      if (raw.user)
        setServerUser((prev) => ({ ...(prev || {}), ...raw.user }));
      setSnapshot(normalized);

      // If backend returned full user object, set it into Redux so Header updates immediately.
      try {
        if (raw.user) {
          // ensure avatar has cache-busting
          const u = { ...raw.user };
          if (u.profile?.avatar)
            u.profile.avatar = u.profile.avatar + "?v=" + Date.now();
          console.log("[ProfilePage] dispatching setUser:", u);
          dispatch(setUser(u));
          console.log(
            "[ProfilePage] localStorage.user after setUser:",
            localStorage.getItem("user")
          );
          // DOM-level fallback: force update header avatar(s) immediately
          try {
            const newAvatar = u.profile?.avatar || u.avatar || null;
            if (newAvatar) {
              const els = document.querySelectorAll("img.avatar");
              els.forEach((el) => {
                try {
                  el.src = newAvatar;
                  el.dataset.retry = "1";
                } catch (e) {
                  void e;
                }
              });
              const headerImg = document.querySelector(".user-menu-header img");
              if (headerImg) headerImg.src = newAvatar;
            }
          } catch (e) {
            // ignore DOM failures
            void e;
          }
        } else {
          const profileUpdate = {};
          if (normalized.avatar)
            profileUpdate.avatar = normalized.avatar + "?v=" + Date.now();
          if (normalized.fullName) profileUpdate.name = normalized.fullName;

          if (Object.keys(profileUpdate).length) {
            console.log(
              "[ProfilePage] dispatching updateUserProfile (fallback):",
              profileUpdate
            );
            // Try to merge into existing redux user and set full user to ensure Header updates
            try {
              const current =
                reduxUser ||
                JSON.parse(localStorage.getItem("user")) ||
                {};
              const merged = {
                ...current,
                profile: {
                  ...(current.profile || {}),
                  ...profileUpdate,
                },
              };
              console.log(
                "[ProfilePage] dispatching setUser(merged):",
                merged
              );
              dispatch(setUser(merged));
              console.log(
                "[ProfilePage] localStorage.user after setUser(merged):",
                localStorage.getItem("user")
              );
              // DOM-level fallback for merged user
              try {
                const newAvatar =
                  merged.profile?.avatar || merged.avatar || null;
                if (newAvatar) {
                  const els = document.querySelectorAll("img.avatar");
                  els.forEach((el) => {
                    try {
                      el.src = newAvatar;
                      el.dataset.retry = "1";
                    } catch (e) {
                      void e;
                    }
                  });
                  const headerImg = document.querySelector(
                    ".user-menu-header img"
                  );
                  if (headerImg) headerImg.src = newAvatar;
                }
              } catch (e) {
                void e;
              }
            } catch (e) {
              // fallback to updateUserProfile reducer
              console.log(e);
              dispatch(updateUserProfile(profileUpdate));
            }
          }
        }
      } catch (e) {
        // ignore
        console.log(e);
      }

      setEditMode(false);
      setPendingAvatarFile(null); // clear file sau khi lưu
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

    if (
      !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/.test(
        pwForm.newPassword
      )
    )
      return toast.error(
        "Mật khẩu ≥8 ký tự và có chữ + số + ký tự đặc biệt."
      );

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
      message.error(
        err?.response?.data?.message || "Không thể đổi mật khẩu"
      );
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

    if (
      !applyForm.full_name?.trim() ||
      !applyForm.expertise_area?.trim()
    ) {
      return toast.error("Họ tên + lĩnh vực là bắt buộc.");
    }

    setApplySaving(true);
    setApplyFieldErrors({});
    try {
      const payload = {
        ...applyForm,
        certificates: applyForm.certificates.filter(Boolean),
      };

      await expertApplicationApi.create(payload);
      toast.success("Đã gửi đơn đăng ký Expert!");

      // ✅ Sync phone + fullName sang profile nếu user có nhập
      const profileUpdate = {};
      if (payload.phone_number && payload.phone_number.trim()) {
        profileUpdate.phone = payload.phone_number.trim();
      }
      if (payload.full_name && payload.full_name.trim()) {
        profileUpdate.fullName = payload.full_name.trim();
      }

      if (Object.keys(profileUpdate).length > 0) {
        try {
          await profileApi.updateProfile(profileUpdate);

          // Cập nhật ngay UI profile
          setForm((prev) => ({
            ...prev,
            ...profileUpdate,
          }));
          setSnapshot((prev) =>
            prev ? { ...prev, ...profileUpdate } : prev
          );
        } catch (syncErr) {
          console.log(
            "Sync phone/fullName to profile from modal failed:",
            syncErr
          );
        }
      }

      setAppModalOpen(false);

      const res = await expertApplicationApi.getMine();
      setMyApps(res?.data?.data || []);
    } catch (err) {
      const status = err?.response?.status;
      const body = err?.response?.data;
      if (status === 422 || status === 400) {
        const errors = {};
        if (body?.errors && typeof body.errors === "object") {
          Object.assign(errors, body.errors);
        } else if (Array.isArray(body?.details)) {
          body.details.forEach((d) => {
            const path = Array.isArray(d.path) ? d.path.join(".") : d.path;
            errors[path] = d.message;
          });
        } else if (
          body?.message &&
          body?._original &&
          Array.isArray(body.details)
        ) {
          body.details.forEach((d) => {
            const path = Array.isArray(d.path) ? d.path.join(".") : d.path;
            errors[path] = d.message;
          });
        }
        setApplyFieldErrors(errors);
        toast.error(body?.message || "Vui lòng kiểm tra các trường");
      } else {
        toast.error(body?.message || body?.error || "Nộp đơn thất bại");
      }
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
    <>
      <Header />

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
              <span className="font-mono">{serverUser.email}</span> · Vai
              trò:{" "}
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
                {form.fullName ||
                  serverUser?.profile?.name ||
                  serverUser?.username ||
                  "Người dùng"}
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
                    <div>
                      <span className="agri-label">Số điện thoại:</span>{" "}
                      {form.phone || "-"}
                    </div>
                    <div>
                      <span className="agri-label">Ngày sinh:</span>{" "}
                      {toDateDisplay(form.dob)}
                    </div>
                    <div>
                      <span className="agri-label">Giới tính:</span>{" "}
                      {form.gender === "male"
                        ? "Nam 👨"
                        : form.gender === "female"
                        ? "Nữ 👩"
                        : "Khác ❓"}
                    </div>
                    <div>
                      <span className="agri-label">Địa chỉ:</span>{" "}
                      {form.address || "-"}
                    </div>
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
                    <p className="text-sm text-red-600">
                      {fieldErrors.__server}
                    </p>
                  )}

                  <div>
                    <label className="agri-label">Ảnh đại diện</label>
                    <div className="flex items-start gap-6">
                      <div className="flex flex-col items-center">
                        <div className="avatar-wrapper">
                          {avatarPreview ? (
                            <img
                              src={avatarPreview}
                              alt="avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center text-sm text-agri-gray">
                              Chưa có
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            className="hidden"
                          />
                          {/* Nếu muốn cho phép upload từ đây thì bỏ comment nút dưới */}
                          {/* <button
                            type="button"
                            onClick={() =>
                              fileInputRef.current &&
                              fileInputRef.current.click()
                            }
                            className="agri-btn-secondary"
                          >
                            Tải ảnh lên
                          </button> */}
                          <button
                            type="button"
                            onClick={clearAvatar}
                            className="agri-btn-secondary"
                          >
                            Xóa
                          </button>
                        </div>
                        {fieldErrors.avatar && (
                          <p className="text-sm text-red-600 mt-2">
                            {fieldErrors.avatar}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">{/* chừa chỗ cho inputs */}</div>
                    </div>
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
                    {fieldErrors.fullName && (
                      <p className="text-sm text-red-600 mt-1">
                        {fieldErrors.fullName}
                      </p>
                    )}
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
                      {fieldErrors.phone && (
                        <p className="text-sm text-red-600 mt-1">
                          {fieldErrors.phone}
                        </p>
                      )}
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
                      {fieldErrors.dob && (
                        <p className="text-sm text-red-600 mt-1">
                          {fieldErrors.dob}
                        </p>
                      )}
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
                      {fieldErrors.address && (
                        <p className="text-sm text-red-600 mt-1">
                          {fieldErrors.address}
                        </p>
                      )}
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
                    {fieldErrors.bio && (
                      <p className="text-sm text-red-600 mt-1">
                        {fieldErrors.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !isDirty}
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
                      onClick={() => navigate("/expert/apply")}
                      className="agri-btn-primary"
                    >
                      ✉️ Nộp đơn Expert
                    </button>
                  )}
                </div>
              </div>

              {/* Lịch sử đơn */}
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2 text-agri-primary">
                  Lịch sử Đơn đã nộp
                </h3>

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
                          <td
                            colSpan="5"
                            className="p-3 text-center text-agri-gray"
                          >
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
                          <td
                            colSpan="5"
                            className="p-3 text-center text-agri-gray"
                          >
                            Chưa có đơn nào
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {!hasApproved && hasPending && (
                  <p className="text-sm text-agri-gray mt-3 p-3 bg-agri-green-light rounded-lg">
                    Đơn của bạn đang chờ duyệt. Khi được chấp thuận, vai trò
                    sẽ chuyển sang <b>expert</b>. Vui lòng đăng xuất và đăng
                    nhập lại với quyền Chuyên Gia.
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
          applyFieldErrors={applyFieldErrors}
        />
      </div>
    </>
  );
}
