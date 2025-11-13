"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import { Mail, User, Shield, ArrowLeft, LogOut, Leaf } from "lucide-react";
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
      return {
        name,
        email: u.email || "",
        role: "Chuyên gia nông nghiệp",
        avatar:
          u.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
            name
          )}`,
        notifications: 0,
      };
    }
  } catch {}
  return {
    name: "Expert",
    email: "",
    role: "Chuyên gia nông nghiệp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert",
    notifications: 0,
  };
}

export default function ExpertProfile() {
  const [loading, setLoading] = useState(true);
  const [basic, setBasic] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const candidates = ["/api/experts/me/basic", "/experts/me/basic"];
      let ok = false;

      for (const url of candidates) {
        try {
          const res = await axiosClient.get(url);
          const data = res?.data?.data;
          if (data && (data.name || data.email)) {
            setBasic({
              name: data.name || "Expert",
              email: data.email || "",
              role: data.role || "Chuyên gia nông nghiệp",
              avatar:
                data.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  data.name || "expert"
                )}`,
              notifications: Number(data.notifications || 0),
            });
            ok = true;
            break;
          }
        } catch {
          // thử path tiếp theo
        }
      }

      if (!ok) {
        // Không block UI nữa — dùng fallback từ localStorage/mặc định
        setBasic(getLocalUserFallback());
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
  const avatar =
  (data.avatar && String(data.avatar).trim()) ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    data.email || data.id || name || "expert"
  )}`;


  return (
    <div className="xp-wrap">
      {/* Topbar mini */}
      <header className="xp-topbar">
        <div className="xp-topbar-left">
          <div className="xp-logo">
            <Leaf size={18} />
          </div>
          <span>Hồ sơ chuyên gia</span>
        </div>

        <div className="xp-topbar-right">
          <button className="xp-btn ghost" onClick={() => navigate("/expert/home")}>
            <ArrowLeft size={18} /> <span>Quay lại</span>
          </button>
          <button
            className="xp-btn danger ghost"
            onClick={() => {
              localStorage.removeItem("accessToken");
              navigate("/login");
            }}
          >
            <LogOut size={18} /> <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Hero + Card */}
      <section className="xp-hero">
        <div className="xp-hero-bg" />
        <div className="xp-card">
          <div className="xp-card-header">
            <div className="xp-avatar">
              <img src={avatar} alt={name} />
            </div>
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
          </div>

          <div className="xp-actions">
            <button className="xp-btn" onClick={() => navigate("/expert/home")}>
              Trở về trang chuyên gia
            </button>
            <button
              className="xp-btn outline"
              onClick={() => navigate("/profile")}
              title="Đi tới trang hồ sơ đầy đủ (đổi mật khẩu, sửa avatar, v.v.)"
            >
              Chỉnh hồ sơ chi tiết
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
