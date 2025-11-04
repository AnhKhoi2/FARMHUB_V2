"use client"

import { useState } from "react"
import "../css/ExpertHome.css"
import { MessageCircle, Plus, Leaf, BarChart3, User, Bell, Settings, LogOut } from "lucide-react"

function ExpertHome({
  onChatClick,
  onAddGuideClick,
  onDashboardClick,
  onAnalyticsClick,
  userProfile = null,
}) {
  const [showProfileMenu, setShowProfileMenu] = useState(false)

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
            <button className="nav-button nav-button-chat" onClick={onChatClick} title="Chat with users">
              <MessageCircle size={20} />
              <span>Chat</span>
            </button>

            {/* Component 2: Add Guide */}
            <button className="nav-button nav-button-add" onClick={onAddGuideClick} title="Add growing guide">
              <Plus size={20} />
              <span>Add Guide</span>
            </button>

            {/* Component 3: Dashboard */}
            <button className="nav-button nav-button-dashboard" onClick={onDashboardClick} title="Dashboard">
              <Leaf size={20} />
              <span>Garden</span>
            </button>

            {/* Component 4: Analytics */}
            <button className="nav-button nav-button-analytics" onClick={onAnalyticsClick} title="Analytics">
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>
          </nav>

          {/* Right Section: Notifications & Avatar */}
          <div className="header-right">
            {/* Notifications */}
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
                    <span>Profile</span>
                  </button>

                  <button className="profile-menu-item">
                    <Settings size={18} />
                    <span>Settings</span>
                  </button>

                  <div className="profile-divider"></div>

                  <button className="profile-menu-item logout">
                    <LogOut size={18} />
                    <span>Logout</span>
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
            <h2 className="welcome-title">Welcome, {mockProfile.name.split(" ")[1]}! 👋</h2>
            <p className="welcome-subtitle">Manage growing guides and communicate with users</p>
          </section>

          {/* Quick Stats */}
          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon stat-icon-guides">
                <Leaf />
              </div>
              <div className="stat-content">
                <h3>Guides</h3>
                <p className="stat-value">24</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-chat">
                <MessageCircle />
              </div>
              <div className="stat-content">
                <h3>Messages</h3>
                <p className="stat-value">156</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-users">
                <User />
              </div>
              <div className="stat-content">
                <h3>Users</h3>
                <p className="stat-value">342</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon stat-icon-analytics">
                <BarChart3 />
              </div>
              <div className="stat-content">
                <h3>Interactions</h3>
                <p className="stat-value">1.2K</p>
              </div>
            </div>
          </section>

          {/* Content Placeholder */}
          <section className="content-area">
            <div className="content-placeholder">
              <p>Main content will be displayed here</p>
              <p className="subtitle">Select one of the 4 buttons above to get started</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default ExpertHome
