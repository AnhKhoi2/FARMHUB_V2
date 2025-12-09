import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/NotificationBell.css";
import toast from "react-hot-toast";

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

  // Listen to storage events so other tabs know when auto-open has been used
  useEffect(() => {
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === AUTO_SHOWN_KEY && e.newValue) {
        autoShownRef.current = true;
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Keep track of seen notification ids so we can detect new ones
  const seenNotifIds = useRef(new Set());

  // Track whether we've already auto-opened/played notification sound across tabs
  // We persist this in localStorage so other tabs won't repeat the auto-open behavior.
  const AUTO_SHOWN_KEY = "fh_notifications_auto_shown";
  const autoShownRef = useRef(
    Boolean(localStorage.getItem(AUTO_SHOWN_KEY)) || false
  );

  // Background poll: fetch full notifications silently and auto-open dropdown
  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const resp = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000"
          }/api/notifications`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const notifs = resp.data?.data || [];
        if (!mounted) return;

        // find new unread notifications that we haven't seen
        const newUnreads = notifs.filter(
          (n) => !n.is_read && !seenNotifIds.current.has(n._id)
        );

        // update seen set for current notifications
        notifs.forEach((n) => seenNotifIds.current.add(n._id));

        if (newUnreads.length > 0) {
          // update local state and unread count always
          setNotifications(notifs);
          setUnreadCount(resp.data?.meta?.unread_count || 0);

          // Auto-open / play sound only once per browser (across tabs).
          // Use localStorage flag to ensure other tabs don't repeat the behavior.
          const alreadyAutoShown =
            autoShownRef.current ||
            Boolean(localStorage.getItem(AUTO_SHOWN_KEY));

          if (!alreadyAutoShown) {
            // show toast and open dropdown so user sees it the first time
            toast.success(`Bạn có ${newUnreads.length} thông báo mới`);
            setIsOpen(true);
            try {
              const audio = new Audio("/src/assets/sounds/notify.mp3");
              audio.play().catch(() => {});
            } catch (e) {}

            // mark as shown across tabs
            try {
              localStorage.setItem(AUTO_SHOWN_KEY, new Date().toISOString());
              autoShownRef.current = true;
            } catch (e) {}
          } else {
            // If already auto-shown, still show a small toast but don't open or play sound.
            toast(`Bạn có ${newUnreads.length} thông báo mới`);
          }
        }
      } catch (e) {
        // silent
      }
    };

    // initial silent fetch to populate seen set
    poll();
    const id = setInterval(poll, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
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
              <div style={{ display: "flex", gap: 8 }}>
                <button className="mark-all-read-btn" onClick={markAllAsRead}>
                  Đánh dấu tất cả đã đọc
                </button>
                <button
                  className="clear-all-btn"
                  onClick={async () => {
                    if (!confirm("Bạn có chắc muốn xóa tất cả thông báo?"))
                      return;
                    const token = getToken();
                    if (!token) return;
                    try {
                      await axios.delete(
                        `${
                          import.meta.env.VITE_API_URL ||
                          "http://localhost:5000"
                        }/api/notifications/clear`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      // Update UI
                      setNotifications([]);
                      setUnreadCount(0);
                      toast.success("Đã xóa tất cả thông báo");
                    } catch (err) {
                      console.error("Error clearing notifications:", err);
                      toast.error("Không thể xóa thông báo");
                    }
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
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
                  // Navigate to overdue tab for overdue and reminder types
                  if (
                    notif.type === "stage_overdue" ||
                    notif.type === "daily_reminder" ||
                    notif.type === "stage_reminder"
                  ) {
                    link = `/farmer/notebooks/${nid}?tab=overdue`;
                  } else if (notif.type === "observation_required") {
                    // Open notebook and switch to Observations tab
                    link = `/farmer/notebooks/${nid}?tab=observations`;
                  } else {
                    // For warnings, skipped, completed -> open notebook detail
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
                        {formatTimeAgo(notif.createdAt || notif.created_at)}
                      </span>
                    </div>
                    {!notif.is_read && (
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
