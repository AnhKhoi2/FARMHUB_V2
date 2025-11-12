import React, { useState, useEffect } from "react";
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
      setUnreadCount(response.data.data?.count || 0);
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
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`notification-item ${
                    notif.is_read ? "read" : "unread"
                  }`}
                  onClick={() => !notif.is_read && markAsRead(notif._id)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notification-time">
                      {formatTimeAgo(notif.created_at)}
                    </span>
                  </div>
                  {!notif.is_read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
