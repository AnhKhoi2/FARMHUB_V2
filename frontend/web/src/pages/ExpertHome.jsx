"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../css/ExpertHome.css"
import { MessageCircle, Leaf, BarChart3, User, Bell, Settings, LogOut } from "lucide-react"

function ExpertHome({
  onChatClick,
  onAddGuideClick,
  onDashboardClick,
  onAnalyticsClick,
  userProfile = null,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const navigate = useNavigate()

  const mockProfile = userProfile || {
    name: "Nguyen Van A",
    email: "expert@farm.com",
    role: "Agricultural Expert",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=expert",
    notifications: 3,
  }

  return (
    <div className="expert-home">
      {/* Header */}
      <header className="expert-header">
        <div className="header-container">
          {/* Logo & Brand */}
          <div className="header-brand">
            <div className="brand-logo">
              <Leaf className="leaf-icon" />
            </div>
            <h1 className="brand-name">ExpertHome</h1>
          </div>

          {/* 4 Component Buttons */}
          <nav className="header-nav">
            {/* Component 1: Chat */}
            <button className="nav-button nav-button-chat" onClick={onChatClick} title="Trò chuyện với người dùng">
              <MessageCircle size={20} />
              <span>Trò chuyện</span>
            </button>

            {/* Component 2: Manage Guides */}
            <button className="nav-button nav-button-add" onClick={() => navigate('/managerguides')} title="Quản lý hướng dẫn">
              <span>Quản lý hướng dẫn</span>
            </button>

            {/* Component 3: Plant Model */}
            <button
              className="nav-button nav-button-dashboard"
              onClick={() => {
                if (typeof onDashboardClick === "function") return onDashboardClick()
                // navigate to plant models management page under expert routes
                navigate("/expert/plantmodels")
              }}
              title="Mô hình trồng"
            >
              <Leaf size={20} />
              <span>Mô hình trồng</span>
            </button>

            {/* Component 4: Analytics */}
            <button className="nav-button nav-button-analytics" onClick={onAnalyticsClick} title="Phân tích">
              <BarChart3 size={20} />
              <span>Phân tích</span>
            </button>
          </nav>

          {/* Right Section: Notifications & Avatar */}
          <div className="header-right">
            {/* Thông báo */}
            <button className="notification-btn">
              <Bell size={20} />
              {mockProfile.notifications > 0 && <span className="notification-badge">{mockProfile.notifications}</span>}
            </button>

            {/* Avatar & Profile Menu */}
            <div className="profile-section">
              <button className="avatar-btn" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <img src={mockProfile.avatar || "/placeholder.svg"} alt={mockProfile.name} className="avatar-image" />
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


                  <button className="profile-menu-item">
                    <User size={18} />
                    <span>Hồ sơ</span>
                  </button>

                  <button className="profile-menu-item">
                    <Settings size={18} />
                    <span>Cài đặt</span>
                  </button>

                  <div className="profile-divider"></div>

                  <button className="profile-menu-item logout">
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
            <h2 className="welcome-title">Xin chào, {mockProfile.name.split(" ")[1]}! 👋</h2>
            <p className="welcome-subtitle">Quản lý hướng dẫn canh tác và liên lạc với người dùng</p>
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
              <p className="subtitle">Chọn một trong 4 nút ở trên để bắt đầu</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ExpertHome
