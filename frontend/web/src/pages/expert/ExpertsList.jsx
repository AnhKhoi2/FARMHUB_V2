"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { MessageCircle, Star, BadgeCheck, Search } from "lucide-react";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/ExpertsList.css";
import Footer from "../../components/shared/Footer";
// ⬇️ Chat widget
import ChatWidget from "./ChatWidget";
import Header from "../../components/shared/Header";

const API_LIST = "/api/experts?is_public=true&review_status=approved";

const placeholderAvatar = () => "";

// ---------- Star UI ----------
function StarRow({ value = 0, onSelect, canRate }) {
  const [hover, setHover] = useState(0);

  const v = hover || value;
  return (
    <div className="ex-stars" style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="ex-star-btn"
          onMouseEnter={() => canRate && setHover(n)}
          onMouseLeave={() => canRate && setHover(0)}
          onClick={() => onSelect?.(n)}
          aria-label={`Đánh giá ${n} sao`}
          title={
            canRate
              ? `Đánh giá ${n} sao`
              : `${value || 0} sao (bạn đã đánh giá rồi)`
          }
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            lineHeight: 0,
          }}
        >
          <Star
            size={18}
            fill={v >= n ? "#FFC107" : "none"}
            stroke={v >= n ? "#FFC107" : "currentColor"}
          />
        </button>
      ))}
    </div>
  );
}

function ExpertCard({ expert, myScore, onRate, onChat }) {
  const avatar =
  (expert?.user?.avatar && String(expert.user.avatar).trim()) || "";


  const canRate = !myScore;

  return (
    <div className="ex-card" role="article">
      <div className="ex-thumb">
        <img src={avatar} alt={expert.full_name} />
        {expert.review_status === "approved" && (
          <span className="ex-badge" title="Chuyên gia đã được duyệt">
            <BadgeCheck size={18} />
          </span>
        )}
      </div>

      <div className="ex-body">
        <h3 className="ex-name" title={expert.full_name}>
          {expert.full_name}
        </h3>

        <div className="ex-meta" title={expert.expertise_area}>
          {expert.expertise_area}
        </div>

        <div className="ex-kpis" style={{ alignItems: "center", gap: 8 }}>
          <StarRow
            value={Number(myScore || 0)}
            onSelect={(score) => onRate?.(expert, score)}
            canRate={canRate}
          />
          <span className="ex-dot">•</span>
          <span className="ex-kpi">
            <b>{Number(expert.avg_score || 0).toFixed(1)}</b>
            <span className="ex-sub"> ({expert.total_reviews || 0})</span>
          </span>
          <span className="ex-dot">•</span>
          <span className="ex-kpi">{expert.experience_years || 0} năm</span>
        </div>
      </div>

      <div className="ex-actions">
        <button
          type="button"
          className="ex-btn"
          onClick={() => onChat?.(expert)}
          aria-label={`Trò chuyện với ${expert.full_name}`}
          title="Trò chuyện"
        >
          <MessageCircle size={18} />
          <span>Trò chuyện</span>
        </button>
      </div>
    </div>
  );
}

