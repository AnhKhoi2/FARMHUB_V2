"use client";

import { useEffect, useRef, useState } from "react";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/expert/ChatWidget.css";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

/* =========================
  Helpers
========================= */
const isObjectId = (v) => typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);
const isUUID = (v) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );

function shortId(v) {
  const s = String(v || "");
  return s.length > 6 ? s.slice(-6) : s;
}

function pickExpertId(payload) {
  if (!payload) return null;
  const candidates = [
    payload.expertId,
    payload.expert?.expert_id,
    payload.expert?._id,
  ].filter(Boolean);
  const chosen = candidates.find((v) => isObjectId(v) || isUUID(v));
  return chosen || candidates[0] || null;
}

// ✅ Ưu tiên username > full_name > fallback
function derivePeer(conv, role) {
  const exUser = conv?.expert?.user || null;

  const expertName =
    conv?.expert?.full_name ||
    exUser?.full_name ||
    exUser?.username ||
    conv?.expert?.username ||
    conv?.expert_name ||
    `Chuyên gia-${shortId(conv?.expert?.expert_id || conv?.expert?._id)}`;

  const expertAvatar =
    exUser?.avatar || conv?.expert?.avatar || conv?.expert_avatar || null;

  const userName =
    conv?.user?.full_name ||
    conv?.user?.username ||
    conv?.user_name ||
    `Người dùng-${shortId(conv?.user?._id)}`;

  const userAvatar = conv?.user?.avatar || conv?.user_avatar || null;

  return role === "expert"
    ? { name: userName, avatar: userAvatar }
    : { name: expertName, avatar: expertAvatar };
}

function scrollToBottom() {
  const el = document.querySelector(".cw-room-msgs");
  if (el) el.scrollTop = el.scrollHeight;
}

