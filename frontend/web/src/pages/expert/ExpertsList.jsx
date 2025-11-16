"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Star, BadgeCheck, Search } from "lucide-react";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/ExpertsList.css";

// ⬇️ Chat widget
import ChatWidget from "./ChatWidget";
import Header from "../../components/shared/Header";

const API_LIST = "/api/experts?is_public=true&review_status=approved";

const placeholderAvatar = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed || "expert"
  )}`;

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
          onClick={() => canRate && onSelect?.(n)}
          aria-label={`Rate ${n}`}
          title={canRate ? `Đánh giá ${n} sao` : `${value} sao`}
          style={{
            background: "transparent",
            border: "none",
            cursor: canRate ? "pointer" : "default",
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
    (expert?.user?.avatar && String(expert.user.avatar).trim()) ||
    placeholderAvatar(
      expert?.user?.email ||
        expert?.user?._id ||
        expert?.expert_id ||
        expert?._id ||
        expert?.full_name
    );

  const canRate = !myScore;

  return (
    <div className="ex-card" role="article">
      <div className="ex-thumb">
        <img src={avatar} alt={expert.full_name} />
        {expert.review_status === "approved" && (
          <span className="ex-badge" title="Approved expert">
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
          <span className="ex-kpi">{expert.experience_years || 0} yrs</span>
        </div>
      </div>

      <div className="ex-actions">
        <button
          type="button"
          className="ex-btn"
          onClick={() => onChat?.(expert)}
          aria-label={`Chat with ${expert.full_name}`}
          title="Chat"
        >
          <MessageCircle size={18} />
          <span>Chat</span>
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

  // ⬇️ state cho ChatWidget
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPeer, setChatPeer] = useState(null); // payload truyền cho ChatWidget

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
        (code === 409 ? "Bạn đã đánh giá chuyên gia này rồi" : "Đánh giá thất bại");
      alert(msg);
    }
  };

  // ✅ mở chat với expert được chọn (truyền payload đúng chuẩn ChatWidget/BE)
  const handleChat = (expert) => {
    // expertId có thể là UUID (expert.expert_id) hoặc ObjectId (expert._id)
    const expertId = expert.expert_id || expert._id || null;

    if (!expertId) {
      alert("Không xác định được expertId để mở trò chuyện.");
      return;
    }

    // (tuỳ chọn) avatar để widget hiển thị tạm thời trước khi load conv xong
    const avatar =
      (expert?.user?.avatar && String(expert.user.avatar).trim()) ||
      placeholderAvatar(
        expert?.user?.email ||
          expert?.user?._id ||
          expert?.expert_id ||
          expert?._id ||
          expert?.full_name
      );

    // payload FE → ChatWidget.openWith: chỉ cần expertId
    const payload = {
      expertId,     // ⬅️ ChatWidget sẽ gửi { expertId } cho /api/chat/open (role=user)
      expert,       // ⬅️ đính kèm để ChatWidget có thể fallback lấy id khác nếu cần
      avatar,
      name: expert.full_name || "Expert",
    };

    // Quan trọng: set payload trước, rồi mở widget (tránh race)
    setChatPeer(payload);
    setChatOpen(true);
  };

  return (
    <>
    <Header/>
    <div className="ex-page user-expert-page">
      <div className="ex-hero">
        <h1>Experts</h1>
        <p>Find trusted agricultural experts and start a conversation.</p>
      </div>

      <div className="ex-toolbar">
        <div className="ex-search">
          <Search size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, expertise..."
            aria-label="Search experts"
          />
        </div>
      </div>

      {loading ? (
        <div className="ex-empty">Loading experts…</div>
      ) : filtered.length === 0 ? (
        <div className="ex-empty">No experts found.</div>
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

      {/* ChatWidget gắn ở cuối trang để overlay */}
      <ChatWidget
        open={chatOpen}
        onClose={(v) => setChatOpen(Boolean(v))} 
        initialOpenPayload={chatPeer} // ⬅️ đúng prop ChatWidget đang nhận
      />
    </div></>
  );
}
