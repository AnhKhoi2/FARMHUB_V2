import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Leaf,
	MessageCircle,
	BarChart3,
	Bell,
	User,
	Settings,
	LogOut,
} from "lucide-react";

export default function HeaderExpert({
	onChatClick,
	onAddGuideClick,
	onAnalyticsClick,
	profile = null,
}) {
	const navigate = useNavigate();
	const [showProfileMenu, setShowProfileMenu] = useState(false);

	const mockProfile =
		profile ||
		({
			name: "Chuyên gia",
			email: "expert@example.com",
			role: "expert",
			avatar: null,
			notifications: 0,
		});

	return (
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

				{/* Right Section: Notifications & Avatar */}
				<div className="header-right">
					{/* Notifications */}
					<button className="notification-btn" aria-label="Thông báo">
						<Bell size={20} />
						{mockProfile.notifications > 0 && (
							<span className="notification-badge">{mockProfile.notifications}</span>
						)}
					</button>

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

								<button className="profile-menu-item" onClick={() => navigate('/profile')}>
									<User size={18} />
									<span>Hồ sơ</span>
								</button>

								<button className="profile-menu-item" onClick={() => navigate('/settings')}>
									<Settings size={18} />
									<span>Cài đặt</span>
								</button>

								<div className="profile-divider"></div>

								<button className="profile-menu-item logout" onClick={() => {/* TODO: add logout */}}>
									<LogOut size={18} />
									<span>Đăng xuất</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
