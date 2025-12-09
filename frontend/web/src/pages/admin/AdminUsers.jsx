import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout.jsx"; // Layout wrapper
import usersApi from "../../api/usersApi.js";
import { FiTrash2, FiRotateCcw, FiX } from 'react-icons/fi';
import { InboxOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import PortalModal from "../../components/shared/PortalModal";
import { toast, Toaster } from 'react-hot-toast';
import { showError, showSuccess } from '../../utils/notify';
import "../../css/admin/AdminDiseases.css";

const ROLE_OPTIONS = ["user", "expert", "moderator", "admin"];
const ROLE_LABELS = { user: 'Người dùng', expert: 'Chuyên gia', moderator: 'Điều phối', admin: 'Quản trị' };

export default function AdminUsers() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // detail modal data
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.list({ q: q || undefined, role: roleFilter || undefined, page, limit });
      if (data?.items) {
        setItems(data.items);
        setTotal(data.total || 0);
      }
    } catch (e) {
      setError(e.message || "Load failed");
    } finally {
      setLoading(false);
    }
  }, [q, roleFilter, page, limit]);

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
      showError(e, { duration: 6000 });
    }
  };

  const softDelete = async (id) => {
    try {
      await usersApi.softDelete(id);
      showSuccess('Xóa người dùng thành công');
      setShowConfirmDelete(false);
      setCurrentUser(null);
      fetchData();
    } catch (e) {
      showError(e, { duration: 6000 });
    }
  };

  const restore = async (id) => {
    try {
      await usersApi.restore(id);
      showSuccess('Khôi phục người dùng thành công');
      setShowConfirmRestore(false);
      setCurrentUser(null);
      fetchData();
    } catch (e) {
      showError(e, { duration: 6000 });
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <AdminLayout>
      <Toaster position="top-right" />
      <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h2 className="h5 mb-0">Người dùng</h2>
          <small className="text-muted">Quản lý danh sách người dùng hệ thống</small>
        </div>
        <div>
          <Button
            icon={<InboxOutlined />}
            onClick={() => navigate("/admin/users/trash")}
            style={{ color: '#2E7D32', borderColor: '#E0E0E0', background: '#fff' }}
          >
            Thùng rác
          </Button>
        </div>
      </div>

      <div className="d-flex align-items-center mb-3" style={{ gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <input
            className="form-control form-control-sm"
            placeholder="Tìm username hoặc email"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            style={{ width: 240, minWidth: 140 }}
          />
          <button
            className="btn btn-sm"
            title="Xóa tìm kiếm"
            onClick={() => { setQ(''); setPage(1); }}
            style={{
              padding: 0,
              width: 34,
              height: 34,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              border: '1px solid #ced4da',
              background: '#fff'
            }}
            aria-label="clear-search"
          >
            <FiX size={14} />
          </button>
        </div>

        <select
          className="form-select form-select-sm"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ width: 160, minWidth: 140 }}
        >
          <option value="">-- Vai trò --</option>
          {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-danger py-1 small mb-2">{error}</div>}

      <div className="table-responsive bg-white shadow-sm rounded border">
        <table className="table table-sm table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th style={{width:60}}>STT</th>
              <th>Tên đăng nhập</th>
              <th>Email</th>
              <th style={{width:120}}>Trạng thái</th>
              <th style={{width:250}}>Vai trò</th>
              <th style={{width:70}} className="text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4">Không có dữ liệu</td></tr>
            )}
            {!loading && items.map((u, idx) => (
              <tr key={u._id} className={u.isDeleted ? "table-danger" : ""}>
                <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
                <td>
                  <button className="btn btn-link btn-sm p-0" onClick={() => openDetail(u._id)}>{u.username}</button>
                </td>
                <td className="small">{u.email}</td>
                <td className="small" style={{width:120}}>
                  {u.isDeleted ? <span className="badge bg-danger">Đã xóa</span> : <span className="badge bg-success">Hoạt động</span>}
                </td>
                <td style={{width:250, minWidth:200}}>
                  <select
                    className="form-select"
                    value={u.role}
                    onChange={(e) => changeRole(u._id, e.target.value)}
                    disabled={u.isDeleted}
                    style={{fontSize: '14px', padding: '6px 12px'}}
                  >
                    {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>)}
                  </select>
                </td>
                <td className="text-center align-middle" style={{width:70}}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    {!u.isDeleted ? (
                      <button
                        className="btn btn-sm btn-link"
                        title="Xóa"
                        onClick={() => { setCurrentUser(u); setShowConfirmDelete(true); }}
                        aria-label={`delete-${u._id}`}
                        style={{ color: '#FF4D4F', padding: 4, margin: 0, lineHeight: 1 }}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-link"
                        title="Khôi phục"
                        onClick={() => { setCurrentUser(u); setShowConfirmRestore(true); }}
                        aria-label={`restore-${u._id}`}
                        style={{ color: '#1890ff', padding: 4, margin: 0, lineHeight: 1 }}
                      >
                        <FiRotateCcw size={18} />
                      </button>
                    )}
                  </div>
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
                  <button className="page-link" onClick={() => page > 1 && setPage(page - 1)}>Trước</button>
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
                  <button className="page-link" onClick={() => page < totalPagesLocal && setPage(page + 1)}>Tiếp</button>
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
                    <div><strong>Tên đăng nhập:</strong> {selected.username}</div>
                    <div><strong>Email:</strong> {selected.email}</div>
                    <div><strong>Vai trò:</strong> {ROLE_LABELS[selected.role] || selected.role}</div>
                    <div><strong>Đã xác minh:</strong> {selected.isVerified ? "Có" : "Không"}</div>
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

      {/* Confirm Delete Modal */}
      {showConfirmDelete && currentUser && (
        <PortalModal onClose={() => { setShowConfirmDelete(false); setCurrentUser(null); }}>
          <ConfirmModal 
            title="Xóa người dùng" 
            message={`Bạn có chắc muốn xóa người dùng "${currentUser.username}" không? Người dùng sẽ không thể đăng nhập cho đến khi được khôi phục.`} 
            onCancel={() => { setShowConfirmDelete(false); setCurrentUser(null); }} 
            onConfirm={() => softDelete(currentUser._id)} 
          />
        </PortalModal>
      )}

      {/* Confirm Restore Modal */}
      {showConfirmRestore && currentUser && (
        <PortalModal onClose={() => { setShowConfirmRestore(false); setCurrentUser(null); }}>
          <ConfirmModal 
            title="Khôi phục người dùng" 
            message={`Bạn có chắc muốn khôi phục người dùng "${currentUser.username}" không?`} 
            onCancel={() => { setShowConfirmRestore(false); setCurrentUser(null); }} 
            onConfirm={() => restore(currentUser._id)}
            confirmText="Khôi phục"
          />
        </PortalModal>
      )}
    </AdminLayout>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm, confirmText = "Xóa" }) {
  return (
    <div className="confirm-modal">
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-cancel" onClick={onCancel}>Hủy</button>
        <button className="btn btn-confirm" onClick={onConfirm}>{confirmText}</button>
      </div>
    </div>
  );
}
