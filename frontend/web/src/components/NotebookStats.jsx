import React, { useEffect, useState } from "react";
import notebookApi from "../api/farmer/notebookApi";

const COLORS = [
  "#60a5fa",
  "#34d399",
  "#f97316",
  "#f472b6",
  "#f87171",
  "#a78bfa",
];

const NotebookStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await notebookApi.getNotebookStats();
      setStats(res.data.data);
    } catch (err) {
      console.error("Error fetching notebook stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div>Đang tải thống kê...</div>;

  const types = Object.entries(stats.byType || {});
  const total = types.reduce((s, [, c]) => s + c, 0) || 1;

  const segments = types.map(([name, count], i) => {
    const pct = Math.round((count / total) * 100);
    return { name, count, pct, color: COLORS[i % COLORS.length] };
  });

  let cumulative = 0;
  const stops = segments.map((s) => {
    const from = cumulative;
    cumulative += s.pct;
    const to = cumulative;
    return `${s.color} ${from}% ${to}%`;
  });
  const conic = stops.length ? `conic-gradient(${stops.join(", ")})` : "#eee";

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      <div style={{ width: 220, height: 220, position: "relative" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: conic,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {stats.progressAvg || 0}%
            </div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              TIẾN ĐỘ TRUNG BÌNH
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h3>THỐNG KÊ THEO LOẠI CÂY</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map((s) => (
            <div
              key={s.name}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: s.color,
                  borderRadius: 3,
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {s.count} notebooks • {s.pct}%
                </div>
              </div>
            </div>
          ))}
        </div>

        <hr style={{ margin: "16px 0" }} />

        <h4>PHÂN NHÓM</h4>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {Object.entries(stats.byGroup || {}).map(([g, c]) => (
            <div
              key={g}
              style={{
                background: "#fff",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #eef2ff",
              }}
            >
              <div style={{ fontWeight: 700 }}>{c}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{g}</div>
            </div>
          ))}
        </div>

        <hr style={{ margin: "16px 0" }} />

        <h4>PHÂN PHỐI TIẾN ĐỘ</h4>
        <div style={{ display: "flex", gap: 12 }}>
          {Object.entries(stats.progressDistribution || {}).map(
            ([range, c], i) => {
              const pct = Math.round((c / (total || 1)) * 100);
              return (
                <div key={range} style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{range}</div>
                  <div
                    style={{
                      height: 10,
                      background: "#f3f4f6",
                      borderRadius: 6,
                      marginTop: 6,
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "#60a5fa",
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#374151", marginTop: 6 }}>
                    {c} notebooks
                  </div>
                </div>
              );
            }
          )}
        </div>

        <hr style={{ margin: "16px 0" }} />

        <h4>THỜI GIAN TRỒNG TRUNG BÌNH</h4>
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          {stats.avgGrowDays ? `${stats.avgGrowDays} ngày` : "Chưa có dữ liệu"}
        </div>

        <hr style={{ margin: "16px 0" }} />

        <div>
          <strong>LOẠI CÂY PHỔ BIẾN NHẤT:</strong>{" "}
          {stats.mostPopularType || "Không xác định"}
        </div>
      </div>
    </div>
  );
};

export default NotebookStats;
