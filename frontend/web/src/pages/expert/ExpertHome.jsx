"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/expert/ExpertHome.css";
import ChatWidget from "./ChatWidget";
import axiosClient from "../../api/shared/axiosClient";
import {
  MessageCircle,
  Leaf,
  BarChart3,
  User,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";

// Fallback lấy user từ localStorage (tuỳ theo dự án bạn lưu key gì)
function getLocalUserFallback() {
  try {
    const keys = ["authUser", "user", "profile"]; // thử vài key phổ biến
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.username || u.fullName || u.email)) {
          const name = u.fullName || u.username || (u.email ? u.email.split("@")[0] : "Expert");
          return {
            name,
            email: u.email || "",
            role: "Chuyên gia nông nghiệp",
            avatar:
              u.avatar ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            notifications: 0,
          };
        }
      }
    }
  } catch (_) {}
  // fallback mặc định cuối
  return {
    name: "Expert",
    email: "",
    role: "Chuyên gia nông nghiệp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert",
    notifications: 0,
  };
}

export default function ExpertHome({
  onChatClick,
  onAddGuideClick,
  onDashboardClick,
  onAnalyticsClick,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  // ✅ THÊM: state mở/đóng ChatWidget
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    (async () => {
      // Một số dự án set baseURL = http://.../api, số khác là http://...
      const candidates = ["/api/experts/me/basic", "/experts/me/basic"];
      let ok = false;
      for (const url of candidates) {
        try {
          const res = await axiosClient.get(url);
          const data = res?.data?.data;
          if (data && (data.name || data.email)) {
            setProfile({
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
        } catch (e) {
          // thử path tiếp theo
          // console.warn("Fetch failed", url, e?.response?.status, e?.message);
        }
      }
      if (!ok) {
        // Không chặn UI nữa — dùng local/mặc định
        setProfile(getLocalUserFallback());
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="expert-home-loading">
        <p>Đang tải thông tin chuyên gia...</p>
      </div>
    );
  }

  const avatar = profile?.avatar || "/placeholder.svg";
  const name = profile?.name || "Expert";
  const email = profile?.email || "";
  const role = profile?.role || "Chuyên gia nông nghiệp";
  const notifications = Number(profile?.notifications || 0);

  // ✅ BỌC BẰNG FRAGMENT ĐỂ CÓ THÊM CHATWIDGET Ở CUỐI
  return (
    <>
      <div className="expert-home">
        {/* Header */}
        <header className="expert-header">
          <div className="header-container">
            {/* Logo & Brand */}
            <div className="header-brand">
              <div className="brand-logo">
                <Leaf className="leaf-icon" />
              </div>
              <h1 className="brand-name">Trang chuyên gia</h1>
            </div>
          {/* 4 Component Buttons */}
          <nav className="header-nav">
            {/* Component 1: Chat */}
            <button
              className="nav-button nav-button-chat"
              onClick={onChatClick}
              title="Trao đổi với người dùng"
            >
              <MessageCircle size={20} />
              <span>Trò chuyện</span>
            </button>

            {/* Component 2: Manage Guides */}
            <button
              className="nav-button nav-button-add"
              onClick={() => {
                try {
                  if (onAddGuideClick) onAddGuideClick();
                } catch (e) {
                  void e;
                }
                navigate("/managerguides");
              }}
              title="Quản lý hướng dẫn"
            >
              <span>Quản lý hướng dẫn</span>
            </button>

            {/* Component 3: Dashboard */}
            <button
              className="nav-button nav-button-dashboard"
              onClick={() => navigate("/experthome/models")}
              title="Mô hình trồng"
            >
              <Leaf size={20} />
              <span>Mô hình trồng</span>
            </button>

            {/* Component 4: Plant Templates */}
            <button
              className="nav-button nav-button-template"
              onClick={() => navigate("/expert/plant-templates")}
              title="Plant Templates"
            >
              <span>Bộ Mẫu Cây Trồng</span>
            </button>

            {/* Component 5: Analytics */}
            <button
              className="nav-button nav-button-analytics"
              onClick={onAnalyticsClick}
              title="Phân tích"
            >
              <BarChart3 size={20} />
              <span>Phân tích</span>
            </button>
          </nav>

      <div className="header-right">
        {/* Notifications */}
              <button className="notification-btn" title="Thông báo">
                <Bell size={20} />
                {notifications > 0 && (
                  <span className="notification-badge">{notifications}</span>
                )}
              </button>

              {/* Avatar & Profile Menu */}
              <div className="profile-section">
                <button
                  className="avatar-btn"
                  onClick={() => setShowProfileMenu((v) => !v)}
                  title="Mở hồ sơ"
                >
                  <img src={avatar} alt={name} className="avatar-image" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <img src={avatar} alt={name} className="profile-avatar" />
                      <div className="profile-info">
                        <p className="profile-name">{name}</p>
                        <p className="profile-email">{email}</p>
                        <p className="profile-role">{role}</p>
                      </div>
                    </div>

                    <div className="profile-divider"></div>

                    {/* Hồ sơ */}
                    <button
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/expert/profile");
                      }}
                    >
                      <User size={18} />
                      <span>Hồ sơ</span>
                    </button>

                    {/* Cài đặt */}
                    <button
                      className="profile-menu-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate("/settings");
                      }}
                    >
                      <Settings size={18} />
                      <span>Cài đặt</span>
                    </button>

                    <div className="profile-divider"></div>

                    {/* Đăng xuất */}
                    <button
                      className="profile-menu-item logout"
                      onClick={() => {
                        localStorage.removeItem("accessToken");
                        setShowProfileMenu(false);
                        navigate("/login");
                      }}
                    >
                      <LogOut size={18} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="expert-main">
          <div className="content-container">
            <section className="welcome-section">
              <h2 className="welcome-title">
                Xin chào, {name.split(" ")[1] || name}! 👋
              </h2>
              <p className="welcome-subtitle">
                Quản lý hướng dẫn trồng trọt và trao đổi với người dùng
              </p>
            </section>

            {/* Quick Stats (demo) */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon stat-icon-guides">
                  <Leaf />
                </div>
                <div className="stat-content">
                  <h3>Hướng dẫn</h3>
                  <p className="stat-value">24</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon-chat">
                  <MessageCircle />
                </div>
                <div className="stat-content">
                  <h3>Tin nhắn</h3>
                  <p className="stat-value">156</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon-users">
                  <User />
                </div>
                <div className="stat-content">
                  <h3>Người dùng</h3>
                  <p className="stat-value">342</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon stat-icon-analytics">
                  <BarChart3 />
                </div>
                <div className="stat-content">
                  <h3>Tương tác</h3>
                  <p className="stat-value">1.2K</p>
                </div>
              </div>
            </section>

            {/* Content Placeholder */}
            <section className="content-area">
              <div className="content-placeholder">
                <p>Nội dung chính sẽ hiển thị ở đây</p>
                <p className="subtitle">
                  Chọn một trong 4 nút phía trên để bắt đầu
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* ✅ Chat panel để ngoài .expert-home */}
      <ChatWidget
  open={chatOpen}
  onClose={(v) => setChatOpen(Boolean(v))}   // nhận tham số true/false từ ChatWidget
  initialOpenPayload={null}
/>

    </>
  );
}
