import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../components/AdminLayout.jsx"; // Layout wrapper
import usersApi from "../../api/usersApi.js";

const ROLE_OPTIONS = ["user", "expert", "moderator", "admin"];

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // detail modal data
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list({ q: q || undefined, role: roleFilter || undefined, page, limit, includeDeleted });
      if (data?.items) {
        setItems(data.items);
        setTotal(data.total || 0);
      }
    } catch (e) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, page, limit, includeDeleted]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const data = await usersApi.detail(id);
      setSelected(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const changeRole = async (id, role) => {
    const prev = [...items];
    setItems(items.map(u => u._id === id ? { ...u, role } : u));
    try {
      await usersApi.updateRole(id, role);
      fetchData();
    } catch (e) {
      setItems(prev);
      alert(e.response?.data?.message || e.message || "Đổi role thất bại");
    }
  };

  const softDelete = async (id) => {
    if (!window.confirm("Xác nhận xoá mềm người dùng này?")) return;
    try {
      await usersApi.softDelete(id);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Xoá thất bại");
    }
  };

  const restore = async (id) => {
    try {
      await usersApi.restore(id);
      fetchData();
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Khôi phục thất bại");
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h2 className="h5 mb-0">Người dùng</h2>
          <small className="text-muted">Quản lý danh sách người dùng hệ thống</small>
        </div>
        <div className="text-muted small">Tổng: <strong>{total}</strong></div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-auto">
          <input
            className="form-control form-control-sm"
            placeholder="Tìm username hoặc email"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>
        <div className="col-auto">
          <select
            className="form-select form-select-sm"
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">-- Role --</option>
            {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="col-auto form-check d-flex align-items-center">
          <input
            id="includeDeleted"
            className="form-check-input me-1"
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); }}
          />
          <label htmlFor="includeDeleted" className="form-check-label small">Hiển thị đã xóa</label>
        </div>
        <div className="col-auto">
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setQ(""); setRoleFilter(""); setIncludeDeleted(false); setPage(1); }}>Reset</button>
        </div>
      </div>

  {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}

      <div className="table-responsive bg-white shadow-sm rounded border">
        <table className="table table-sm table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th style={{width:60}}>STT</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th style={{width:150}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="text-center py-4">Đang tải...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="text-center py-4">Không có dữ liệu</td></tr>
            )}
            {!loading && items.map((u, idx) => (
              <tr key={u._id} className={u.isDeleted ? "table-danger" : ""}>
                <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
                <td>
                  <button className="btn btn-link btn-sm p-0" onClick={() => openDetail(u._id)}>{u.username}</button>
                </td>
                <td className="small">{u.email}</td>
                <td>
                  <select
                    className="form-select form-select-sm"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    disabled={u.isDeleted}
                  >
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="small">
                  {u.isDeleted ? <span className="badge bg-danger">Đã xóa</span> : <span className="badge bg-success">Hoạt động</span>}
                </td>
                <td>
                  {!u.isDeleted ? (
                    <button className="btn btn-sm btn-outline-danger" onClick={() => softDelete(u._id)}>Xóa</button>
                  ) : (
                    <button className="btn btn-sm btn-outline-primary" onClick={() => restore(u._id)}>Khôi phục</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination controls (similar behavior to AdminDiseases) */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">Tổng: {total} mục</div>
        <nav>
          <ul className="pagination pagination-sm mb-0">
            {(() => {
              const totalPagesLocal = Math.max(1, Math.ceil(total / limit));
              const pages = [];
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPagesLocal, page + 2);
              if (start > 1) {
                pages.push(1);
                if (start > 2) pages.push('...');
              }
              for (let p = start; p <= end; p++) pages.push(p);
              if (end < totalPagesLocal) {
                if (end < totalPagesLocal - 1) pages.push('...');
                pages.push(totalPagesLocal);
              }

              return [
                <li key="prev" className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => page > 1 && setPage(page - 1)}>Prev</button>
                </li>,
                pages.map((p, i) => (
                  typeof p === 'number' ? (
                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                    </li>
                  ) : (
                    <li key={`dot-${i}`} className="page-item disabled"><span className="page-link">{p}</span></li>
                  )
                )),
                <li key="next" className={`page-item ${page >= totalPagesLocal ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => page < totalPagesLocal && setPage(page + 1)}>Next</button>
                </li>
              ];
            })()}
          </ul>
        </nav>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal d-block" tabIndex="-1" role="dialog" onClick={() => setSelected(null)}>
          <div className="modal-dialog" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết người dùng</h5>
                <button type="button" className="btn-close" onClick={() => setSelected(null)}></button>
              </div>
              <div className="modal-body small">
                {detailLoading && <div>Đang tải...</div>}
                {!detailLoading && selected && (
                  <div className="vstack gap-1">
                    <div><strong>Username:</strong> {selected.username}</div>
                    <div><strong>Email:</strong> {selected.email}</div>
                    <div><strong>Role:</strong> {selected.role}</div>
                    <div><strong>Verified:</strong> {selected.isVerified ? "Yes" : "No"}</div>
                    <div><strong>Trạng thái:</strong> {selected.isDeleted ? "Đã xóa" : "Hoạt động"}</div>
                    <div><strong>Tạo lúc:</strong> {new Date(selected.createdAt).toLocaleString()}</div>
                    <div><strong>Cập nhật:</strong> {new Date(selected.updatedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