export default function ChatWidget({ open, onClose, initialOpenPayload }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // nhớ timestamp tin nhắn mới nhất để poll "after"
  const lastTsRef = useRef(null);

  // thời điểm gần nhất user coi chat (dùng cho badge đỏ)
  const lastReadRef = useRef(0);

  // trạng thái có tin mới để hiện chấm đỏ trên icon
  const [hasNew, setHasNew] = useState(false);

  /* =========================
    Helpers cho "đã đọc"
  ========================= */
  function markAllSeen() {
    lastReadRef.current = Date.now();
    setHasNew(false);
  }

  /* =========================
    Lấy user hiện tại
  ========================= */
  useEffect(() => {
    try {
      const keys = ["user", "authUser", "profile"];
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const u = JSON.parse(raw);
        if (u && u._id) {
          setCurrentUser(u);
          break;
        }
      }
    } catch {
      // ignore
    }
  }, []);

  /* =========================
    Nạp danh sách hội thoại
    isPoll = true khi gọi từ background
  ========================= */
  async function loadConversations(isPoll = false) {
    try {
      const res = await axiosClient.get("/api/chat");
      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      const role = currentUser?.role;

      const mapped = list
        .map((c) => ({
          ...c,
          peer: derivePeer(c, role),
          lastMessage: c?.last_message || c?.lastMessage || {},
        }))
        .sort(
          (a, b) =>
            new Date(b?.updatedAt || 0).getTime() -
            new Date(a?.updatedAt || 0).getTime()
        );

      setConversations(mapped);

      // === TÍNH XEM CÓ TIN MỚI KHÔNG (cho icon chấm đỏ) ===
      // dùng lastReadRef: chỉ coi tin nhắn nào tạo SAU lần cuối đọc
      if (isPoll && currentUser?._id) {
        const lastRead = lastReadRef.current || 0;
        let flag = false;

        mapped.forEach((c) => {
          const lastAtRaw = c.lastMessage?.at || c.updatedAt;
          if (!lastAtRaw) return;

          const lastAt = new Date(lastAtRaw).getTime();
          const sender = c.lastMessage?.sender;
          const senderId =
            typeof sender === "object" && sender !== null ? sender._id : sender;

          if (
            lastAt &&
            lastAt > lastRead && // mới hơn lần đọc gần nhất
            String(senderId) !== String(currentUser._id) // không phải mình gửi
          ) {
            flag = true;
          }
        });

        setHasNew(flag);
      }

      // nếu load vì mở widget (isPoll = false) -> coi như đã đọc
      if (!isPoll) {
        markAllSeen();
      }
    } catch (err) {
      console.error("loadConversations failed:", err);
      setConversations([]);
      if (!isPoll) setHasNew(false);
    }
  }

  /* =========================
    Nạp tin nhắn (initial / khi click conv)
  ========================= */
  async function loadMessages(convId) {
    try {
      const res = await axiosClient.get(`/api/chat/${convId}/messages`);
      const data = res?.data?.data || [];
      const mapped = data.map((m) => ({
        ...m,
        isMine:
          String(m.sender?._id || m.sender) === String(currentUser?._id),
      }));
      setMsgs(mapped);
      setVisibleCount(5);

      if (mapped.length) {
        lastTsRef.current = mapped[mapped.length - 1].createdAt;
      } else {
        lastTsRef.current = null;
      }

      // vào phòng chat, coi như đã đọc → clear badge
      markAllSeen();

      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error("loadMessages failed:", err);
      setMsgs([]);
      lastTsRef.current = null;
    }
  }

  /* =========================
    Lấy tin mới (poll every 2.5s khi ĐANG mở 1 conv)
  ========================= */
  async function fetchNewMessages() {
    if (!activeConv || !lastTsRef.current) return;
    try {
      const res = await axiosClient.get(
        `/api/chat/${activeConv._id}/messages`,
        { params: { after: lastTsRef.current, limit: 50 } }
      );
      const incoming = Array.isArray(res?.data?.data) ? res.data.data : [];
      if (!incoming.length) return;

      const normalized = incoming.map((m) => ({
        ...m,
        isMine:
          String(m.sender?._id || m.sender) === String(currentUser?._id),
      }));

      setMsgs((prev) => {
        const existed = new Set(prev.map((x) => String(x._id)));
        const fresh = normalized.filter((x) => !existed.has(String(x._id)));
        if (!fresh.length) return prev;
        const next = [...prev, ...fresh];
        lastTsRef.current = fresh[fresh.length - 1].createdAt;
        return next;
      });

      // cập nhật lastMessage + updatedAt cho danh sách conv
      const lastIncoming = incoming[incoming.length - 1];
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeConv._id)
            ? {
                ...c,
                lastMessage: {
                  text: lastIncoming?.text || c.lastMessage?.text,
                  at: lastIncoming?.createdAt || c.updatedAt,
                  sender: lastIncoming?.sender || c.lastMessage?.sender,
                },
                updatedAt: lastIncoming?.createdAt || c.updatedAt,
              }
            : c
        )
      );

      setTimeout(scrollToBottom, 30);
    } catch {
      // im lặng
    }
  }

  // bật poll tin mới khi đang mở 1 conv
  useEffect(() => {
    if (!open || !currentUser || !activeConv) return;
    const t = setInterval(fetchNewMessages, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser?._id, activeConv?._id]);

  // 🔔 Poll nền để cập nhật hasNew ngay cả khi widget ĐANG ĐÓNG
  useEffect(() => {
    if (!currentUser) return;
    // gọi 1 lần ngay
    loadConversations(true);
    const t = setInterval(() => {
      loadConversations(true);
    }, 5000); // 5s 1 lần
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  /* =========================
    Mở cuộc trò chuyện
  ========================= */
  async function openWith(payload) {
    if (!payload) return;

    try {
      const userRaw =
        localStorage.getItem("user") ||
        localStorage.getItem("authUser") ||
        localStorage.getItem("profile");
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!user?._id) {
        alert("Không xác định được người dùng hiện tại.");
        return;
      }

      let body = null;

      if (user.role === "expert") {
        const uid =
          payload.userId || payload.user?._id || payload.userIdString || null;
        if (!uid || !isObjectId(uid)) {
          alert("Thiếu hoặc sai userId (cần ObjectId) khi expert mở chat.");
          return;
        }
        body = { userId: uid };
      } else {
        const exid = pickExpertId(payload);
        if (!exid) {
          alert("Không tìm thấy expertId hợp lệ để mở chat.");
          return;
        }
        body = { expertId: exid };
      }

      const res = await axiosClient.post("/api/chat/open", body);
      const conv = res?.data?.data;
      if (!conv) return;

      const normalized = {
        ...conv,
        peer: derivePeer(conv, user.role),
        lastMessage: conv?.last_message || conv?.lastMessage || {},
      };

      setActiveConv(normalized);
      setConversations((prev) => {
        const exists = prev.some(
          (c) => String(c._id) === String(normalized._id)
        );
        return exists ? prev : [normalized, ...prev];
      });
      await loadMessages(normalized._id);
    } catch (err) {
      console.error("open chat failed:", err);
      alert("Không mở được cuộc trò chuyện. Vui lòng thử lại.");
    }
  }

  /* =========================
    Gửi tin nhắn
  ========================= */
  async function sendMessage() {
    const safe = text.trim();
    if (!safe || !activeConv) return;
    setLoading(true);
    try {
      const res = await axiosClient.post(
        `/api/chat/${activeConv._id}/messages`,
        { text: safe }
      );
      const msg = res?.data?.data;
      if (msg) {
        setMsgs((m) => [
          ...m,
          {
            ...msg,
            isMine: String(msg.sender?._id) === String(currentUser?._id),
          },
        ]);
        lastTsRef.current = msg.createdAt;
      }
      setText("");

      // mình vừa gửi -> rõ ràng đang xem -> clear badge
      markAllSeen();

      setTimeout(scrollToBottom, 40);
    } catch (err) {
      console.error("sendMessage failed:", err);
      alert("Gửi tin nhắn thất bại.");
    } finally {
      setLoading(false);
    }
  }

  // Khi widget mở: load conv + open payload + coi như đã đọc (clear badge)
  useEffect(() => {
    if (!open || !currentUser) return;
    markAllSeen(); // đánh dấu lần mở widget là đã "xem"
    loadConversations(false);
    if (initialOpenPayload) openWith(initialOpenPayload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentUser?._id, currentUser?.role, initialOpenPayload]);

  /* =========================
    UI
  ========================= */

  // Khi widget ĐANG ĐÓNG
  if (!open) {
    // 👉 Nếu là CHUYÊN GIA: không hiển thị nút tròn Chat with expert
    if (currentUser && currentUser.role === "expert") {
      return <div className="chat-widget" />;
    }

    // 👉 Nếu là USER thường: hiển thị nút tròn + chấm đỏ nếu có tin mới
    return (
      <div className="chat-widget">
        <button className="cw-fab" onClick={() => onClose?.(true)}>
          {hasNew && <span className="cw-fab-badge" />}
          <MessageCircle size={22} />
        </button>
      </div>
    );
  }

  // Khi widget ĐANG MỞ -> panel chat hiển thị cho cả user & expert
  return (
    <div className={`chat-widget ${open ? "open" : ""}`}>
      <div className="cw-panel">
        <div className="cw-header">
          <div className="cw-title">
            <MessageCircle size={18} /> TRÒ CHUYỆN
          </div>
          <div className="cw-actions">
            <button className="cw-icon" onClick={() => onClose?.(false)}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cw-body">
          {/* Danh sách hội thoại */}
          <div className="cw-left">
            <div className="cw-left-head">CUỘC TRÒ CHUYỆN</div>
            <div className="cw-left-list">
              {conversations.length === 0 ? (
                <div className="cw-empty">Chưa Có Cuộc Trò Chuyện</div>
              ) : (
                conversations.map((c) => (
                  <div
                    key={c._id}
                    className={`cw-conv ${
                      activeConv && activeConv._id === c._id ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveConv(c);
                      loadMessages(c._id);
                    }}
                  >
<div
  className="cw-conv-avatar"
  style={{
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    overflow: "hidden",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eee",
  }}
>
  {c.peer?.avatar ? (
    <img
      src={c.peer.avatar}
      alt={c.peer.name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  ) : (
    <span style={{ fontSize: "22px", opacity: 0.7 }}>👤</span>
  )}
</div>


                    <div className="cw-conv-main">
                      <div className="cw-conv-title">
                        {c.peer?.name || "Người dùng"}
                      </div>
                      <div className="cw-conv-preview">
                        {c.lastMessage?.text || ""}
                      </div>
                    </div>
                    <div className="cw-conv-time">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleTimeString()
                        : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Nội dung hội thoại */}
          <div className="cw-right">
            {!activeConv ? (
              <div className="cw-empty big">Chọn 1 Cuộc Trò Chuyện</div>
            ) : (
              <>
                <div className="cw-room-head">
                  <div className="cw-room-title">
                    {activeConv.peer?.name || "Người dùng"}
                  </div>
                  <div className="cw-room-sub">Đang Hoạt Động</div>
                </div>

                <div
                  className="cw-room-msgs"
                  onScroll={(e) => {
                    const top = e.target.scrollTop;
                    if (top === 0 && visibleCount < msgs.length) {
                      setVisibleCount((prev) =>
                        Math.min(prev + 5, msgs.length)
                      );
                    }
                  }}
                >
                  {msgs.length === 0 ? (
                    <div className="cw-empty">Chưa Có Tin Nhắn</div>
                  ) : (
                    msgs.slice(-visibleCount).map((m) => (
                      <div
                        key={m._id}
                        className={`cw-msg ${m.isMine ? "right" : "left"}`}
                      >
                        <div className="cw-msg-bubble">
                          <div className="cw-msg-sender">
                            {m.isMine ? "Bạn" : activeConv.peer?.name}
                          </div>
                          <div className="cw-msg-text">{m.text}</div>
                          <div className="cw-msg-time">
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="cw-room-input">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); // không xuống dòng
                        sendMessage();
                      }
                    }}
                    placeholder="Nhập Tin Nhắn Của Bạn..."
                  />

                  <button
                    className="cw-send"
                    onClick={sendMessage}
                    disabled={loading || !text.trim()}
                  >
                    {loading ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
