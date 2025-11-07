import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/expert/ManagerGuides.css";
import placeholderImg from "../../assets/placeholder.svg";

export default function TrashGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  const [_error, setError] = useState(null);

  const fetchTrash = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get("/guides/trash", {
          params: { page: p, limit },
        });
        const data = res.data || {};
        const docs = data.data || data.docs || [];
        const meta = data.meta || {};
        setGuides(docs);
        setTotalPages(meta.pages || 1);
      } catch (e) {
        console.error(e);
        setError("Không thể tải thùng rác");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchTrash(page);
  }, [page, fetchTrash]);

  async function onRestore(id) {
    if (!window.confirm("Bạn có muốn khôi phục hướng dẫn này?")) return;
    try {
      setLoading(true);
      await axiosClient.post(`/guides/${id}/restore`);
      fetchTrash(page);
    } catch (e) {
      console.error(e);
      alert("Khôi phục thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function onPermanentDelete(id) {
    if (!window.confirm("Xóa vĩnh viễn? Hành động không thể quay lại.")) return;
    try {
      setLoading(true);
      await axiosClient.delete(`/guides/${id}/permanent`);
      // if no items left on page, go back a page
      const remaining = guides.length - 1;
      if (remaining <= 0 && page > 1) {
        setPage(page - 1);
        fetchTrash(page - 1);
      } else fetchTrash(page);
    } catch (e) {
      console.error(e);
      alert("Xóa vĩnh viễn thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="manager-guides-page">
      <header className="mg-header">
        <h2 className="mg-title">Thùng rác - Hướng dẫn đã xóa</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="mg-btn" onClick={() => navigate("/managerguides")}>
            Quay lại danh sách
          </button>
        </div>
      </header>

      <div className="mg-grid-container">
        {loading ? (
          <div className="mg-loading">Đang tải...</div>
        ) : guides.length === 0 ? (
          <div className="mg-empty">Không có hướng dẫn đã xóa.</div>
        ) : (
          <div className="mg-grid">
            {guides.map((g) => (
              <div className="mg-card" key={g._id || g.id}>
                <div
                  className="mg-thumb"
                  style={{
                    backgroundImage: `url(${g.image || placeholderImg})`,
                  }}
                />
                <div className="mg-card-body">
                  <div className="mg-card-title">{g.title}</div>
                  <div className="mg-card-sub">
                    {g.description || g.summary || "—"}
                  </div>
                </div>
                <div className="mg-card-actions">
                  <button
                    className="mg-btn"
                    onClick={() => onRestore(g._id || g.id)}
                  >
                    Khôi phục
                  </button>
                  <button
                    className="mg-btn mg-btn-delete"
                    onClick={() => onPermanentDelete(g._id || g.id)}
                  >
                    Xóa vĩnh viễn
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mg-pagination">
        <button
          className="mg-page-btn"
          disabled={page <= 1}
          onClick={() => setPage(Math.max(1, page - 1))}
        >
          &lt; Prev
        </button>
        <span className="mg-page-info">
          Trang {page} / {totalPages}
        </span>
        <button
          className="mg-page-btn"
          disabled={page >= totalPages}
          onClick={() => setPage(Math.min(totalPages, page + 1))}
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
}
