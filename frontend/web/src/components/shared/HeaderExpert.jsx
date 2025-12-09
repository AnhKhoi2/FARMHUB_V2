import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Leaf,
  MessageCircle,
  BarChart3,
  Book,
  Bell,
  User,
  TreeDeciduous,
  LogOut,
} from "lucide-react";

import axiosClient from "../../api/shared/axiosClient";

// Hàm fallback giống ExpertHome
function getLocalUserFallback() {
  try {
    const keys = ["authUser", "user", "profile"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw) {
        const u = JSON.parse(raw);
        if (u && (u.username || u.fullName || u.email)) {
          const name =
            u.fullName ||
            u.username ||
            (u.email ? u.email.split("@")[0] : "Expert");
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
      }
    }
  } catch (_) {}

  return {
    name: "Expert",
    email: "",
    role: "Chuyên gia nông nghiệp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert",
    notifications: 0,
  };
}

export default function HeaderExpert({
  onChatClick,
  onAddGuideClick,
  onAnalyticsClick,
  profile = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [internalProfile, setInternalProfile] = useState(null);

  // 🟢 LẤY PROFILE CHUYÊN GIA (giống ExpertHome)
  useEffect(() => {
    if (profile) {
      setInternalProfile(profile);
      return;
    }

    (async () => {
      const candidates = ["/api/experts/me/basic", "/experts/me/basic"];
      let ok = false;

      for (const url of candidates) {
        try {
          const res = await axiosClient.get(url);
          const data = res?.data?.data;
          if (data && (data.name || data.email)) {
            setInternalProfile({
              name: data.name || "Expert",
              email: data.email || "",
              role: data.role || "Chuyên gia nông nghiệp",
              avatar:
                data.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                  data.name || "expert"
                )}`,
              notifications: data.notifications || 0,
            });
            ok = true;
            break;
          }
        } catch (_) {
          // thử endpoint tiếp theo
        }
      }

      if (!ok) {
        setInternalProfile(getLocalUserFallback());
      }
    })();
  }, [profile]);

  const mockProfile = internalProfile || getLocalUserFallback();

  // 👉 Click vào FarmHub
  const handleBrandClick = () => {
    if (location.pathname === "/expert") {
      // đang ở home expert rồi → chỉ cuộn mượt lên đầu
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // trang khác → chỉ navigate, không scroll để đỡ giật
      navigate("/expert");
    }
  };

  return (
    <header className="expert-header">
      <div className="header-container">
        {/* Logo & Brand (không ô vuông, style trực tiếp) */}
        <div className="header-brand clickable" onClick={handleBrandClick}>
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

        {/* 4 Component Buttons */}
        <nav className="header-nav">
          {/* Component 1: Chat */}
          <button
            className="nav-button nav-button-chat"
            onClick={onChatClick}
            title="Trao đổi với người dùng"
          >
            <MessageCircle size={20} />
            <span>TRÒ CHUYỆN</span>
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
            <Book />
            <span>QUẢN LÝ HƯỚNG DẪN</span>
          </button>

          {/* Component 3: Dashboard */}
          {/* <button
            className="nav-button nav-button-dashboard"
            onClick={() => navigate("/experthome/models")}
            title="Mô hình trồng"
          >
            <Leaf size={20} />
            <span>Mô hình trồng</span>
          </button> */}

          {/* Component 4: Plant Templates */}
          <button
            className="nav-button nav-button-template"
            onClick={() => navigate("/expert/plant-templates")}
            title="Plant Templates"
          >
            <TreeDeciduous />
            <span>BỘ MẪU CÂY TRỒNG</span>
          </button>

          {/* Component 5: Analytics */}
          
        </nav>

        {/* Right Section: Notifications & Avatar */}
        <div className="header-right">
          

          {/* Avatar & Profile Menu */}
          <div className="profile-section">
            <button
              className="avatar-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
            >
              <img
                src={mockProfile.avatar || "/placeholder.svg"}
                alt={mockProfile.name}
                className="avatar-image"
              />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <img
                    src={mockProfile.avatar || "/placeholder.svg"}
                    alt={mockProfile.name}
                    className="profile-avatar"
                  />
                  <div className="profile-info">
                    <p className="profile-name">{mockProfile.name}</p>
                    <p className="profile-email">{mockProfile.email}</p>
                    <p className="profile-role">{mockProfile.role}</p>
                  </div>
                </div>

                <div className="profile-divider"></div>

                <button
                  className="profile-menu-item"
                  onClick={() => navigate("/expert/profile")}
                >
                  <User size={18} />
                  <span>Hồ Sơ</span>
                </button>

                <div className="profile-divider"></div>

                <button
                  className="profile-menu-item logout"
                  onClick={() => {
                    localStorage.removeItem("accessToken");
                    setShowProfileMenu(false);
                    navigate("/login");
                  }}
                >
                  <LogOut size={18} />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
