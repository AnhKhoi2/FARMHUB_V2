"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/expert/ExpertHome.css";
import {
  MessageCircle,
  Leaf,
  BarChart3,
  User,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import HeaderExpert from "../../components/shared/HeaderExpert";

function ExpertHome({
  onChatClick,
  onAddGuideClick,
  onDashboardClick,
  onAnalyticsClick,
  userProfile = null,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const mockProfile = userProfile || {
    name: "Nguyen Van A",
    email: "expert@farm.com",
    role: "Chuyên gia nông nghiệp",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert",
    notifications: 3,
  };

  return (
    <div className="expert-home">
      {/* Header */}
     <HeaderExpert/>

      {/* Main Content Area */}
      <main className="expert-main">
        <div className="content-container">
          <section className="welcome-section">
            <h2 className="welcome-title">
              Xin chào, {mockProfile.name.split(" ")[1]}! 👋
            </h2>
            <p className="welcome-subtitle">
              Quản lý hướng dẫn trồng trọt và trao đổi với người dùng
            </p>
          </section>

          {/* Quick Stats */}
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
  );
}

export default ExpertHome;
