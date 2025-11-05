import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "../css/ManagerGuides.css";
import placeholderImg from "../assets/placeholder.svg";

export default function ManagerGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const fetchGuides = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get("/guides", {
          params: { page: p, limit, search, category },
        });

  const data = res.data || {};
  // API shape: { success: true, data: [...], meta: { page, limit, total, pages } }
  const docs = data.docs || data.guides || data.data || [];
  const meta = data.meta || {};
  setGuides(docs);
  setTotalPages(meta.pages || meta.totalPages || meta.total_pages || 1);
      } catch (err) {
        console.warn("ManagerGuides fetch error", err);
        setError("Không thể tải guides từ server.");
        setGuides([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [page, limit, search, category]
  );

  useEffect(() => {
    fetchGuides(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category]);

  function onSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  function gotoPage(p) {
    setPage(p);
  }

  function onCreate() {
    navigate("/managerguides/create");
  }

  function onView(id) {
    navigate(`/guides/${id}`);
  }

  function onEdit(id) {
    navigate(`/managerguides/edit/${id}`);
  }

  function onDelete(id) {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hướng dẫn này?")) return;
    // TODO: call DELETE /guides/:id then refetch
    alert("Xóa (demo): " + id);
  }

  return (
    <div className="manager-guides-page">
      <header className="mg-header">
        <h2 className="mg-title">Danh sách hướng dẫn</h2>
        <button className="mg-create-btn" onClick={onCreate}>Tạo mới</button>
      </header>

      <div className="mg-grid-container">
        {loading ? (
          <div className="mg-loading">Đang tải...</div>
        ) : guides.length === 0 ? (
          <div className="mg-empty">Không có hướng dẫn nào.</div>
        ) : (
          <div className="mg-grid">
            {guides.map((g) => (
              <div className="mg-card" key={g._id || g.id}>
                <div
                  className="mg-thumb"
                  style={{ backgroundImage: `url(${g.image || g.thumbnail || placeholderImg})` }}
                />
                <div className="mg-card-body">
                  <div className="mg-card-title">{g.title || '(No title)'}</div>
                  <div className="mg-card-sub">{g.description || g.summary || g.excerpt || '—'}</div>
                </div>

                <div className="mg-card-actions">
                  <button className="mg-btn mg-btn-view" onClick={() => onView(g._id || g.id)}>Xem</button>
                  <button className="mg-btn mg-btn-edit" onClick={() => onEdit(g._id || g.id)}>Sửa</button>
                  <button className="mg-btn mg-btn-delete" onClick={() => onDelete(g._id || g.id)}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mg-pagination">
        <button className="mg-page-btn" disabled={page <= 1} onClick={() => gotoPage(Math.max(1, page - 1))}>&lt; Prev</button>
        <span className="mg-page-info">Trang {page} / {totalPages}</span>
        <button className="mg-page-btn" disabled={page >= totalPages} onClick={() => gotoPage(Math.min(totalPages, page + 1))}>Next &gt;</button>
      </div>
    </div>
  );
}
