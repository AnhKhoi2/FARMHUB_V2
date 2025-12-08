"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../css/expert/ExpertHome.css";
// Shared header removed: expert page uses its own header markup
import ChatWidget from "./ChatWidget";
import axiosClient from "../../api/shared/axiosClient";

import {
  MessageCircle,
  Leaf,
  BarChart3,
  TreeDeciduous,
  Book,
  User,
  LogOut,
  Layers,
} from "lucide-react";

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
            avatar: null,


          };
        }
      }
    }
  } catch (_) { }

  return {
    name: "Expert",
    email: "",
    role: "Chuyên gia nông nghiệp",
    avatar: "",
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

  const [guides, setGuides] = useState([]);
  const [models, setModels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [prevUnread, setPrevUnread] = useState(0);

  // 🔴 số cuộc trò chuyện chưa đọc
  const [unreadCount, setUnreadCount] = useState(0);

  // ---------------------- LẤY 3 HƯỚNG DẪN ----------------------
  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const res = await axiosClient.get("/guides?limit=3&page=1");
        setGuides(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy hướng dẫn:", err);
      }
    };

    fetchGuides();
  }, []);

  // ---------------------- LẤY 3 MÔ HÌNH TRỒNG ----------------------
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await axiosClient.get("/admin/models?limit=3");
        setModels(res.data.data || []);
      } catch (err) {
        console.error("Lỗi lấy mô hình:", err);
      }
    };

    fetchModels();
  }, []);

  // ---------------------- LẤY 3 PLANT TEMPLATE ----------------------
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await axiosClient.get("/api/plant-templates?status=active");

        const payload = res.data;
        const list =
          payload?.templates ||
          payload?.data?.templates ||
          payload?.data ||
          [];

        setTemplates((list || []).slice(0, 3));
      } catch (err) {
        console.error("Lỗi lấy plant template:", err);
      }
    };

    fetchTemplates();
  }, []);

  // ---------------------- LẤY SỐ TIN NHẮN CHƯA ĐỌC ----------------------
  useEffect(() => {
    const notifySound = new Audio("/src/assets/sounds/notify.mp3");

    const fetchUnread = async () => {
      try {
        const res = await axiosClient.get("/api/chat/unread");

        const count =
          res?.data?.count ??
          (Array.isArray(res?.data?.data) ? res.data.data.length : 0);

        // Nếu có tin nhắn MỚI tăng thêm → phát âm thanh
        if (count > prevUnread) {
          notifySound.play().catch(() => { });
        }

        setPrevUnread(count);
        setUnreadCount(count || 0);
      } catch (err) {
        console.error("Lỗi lấy số tin nhắn chưa đọc:", err);
      }
    };

    fetchUnread();
    const intervalId = setInterval(fetchUnread, 8000);
    return () => clearInterval(intervalId);
  }, [prevUnread]);

  const handleChatClick = () => {
    if (typeof onChatClick === "function") {
      onChatClick();
    }
    setChatOpen(true);
    setUnreadCount(0); // mở chat thì reset badge
  };

  // ---------------------- LẤY PROFILE CHUYÊN GIA ----------------------

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosClient.get("/api/experts/me/basic");
        const data = res?.data?.data;

        if (data) {
          if (data.role !== "expert") {
            navigate("/");
            return;
        }
          const payload = {
            name: data.name || "Expert",
            email: data.email || "",
            role: data.role || "Chuyên gia nông nghiệp",
            avatar: data.avatar, // luôn là ảnh upload hoặc DiceBear từ BE
          };
          
          setProfile(payload);

          // Lưu đồng bộ cho tất cả màn hình dùng chung
          localStorage.removeItem("authUser");
          localStorage.removeItem("profile");
          localStorage.setItem("authUser", JSON.stringify(payload));
          localStorage.setItem("profile", JSON.stringify(payload));
          

          setLoading(false);

          return;
        }
      } catch (err) {
        console.error("Lỗi lấy profile từ API:", err);
      }

      navigate("/login");

    })();
  }, []);


  if (loading) {
    return (
      <div className="expert-home-loading">
        <p>Đang tải thông tin chuyên gia...</p>
      </div>
    );
  }

  const avatar = profile?.avatar || "";
  const name = profile?.name || "Expert";
  const email = profile?.email || "";
  const role = profile?.role || "Chuyên gia nông nghiệp";

  return (
    <>
      <div className="expert-home">
        <header className="expert-header">
          <div className="header-container">
            {/* ====== BRAND: dùng logo FarmHub thay icon lá ====== */}
            <div
              className="header-brand clickable"
              onClick={() => {
                navigate("/expert");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <span className="farmhub-logo-text">
                <span className="farmhub-logo-farm">Farm</span>
                <span className="farmhub-logo-hub">Hub</span>
              </span>
            </div>


            <nav className="header-nav">
              <button
                className="nav-button nav-button-chat chat-btn-with-badge"
                onClick={handleChatClick}
              >
                <MessageCircle size={20} />
                {unreadCount > 0 && <span className="chat-badge" />}
                <span>Trò chuyện</span>
              </button>

              <button
                className="nav-button nav-button-add"
                onClick={() => {
                  if (onAddGuideClick) onAddGuideClick();
                  navigate("/managerguides");
                }}
              >
                <Book size={20} />
                <span>Quản lý hướng dẫn</span>
              </button>

              <button
                className="nav-button nav-button-dashboard"
                onClick={() => navigate("/experthome/models")}
              >
                <Leaf size={20} />
                <span>Mô hình trồng</span>
              </button>

              <button
                className="nav-button nav-button-template"
                onClick={() => navigate("/expert/plant-templates")}
              >
                <TreeDeciduous />
                <span>Bộ Mẫu Cây Trồng</span>
              </button>


            </nav>

            <div className="header-right">
              <div className="profile-section">
                <button
                  className="avatar-btn"
                  onClick={() => setShowProfileMenu((v) => !v)}
                >
                  <img src={avatar} alt={name} className="avatar-image" />
                </button>

                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div className="profile-header">
                      <img src={avatar} className="profile-avatar" />
                      <div className="profile-info">
                        <p className="profile-name">{name}</p>
                        <p className="profile-email">{email}</p>
                        <p className="profile-role">{role}</p>
                      </div>
                    </div>

                    <div className="profile-divider"></div>

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
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

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

            {/* ---------------------- MÔ HÌNH TRỒNG ---------------------- */}
            <div className="models-section">
              <h2 className="section-title">🌱 Mô Hình Trồng</h2>

              <div className="card-grid">
                {models.map((m) => (
                  <div className="item-card" key={m._id}>
                    <img
                      src={m.image || "/placeholder.jpg"}
                      alt={m.name}
                      className="item-image"
                    />

                    <h3 className="item-name">{m.name}</h3>

                    <p className="item-desc">
                      {m.description?.slice(0, 80)}...
                    </p>

                    <button
                      className="item-btn"
                      onClick={() => navigate(`/experthome/models/${m._id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>

              {models.length === 0 && (
                <p className="subtitle">Chưa có mô hình nào!</p>
              )}
            </div>

            {/* ---------------------- HƯỚNG DẪN TRỒNG ---------------------- */}
            <div className="guides-section">
              <h2 className="section-title">📘 3 Hướng Dẫn Nổi Bật</h2>

              <div className="card-grid">
                {guides.map((g) => (
                  <div className="item-card" key={g._id}>
                    <img
                      src={g.image || "/placeholder.jpg"}
                      alt={(g.title || "").toUpperCase()}
                      className="item-image"
                    />

                    <h3 className="item-name">{(g.title || "").toUpperCase()}</h3>

                    <p className="item-desc">
                      {g.summary?.slice(0, 80) ||
                        g.description?.slice(0, 80)}
                      ...
                    </p>

                    <button
                      className="item-btn"
                      onClick={() => navigate(`/guides/${g._id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>

              {guides.length === 0 && (
                <p className="subtitle">Chưa có hướng dẫn nào!</p>
              )}
            </div>

            {/* ---------------------- PLANT TEMPLATE ---------------------- */}
            <div className="templates-section">
              <h2 className="section-title">🧩 3 Bộ Mẫu Cây Trồng</h2>

              <div className="card-grid">
                {templates.map((t) => (
                  <div className="item-card" key={t._id}>
                    <div className="template-icon-wrapper">
                      <Layers className="template-icon" />
                    </div>

                    <h3 className="item-name">{t.template_name}</h3>

                    <p className="item-meta">
                      {t.plant_group || "Nhóm cây chung"} ·{" "}
                      {t.total_days ||
                        t.total_duration ||
                        t.totalDays ? (
                        <>
                          {t.total_days ||
                            t.total_duration ||
                            t.totalDays}{" "}
                          ngày
                        </>
                      ) : (
                        <>
                          {t.stages?.length || 0} giai đoạn
                        </>
                      )}
                    </p>

                    <p className="item-desc">
                      {t.description?.slice(0, 80) ||
                        "Template chăm sóc cây với các giai đoạn chi tiết."}
                      ...
                    </p>

                    <button
                      className="item-btn"
                      onClick={() =>
                        navigate(`/expert/plant-templates/${t._id}`)
                      }
                    >
                      Xem chi tiết
                    </button>
                  </div>
                ))}
              </div>

              {templates.length === 0 && (
                <p className="subtitle">Chưa có bộ mẫu nào!</p>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Nút chat nổi */}
      <button
        className={`floating-chat-btn chat-btn-with-badge ${chatOpen ? "hide" : ""
          }`}
        onClick={() => {
          setChatOpen(true);
          setUnreadCount(0);
        }}
      >
        <MessageCircle size={26} />
        {unreadCount > 0 && <span className="chat-badge" />}
      </button>

      <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        initialOpenPayload={null}
      />
    </>
  );
}
