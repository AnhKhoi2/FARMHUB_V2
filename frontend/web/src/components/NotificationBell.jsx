import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/NotificationBell.css";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial fetch only if authenticated
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds (only if logged in)
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const getToken = () =>
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    null;

  const fetchUnreadCount = async () => {
    const token = getToken();
    if (!token) return; // Silent skip when unauthenticated
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/notifications/unread-count`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // backend returns { success: true, data: { unread_count: N } }
      setUnreadCount(response.data?.data?.unread_count || 0);
    } catch (error) {
      if (error?.response?.status === 401) {
        // Token invalid -> clear counts and stop spamming console
        setUnreadCount(0);
      } else {
        console.error("Error fetching unread count:", error);
      }
    }
  };

  const fetchNotifications = async () => {
    const token = getToken();
    if (!token) return; // Do nothing if not logged in
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/notifications`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(response.data.data || []);
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Error fetching notifications:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDropdown = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const markAsRead = async (notificationId) => {
    const token = getToken();
    if (!token) return;
    try {
      // Backend expects a PATCH to /api/notifications/mark-read with body { notification_ids: [id] }
      await axios.patch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/notifications/mark-read`,
        { notification_ids: [notificationId] },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      fetchUnreadCount();
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Error marking as read:", error);
      }
    }
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      // Backend route is /api/notifications/mark-all-read
      await axios.patch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      if (error?.response?.status !== 401) {
        console.error("Error marking all as read:", error);
      }
    }
  };

  const navigate = useNavigate();

  const handleNotificationClick = async (notif, link) => {
    // mark read first, then navigate using react-router
    if (!notif.is_read) {
      try {
        await markAsRead(notif._id);
      } catch (e) {
        console.warn("Failed to mark notification read before navigation", e);
      }
    }

    if (link) {
      navigate(link);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "stage_warning":
        return "⚠️";
      case "stage_skipped":
        return "⏭️";
      case "stage_overdue":
        return "⏰";
      case "stage_completed":
        return "✅";
      case "stage_reminder":
        return "🔔";
      default:
        return "📢";
    }
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";

    // Parse date robustly
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      // Try numeric timestamp
      const num = Number(date);
      if (!isNaN(num)) {
        const d2 = new Date(num);
        if (!isNaN(d2.getTime())) {
          return d2.toLocaleDateString("vi-VN");
        }
      }

      // Fallback: return original string or empty
      return String(date);
    }

    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);

    // If older than a week, show full date for clarity
    if (days >= 7) return d.toLocaleDateString("vi-VN");

    return `${days} ngày trước`;
  };

  return (
    <div className="notification-bell-wrapper">
      <button
        className="notification-bell-btn"
        onClick={handleToggleDropdown}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {notifications.length > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <p>Không có thông báo mới</p>
              </div>
            ) : (
              notifications.map((notif) => {
                // Determine link for notification
                let link = null;
                const nid =
                  notif.notebook_id &&
                  (notif.notebook_id._id || notif.notebook_id);
                if (nid) {
                  if (notif.type === "stage_overdue") {
                    link = `/farmer/notebooks/${nid}/overdue`;
                  } else {
                    // For warnings, skipped, completed, daily reminders -> open notebook detail
                    link = `/farmer/notebooks/${nid}`;
                  }
                }
                return (
                  <div
                    key={notif._id}
                    className={`notification-item-card ${
                      notif.is_read ? "read" : "unread"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNotificationClick(notif, link);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(notif, link);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      padding: "16px 20px",
                      borderRadius: "12px",
                      margin: "12px 16px",
                      boxShadow: notif.is_read
                        ? "none"
                        : "0 2px 8px rgba(59,130,246,0.08)",
                      background: notif.is_read ? "#f9fafb" : "#e0f2fe",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      textDecoration: "none",
                      transition: "box-shadow 0.2s, background 0.2s",
                    }}
                  >
                    <div
                      className="notification-icon"
                      style={{
                        fontSize: "28px",
                        width: "48px",
                        height: "48px",
                        background: notif.is_read ? "#f3f4f6" : "#bae6fd",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div
                      className="notification-content"
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <h4
                        style={{
                          margin: "0 0 6px 0",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#1f2937",
                        }}
                      >
                        {notif.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "#374151",
                          lineHeight: 1.6,
                        }}
                      >
                        {notif.message}
                      </p>
                      <span
                        className="notification-time"
                        style={{ fontSize: "11px", color: "#60a5fa" }}
                      >
                        {formatTimeAgo(notif.created_at)}
                      </span>
                    </div>
                    {!notif.is_read && !link && (
                      <div className="unread-dot" style={{ right: 10 }}></div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