export default function ExpertsList() {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [myRatings, setMyRatings] = useState({});

  // ChatWidget control
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState(null);

  // === ONLY ADD SOUND HERE (không thay đổi gì khác) ===
  const [unreadCount, setUnreadCount] = useState(0);
  const prevUnreadRef = useRef(0);

  // fetch experts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(API_LIST);
        const items = res?.data?.data || [];
        if (!cancelled) setExperts(Array.isArray(items) ? items : []);
      } catch (e) {
        if (!cancelled) setExperts([]);
        console.error("Fetch experts failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ======================= SOUND NOTIFICATION =======================
  useEffect(() => {
    const notifySound = new Audio("/src/assets/sounds/notify.mp3");
  
    const fetchUnread = async () => {
      try {
        const res = await axiosClient.get("/api/chat/unread");
  
        const count =
          res?.data?.count ??
          (Array.isArray(res?.data?.data) ? res.data.data.length : 0);
  
        if (count > prevUnreadRef.current) {
          notifySound.play().catch(() => {});
        }
  
        prevUnreadRef.current = count;
        setUnreadCount(count || 0);
  
      } catch (err) {
        console.error("Lỗi unread:", err);
      }
    };
  
    fetchUnread();
  
    const interval = setInterval(fetchUnread, 1000); // 1 giây 1 lần (tốt nhất)
    return () => clearInterval(interval);
  }, []);
  
  // ======================= END SOUND =======================

  // fetch my ratings
  useEffect(() => {
    let cancelled = false;
    async function fetchMine() {
      try {
        const ids = (experts || [])
          .map((ex) => ex.expert_id || ex._id)
          .filter(Boolean);
        const tasks = ids.map((id) =>
          axiosClient
            .get(`/api/experts/${id}/rate/me`)
            .then((r) => ({ id, score: r?.data?.data?.score || 0 }))
            .catch(() => ({ id, score: 0 }))
        );
        const results = await Promise.allSettled(tasks);
        if (cancelled) return;
        const dict = {};
        results.forEach((it) => {
          if (it.status === "fulfilled") dict[it.value.id] = it.value.score || 0;
        });
        setMyRatings(dict);
      } catch (_) {}
    }
    if (experts.length) fetchMine();
    else setMyRatings({});
    return () => {
      cancelled = true;
    };
  }, [experts]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return experts;
    return experts.filter((it) => {
      const name = (it.full_name || "").toLowerCase();
      const area = (it.expertise_area || "").toLowerCase();
      const desc = (it.description || "").toLowerCase();
      return name.includes(key) || area.includes(key) || desc.includes(key);
    });
  }, [q, experts]);

  // rate
  const handleRate = async (expert, score) => {
    const id = expert.expert_id || expert._id;
    if (!id) return;

    if (myRatings[id]) {
      alert("Bạn đã đánh giá chuyên gia này rồi.");
      return;
    }

    try {
      const resCheck = await axiosClient.get(`/api/chat/has-talked/${id}`);
      const payload = resCheck?.data;
      const hasTalk =
        payload?.hasTalked ??
        payload?.hasChat ??
        payload?.data?.hasTalked ??
        payload?.data?.hasChat ??
        false;
      if (!hasTalk) {
        alert("Bạn chỉ có thể đánh giá chuyên gia sau khi đã trò chuyện với họ.");
        return;
      }
    } catch (err) {
      console.error("check has-talked error:", err);
      alert("Không kiểm tra được lịch sử trò chuyện.");
      return;
    }

    try {
      const res = await axiosClient.post(`/api/experts/${id}/rate`, { score });
      const stats = res?.data?.data;
      setMyRatings((m) => ({ ...m, [id]: score }));
      if (stats) {
        setExperts((list) =>
          list.map((ex) =>
            (ex.expert_id || ex._id) === id
              ? {
                  ...ex,
                  avg_score: stats.avg_score ?? ex.avg_score,
                  total_reviews: stats.total_reviews ?? ex.total_reviews,
                }
              : ex
          )
        );
      }
    } catch (e) {
      const code = e?.response?.status;
      const msg =
        e?.response?.data?.error ||
        (code === 409
          ? "Bạn đã đánh giá chuyên gia này rồi"
          : "Đánh giá thất bại");
      alert(msg);
    }
  };

  // open chat
  const handleChat = (expert) => {
    const expertId = expert.expert_id || expert._id || null;

    if (!expertId) {
      alert("Không xác định được chuyên gia để mở trò chuyện.");
      return;
    }

    const avatar =
    (expert?.user?.avatar && String(expert.user.avatar).trim()) || "";

    const payload = {
      expertId,
      expert,
      avatar,
      name: expert.full_name || "Chuyên gia",
    };

    setChatPeer(payload);
    setChatOpen(true);
  };

  return (
    <>
      <Header />
      <div className="ex-page user-expert-page">
        <div className="ex-hero">
          <h1>Chuyên Gia</h1>
          <p>
            Tìm kiếm và kết nối với các chuyên gia nông nghiệp đáng tin cậy để được tư vấn.
          </p>
        </div>

        <div className="ex-toolbar">
          <div className="ex-search">
            <Search size={18} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên, lĩnh vực chuyên môn..."
              aria-label="Tìm kiếm chuyên gia"
            />
          </div>
        </div>

        {loading ? (
          <div className="ex-empty">Đang tải danh sách chuyên gia…</div>
        ) : filtered.length === 0 ? (
          <div className="ex-empty">Không tìm thấy chuyên gia phù hợp.</div>
        ) : (
          <div className="ex-grid">
            {filtered.map((ex) => {
              const id = ex.expert_id || ex._id;
              return (
                <ExpertCard
                  key={id}
                  expert={ex}
                  myScore={myRatings[id] || 0}
                  onRate={handleRate}
                  onChat={handleChat}
                />
              );
            })}
          </div>
        )}

        <ChatWidget
          open={chatOpen}
          onClose={(v) => setChatOpen(Boolean(v))}
          initialOpenPayload={chatPeer}
        />
      </div>
      <Footer /> 
    </>
  );
}
