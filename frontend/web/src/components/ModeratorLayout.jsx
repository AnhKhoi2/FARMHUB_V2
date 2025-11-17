import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logoutThunk } from "../redux/authThunks";
import { FaHome, FaClipboardList, FaFlag, FaSignOutAlt } from "react-icons/fa";

const STORAGE_KEY = "moderatorSidebarCollapsed";

export default function ModeratorLayout({ children }) {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [collapsed, setCollapsed] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved === "true") setCollapsed(true);
		} catch (e) {
			console.warn("ModeratorLayout: failed to read sidebar state", e);
		}
	}, []);

	const toggle = () => {
		setCollapsed((c) => {
			const nv = !c;
			try {
				localStorage.setItem(STORAGE_KEY, String(nv));
			} catch (e) {
				console.warn("ModeratorLayout: failed to persist sidebar state", e);
			}
			return nv;
		});
	};

	const doLogout = () => {
		dispatch(logoutThunk());
		navigate("/login");
	};

	const width = collapsed ? 72 : 220;

	const linkBase = "nav-link text-white py-2 px-3 d-flex align-items-center gap-2";
	const activeExtra = " active bg-white bg-opacity-10 rounded";

	const navItems = [
		{ to: "/moderator", label: "Trang chính", icon: <FaHome /> },
		{ to: "/moderator/managerpost", label: "Quản lý bài viết", icon: <FaClipboardList /> },
		{ to: "/moderator/managerreport", label: "Báo cáo", icon: <FaFlag /> },
	];

	return (
		<div>
			<style>{`
				.moderator-sidebar { position: fixed; top:0; left:0; bottom:0; overflow-y:auto; z-index:1030; transition: width .18s ease; }
				.moderator-main { min-height:100vh; background:#f8fafc; transition: margin-left .18s ease; }
				.moderator-hamburger { border:0; background:transparent; font-size:1.1rem; line-height:1; }
				.moderator-logo { font-weight:600; font-size:1rem; letter-spacing:.3px; }
				.moderator-nav-label { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
				.moderator-sidebar::-webkit-scrollbar { width:6px; }
				.moderator-sidebar::-webkit-scrollbar-thumb { background:rgba(0,0,0,.12); border-radius:3px; }
			`}</style>

			<aside
				className="moderator-sidebar d-flex flex-column text-white"
				style={{ width, background: "#2b3a42", color: "#e6eef2" }}
			>
				<div className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom" style={{ minHeight: 60 }}>
					<div className="moderator-logo d-flex align-items-center gap-2" style={{ opacity: collapsed ? 0 : 1, transition: "opacity .12s" }}>
						<img src="/logo192.png" alt="logo" style={{ width: 28, height: 28, borderRadius: 6 }} />
						<div style={{ lineHeight: 1 }}>
							<div style={{ fontWeight: 700, color: '#fff' }}>FarmHub</div>
							<small style={{ color: '#d1d7db' }}>Moderator</small>
						</div>
					</div>
					<button className="moderator-hamburger text-white" onClick={toggle} title={collapsed ? "Mở rộng" : "Thu nhỏ"}>
						{collapsed ? "☰" : "✕"}
					</button>
				</div>

				<nav className="nav flex-column py-2 small flex-grow-1">
					{navItems.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							title={collapsed ? item.label : undefined}
							className={({ isActive }) => linkBase + (isActive ? activeExtra : "")}
							style={{ fontSize: ".93rem" }}
						>
							<span className="me-1" style={{ width: 22, textAlign: "center", color: '#e6eef2' }}>
								{item.icon}
							</span>
							{!collapsed && <span className="moderator-nav-label flex-grow-1">{item.label}</span>}
						</NavLink>
					))}
				</nav>

				<div className="p-3 mt-auto border-top" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
					<div className="d-grid gap-2">
						<button className="btn btn-sm btn-light" onClick={() => navigate('/')}>
							{collapsed ? '🏠' : 'Xem trang'}
						</button>
						<button className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center gap-2" onClick={doLogout}>
							<FaSignOutAlt /> {!collapsed && <span>Đăng xuất</span>}
						</button>
					</div>
					{!collapsed && <div className="mt-3 text-white-50 small text-center">© {new Date().getFullYear()} FarmHub</div>}
				</div>
			</aside>

			<main className="moderator-main" style={{ marginLeft: width, padding: "1rem 1rem" }}>
				<header className="d-flex align-items-center justify-content-between mb-4" style={{ minHeight: 56 }}>
					<div className="d-flex align-items-center gap-3">
						<button className="btn btn-sm btn-outline-secondary d-none d-md-inline" onClick={toggle}>{collapsed ? 'Mở rộng' : 'Thu nhỏ'}</button>
						<div>
							<h1 className="h5 mb-0">Bảng điều khiển Moderator</h1>
							<small className="text-muted">Quản lý báo cáo và nội dung</small>
						</div>
					</div>
					<div className="d-flex align-items-center gap-2">
						<div className="small text-muted">Moderator</div>
						<div style={{ width:36, height:36, borderRadius:18, background:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#444' }}>M</div>
					</div>
				</header>

				<div className="content-wrapper container-fluid px-0">
					{children}
				</div>
			</main>
		</div>
	);
}

