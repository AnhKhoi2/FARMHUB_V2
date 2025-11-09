"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Star, BadgeCheck, Search } from "lucide-react";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/ExpertsList.css";

const API_LIST = "/api/experts?is_public=true&review_status=approved";

const placeholderAvatar = (seed) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    seed || "expert"
  )}`;

function ExpertCard({ expert, onChat }) {
  const avatar = placeholderAvatar(expert.expert_id || expert._id || expert.full_name);

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
        <h3 className="ex-name" title={expert.full_name}>{expert.full_name}</h3>
        <div className="ex-meta" title={expert.expertise_area}>
          {expert.expertise_area}
        </div>
        <div className="ex-kpis">
          <span className="ex-kpi">
            <Star size={16} />
            <b>{Number(expert.avg_score || 0).toFixed(1)}</b>
            <span className="ex-sub">({expert.total_reviews || 0})</span>
          </span>
          <span className="ex-dot">•</span>
          <span className="ex-kpi">{expert.experience_years || 0} yrs</span>
        </div>
      </div>

      <div className="ex-actions">
        <button
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
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function fetchExperts() {
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
    }

    fetchExperts();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleChat = (expert) => {
    // 👉 Hook to your chat page/box. Adjust param names as your chat expects:
    // Example navigate to chat screen with receiver userId (from populated "user"):
    const receiverId =
      (expert.user && (expert.user._id || expert.user)) ||
      expert.userId || // fallback if schema differs
      "";
    if (!receiverId) {
      alert("No receiver id found for this expert.");
      return;
    }
    navigate(`/chat?to=${receiverId}&name=${encodeURIComponent(expert.full_name)}`);
  };

  return (
    <div className="ex-page">
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
          {filtered.map((ex) => (
            <ExpertCard key={ex.expert_id || ex._id} expert={ex} onChat={handleChat} />
          ))}
        </div>
      )}
    </div>
  );
}
