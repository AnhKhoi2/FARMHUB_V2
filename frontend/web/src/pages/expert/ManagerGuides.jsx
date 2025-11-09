import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/expert/ManagerGuides.css";
import placeholderImg from "../../assets/placeholder.svg";

export default function ManagerGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const [search, _setSearch] = useState("");
  // search by plant name
  const [plantSearch, setPlantSearch] = useState("");
  // filter by plant type
  const [category, setCategory] = useState("");

  const availablePlantTags = [
    "Rau củ dễ chăm",
    "Trái cây ngắn hạn",
    "Cây gia vị",
    "Trồng trong chung cư",
    "Ít thời gian chăm sóc",
    "Cây leo nhỏ",
  ];

  const fetchGuides = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      try {
        const params = { page: p, limit };
        if (search) params.search = search;
        if (plantSearch) params.plant = plantSearch;
        if (category) params.category = category;
        console.debug("[ManagerGuides] fetch params:", params);
        const res = await axiosClient.get("/guides", { params });

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
    [page, limit, search, category, plantSearch]
  );

  useEffect(() => {
    fetchGuides(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, category, plantSearch]);

  // if user clears plantSearch or category, fetch all guides immediately
  useEffect(() => {
    if (
      (plantSearch === "" || plantSearch === null) &&
      (category === "" || category === null)
    ) {
      // ensure we fetch page 1 when filters cleared
      fetchGuides(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantSearch, category]);

  function _onSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
  }

  function onPlantSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    // ensure immediate fetch even if page already equals 1
    try {
      fetchGuides(1);
    } catch (e) {
      void e;
    }
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
    (async () => {
      try {
        setLoading(true);
        await axiosClient.delete(`/guides/${id}`);
        // refetch current page
        // if after deletion current page might be empty and page > 1, go to previous page
        const remaining = guides.length - 1;
        if (remaining <= 0 && page > 1) {
          setPage(page - 1);
          fetchGuides(page - 1);
        } else {
          fetchGuides(page);
        }
      } catch (err) {
        console.error("Delete guide failed", err);
        alert("Xóa không thành công. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  }

  return (
    <div className="manager-guides-page">
      <header className="mg-header">
        <h2 className="mg-title">Danh sách hướng dẫn</h2>
        <div className="mg-toolbar">
          <form onSubmit={onPlantSearchSubmit} className="mg-search-box">
            <input
              className="mg-input mg-search-input"
              placeholder="Tìm theo tên cây hoặc tiêu đề"
              value={plantSearch}
              onChange={(e) => setPlantSearch(e.target.value)}
            />
            <button className="mg-search-btn" type="submit">
              Tìm
            </button>
          </form>

          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="mg-select"
            >
              <option value="">-- Lọc theo loại cây --</option>
              {availablePlantTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              className="mg-clear-btn"
              onClick={() => {
                setPlantSearch("");
                setCategory("");
                setPage(1);
                fetchGuides(1);
              }}
            >
              Xóa bộ lọc
            </button>
            <button
              className="mg-clear-btn"
              onClick={() => navigate("/managerguides/trash")}
            >
              Thùng rác
            </button>
            <button className="mg-create-btn" onClick={onCreate}>
              Tạo mới
            </button>
          </div>
        </div>
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
                  style={{
                    backgroundImage: `url(${
                      g.image || g.thumbnail || placeholderImg
                    })`,
                  }}
                />
                <div className="mg-card-body">
                  <div className="mg-card-title">{g.title || "(No title)"}</div>
                  <div className="mg-card-sub">
                    {g.description || g.summary || g.excerpt || "—"}
                  </div>
                </div>

                <div className="mg-card-actions">
                  <button
                    className="mg-btn mg-btn-view"
                    onClick={() => onView(g._id || g.id)}
                  >
                    Xem
                  </button>
                  <button
                    className="mg-btn mg-btn-edit"
                    onClick={() => onEdit(g._id || g.id)}
                  >
                    Sửa
                  </button>
                  <button
                    className="mg-btn mg-btn-delete"
                    onClick={() => onDelete(g._id || g.id)}
                  >
                    Xóa
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
          onClick={() => gotoPage(Math.max(1, page - 1))}
        >
          &lt; Trước
        </button>
        <span className="mg-page-info">
          Trang {page} / {totalPages}
        </span>
        <button
          className="mg-page-btn"
          disabled={page >= totalPages}
          onClick={() => gotoPage(Math.min(totalPages, page + 1))}
        >
          Tiếp &gt;
        </button>
      </div>
    </div>
  );
}
