import React, { useEffect, useState } from "react";
import notebookApi from "../api/farmer/notebookApi";
import "./NotebookStats.css";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
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

  if (loading || !stats) {
    return (
      <div className="stats-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thống kê...</p>
      </div>
    );
  }

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
    <div className="notebook-stats-container">
      {/* Main Stats Grid */}
      <div className="stats-grid">
        {/* Progress Chart Card */}
        <div className="stat-card chart-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon">📊</span>
              Tiến Độ Trung Bình
            </h3>
          </div>
          <div className="chart-container">
            <div className="donut-chart" style={{ background: conic }}>
              <div className="donut-inner">
                <div className="progress-value">{stats.progressAvg || 0}%</div>
                <div className="progress-label">Hoàn thành</div>
              </div>
            </div>
          </div>
        </div>

        {/* Plant Types Card */}
        <div className="stat-card types-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon">🌱</span>
              Thống Kê Theo Loại Cây
            </h3>
          </div>
          <div className="types-list">
            {segments.map((s) => (
              <div key={s.name} className="type-item">
                <div className="type-color" style={{ background: s.color }} />
                <div className="type-info">
                  <div className="type-name">{s.name}</div>
                  <div className="type-stats">
                    {s.count} sổ tay • {s.pct}%
                  </div>
                </div>
                <div className="type-badge">{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="stats-grid-2">
        {/* Plant Groups Card */}
        <div className="stat-card groups-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon">🌿</span>
              Phân Nhóm Cây Trồng
            </h3>
          </div>
          <div className="groups-grid">
            {Object.entries(stats.byGroup || {}).map(([g, c]) => (
              <div key={g} className="group-item">
                <div className="group-count">{c}</div>
                <div className="group-name">{g}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Distribution Card */}
        <div className="stat-card distribution-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="icon">📈</span>
              Phân Phối Tiến Độ
            </h3>
          </div>
          <div className="distribution-bars">
            {Object.entries(stats.progressDistribution || {}).map(
              ([range, c]) => {
                const pct = Math.round((c / (total || 1)) * 100);
                return (
                  <div key={range} className="distribution-item">
                    <div className="distribution-label">{range}%</div>
                    <div className="distribution-bar-container">
                      <div
                        className="distribution-bar"
                        style={{ width: `${pct}%` }}
                      >
                        <span className="bar-value">{c}</span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Cards */}
      <div className="info-cards">
        <div className="info-card">
          <div className="info-icon">⏱️</div>
          <div className="info-content">
            <div className="info-label">Thời gian trồng trung bình</div>
            <div className="info-value">
              {stats.avgGrowDays
                ? `${stats.avgGrowDays} ngày`
                : "Chưa có dữ liệu"}
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🏆</div>
          <div className="info-content">
            <div className="info-label">Loại cây phổ biến nhất</div>
            <div className="info-value">
              {stats.mostPopularType || "Không xác định"}
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">📚</div>
          <div className="info-content">
            <div className="info-label">Tổng số sổ tay</div>
            <div className="info-value">{total}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotebookStats;
