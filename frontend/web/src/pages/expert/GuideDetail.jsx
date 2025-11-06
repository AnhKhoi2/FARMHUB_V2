import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/expert/ManagerGuides.css";
import placeholderImg from "../../assets/placeholder.svg";

export default function GuideDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchGuide = async () => {
      try {
        const res = await axiosClient.get(`/guides/${id}`);
        if (!mounted) return;
        setGuide(res.data.data || res.data || null);
      } catch (err) {
        console.warn(err);
        setError("Không thể tải chi tiết hướng dẫn.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchGuide();
    return () => (mounted = false);
  }, [id]);

  if (loading) return <div className="mg-loading">Đang tải...</div>;
  if (error) return <div className="mg-error">{error}</div>;
  if (!guide) return <div className="mg-empty">Không tìm thấy hướng dẫn.</div>;

  return (
    <div className="manager-guides-page">
      <div className="guide-detail-wrapper">
        <button
          onClick={() => navigate(-1)}
          className="mg-btn back-btn small"
          style={{ marginBottom: 12 }}
        >
          Quay lại
        </button>

        <div className="guide-card-detail">
          <div className="guide-body">
            <div className="guide-head">
              <div>
                <h1 className="guide-title">{guide.title}</h1>
                <div className="guide-meta">
                  Tác giả:{" "}
                  <strong>{guide.expert_id?.username || "Unknown"}</strong> •{" "}
                  {new Date(guide.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="guide-actions">
                <button
                  className="mg-btn"
                  onClick={() => navigate(`/managerguides/edit/${guide._id}`)}
                >
                  Chỉnh sửa
                </button>
                <button
                  className="mg-btn"
                  style={{ marginLeft: 8 }}
                  onClick={() => navigate("/managerguides")}
                >
                  Danh sách
                </button>
              </div>
            </div>

            {guide.plantTags && guide.plantTags.length > 0 && (
              <div className="plant-tags">
                {guide.plantTags.map((t) => (
                  <span key={t} className="plant-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}

            <div className="guide-summary">
              {guide.content || guide.summary ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: guide.content || guide.summary,
                  }}
                />
              ) : (
                <p className="muted">
                  Không có nội dung chính — xem các bước bên dưới.
                </p>
              )}
            </div>

            {guide.steps && guide.steps.length > 0 && (
              <div className="guide-steps">
                <h3>Các bước thực hiện</h3>
                <div className="steps-grid">
                  {guide.steps.map((s, idx) => (
                    <article key={idx} className="step-card">
                      <div className="step-index">{idx + 1}</div>
                      <div
                        className="step-thumb"
                        style={{
                          backgroundImage: `url(${s.image || placeholderImg})`,
                        }}
                      />
                      <div className="step-content">
                        <div className="step-title">
                          {s.title || `Bước ${idx + 1}`}
                        </div>
                        <div
                          className="step-text"
                          dangerouslySetInnerHTML={{ __html: s.text || "" }}
                        />
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
