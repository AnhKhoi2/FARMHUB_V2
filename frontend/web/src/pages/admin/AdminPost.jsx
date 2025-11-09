import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";

export default function AdminPost() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [current, setCurrent] = useState(null);

  const [reportsList, setReportsList] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      // Try admin endpoint first (requires admin auth). If it fails (401/403), fall back to public listing.
      let res;
      try {
        res = await axiosClient.get(`/admin/managerpost?limit=200`);
      } catch (e) {
        console.warn('Admin managerpost fetch failed, trying public endpoint', e?.response?.status);
        res = await axiosClient.get(`/admin/managerpost/public?limit=200`);
      }
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleHide = async (id) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/hide`);
      fetchItems();
    } catch (err) { console.error(err); alert('Không thể xóa bài viết'); }
  };

  const handleRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/restore`);
      fetchItems();
    } catch (err) { console.error(err); alert('Không thể hoàn tác'); }
  };

  const changeStatus = async (id, status) => {
    try {
      await axiosClient.patch(`/admin/managerpost/${id}/status`, { status });
      fetchItems();
    } catch (err) { console.error(err); alert('Không thể thay đổi trạng thái'); }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Quản lý bài viết</h3>
          <div>
            <button className="btn btn-sm btn-outline-danger me-2" onClick={() => setShowReports(true)}>Báo cáo</button>
            <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => setShowTrash(true)}>Thùng rác</button>
            <button className="btn btn-sm btn-primary" onClick={() => fetchItems()}>Làm mới</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Tiêu đề</th>
                    <th>Người đăng</th>
                    <th>Điện thoại</th>
                    <th>Địa điểm</th>
                    <th>Ngày</th>
                    <th>Trạng thái</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8}>Đang tải...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={8}>Chưa có bài đăng</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it._id}>
                        <td style={{ fontFamily: 'monospace' }}>{String(idx + 1).padStart(2, '0')}</td>
                        <td>{it.title}</td>
                        <td>{it.userId?.username || (it.userId?.email || '—')}</td>
                        <td>{it.phone || '—'}</td>
                        <td>{it.location?.address || '—'}</td>
                        <td>{new Date(it.createdAt).toLocaleString()}</td>
                        <td>{it.status}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => { setCurrent(it); setShowDetail(true); }}>Xem</button>
                          {it.status !== 'approved' && (
                            <button className="btn btn-sm btn-success me-1" onClick={() => changeStatus(it._id, 'approved')}>Duyệt</button>
                          )}
                          {it.status !== 'rejected' && (
                            <button className="btn btn-sm btn-warning me-1" onClick={() => changeStatus(it._id, 'rejected')}>Từ chối</button>
                          )}
                          {!it.isDeleted ? (
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleHide(it._id)}>Xóa</button>
                          ) : (
                            <button className="btn btn-sm btn-success" onClick={() => handleRestore(it._id)}>Hoàn tác</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {showTrash && (
          <PortalModal onClose={() => setShowTrash(false)}>
            <TrashModal onClose={() => setShowTrash(false)} onRestore={handleRestore} />
          </PortalModal>
        )}

        {showReports && (
          <PortalModal onClose={() => setShowReports(false)}>
            <ReportsModal onClose={() => setShowReports(false)} onViewReports={async (postId) => {
              try {
                const res = await axiosClient.get(`/admin/managerpost/${postId}/reports`);
                const data = res.data?.data || res.data || {};
                // show reports in detail modal
                setCurrent({ ...data.postOwner, reports: data.reports, _id: postId });
                setShowDetail(true);
              } catch (err) { console.error(err); alert('Không thể tải báo cáo'); }
            }} onBanUser={async (postId) => {
              if (!window.confirm('Cấm user này? Hành động sẽ ẩn tất cả bài đăng của họ và chặn tài khoản.')) return;
              try {
                await axiosClient.patch(`/admin/managerpost/${postId}/ban-user`);
                alert('User đã bị cấm và bài viết đã bị ẩn');
                setShowReports(false);
                fetchItems();
              } catch (err) { console.error(err); alert('Không thể cấm user'); }
            }} />
          </PortalModal>
        )}

        {showDetail && current && (
          <PortalModal onClose={() => { setShowDetail(false); setCurrent(null); }}>
            <DetailModal item={current} onClose={() => { setShowDetail(false); setCurrent(null); }} />
          </PortalModal>
        )}
      </div>
    </AdminLayout>
  );
}

function TrashModal({ onClose, onRestore }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/managerpost/trash');
      const data = res.data?.data || res.data || [];
      setItems(data || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return (
      <div style={{ minWidth: 700 }}>
      <div className="modal-header">
        <h5 className="modal-title">Thùng rác - Bài viết</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        {loading ? <p>Đang tải...</p> : (
          <div className="list-group">
            {items.length === 0 ? <p>Không có bài đã xóa</p> : items.map((t) => (
              <div key={t._id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div><strong>{t.title}</strong> — {t.userId?.username || t.userId?.email}</div>
                  <div className="small text-muted">{t.description}</div>
                </div>
                <div>
                  <button className="btn btn-sm btn-success" onClick={() => { onRestore(t._id); fetch(); }}>Hoàn tác</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

function ReportsModal({ onClose, onViewReports, onBanUser }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/managerpost/reported');
      const data = res.data?.data || res.data || [];
      setItems(data || []);
    } catch (err) { console.error(err); alert('Không thể tải danh sách báo cáo'); }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div style={{ minWidth: 800 }}>
      <div className="modal-header">
        <h5 className="modal-title">Bài bị báo cáo</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        {loading ? <p>Đang tải...</p> : (
          <div className="list-group">
            {items.length === 0 ? <p>Không có bài bị báo cáo</p> : items.map((p) => (
              <div key={p._id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <div><strong>{p.title}</strong> — <small className="text-muted">{p.userId?.username || p.userId?.email}</small></div>
                  <div className="small text-muted">{p.reports?.length || 0} báo cáo — {new Date(p.updatedAt).toLocaleString()}</div>
                  <div className="small">{p.description?.slice(0, 200)}</div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onViewReports(p._id)}>Xem báo cáo</button>
                  <button className="btn btn-sm btn-danger" onClick={() => onBanUser(p._id)}>Cấm user</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}

function DetailModal({ item, onClose }) {
  return (
    <div style={{ minWidth: 700 }}>
      <div className="modal-header">
        <h5 className="modal-title">Chi tiết bài đăng</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        {item.title && <h5>{item.title}</h5>}
        {item.userId && <p><strong>Người đăng:</strong> {item.userId?.username || item.userId?.email}</p>}
        {item.phone && <p><strong>Điện thoại:</strong> {item.phone || '—'}</p>}
        {item.location && <p><strong>Địa điểm:</strong> {item.location?.address || '—'}</p>}
        {item.description && <>
          <p><strong>Mô tả:</strong></p>
          <p>{item.description}</p>
        </>}

        {/* If this item contains reports (from reportsForPost), render them */}
        {item.reports && Array.isArray(item.reports) && item.reports.length > 0 && (
          <div className="mt-3">
            <h6>Báo cáo ({item.reports.length})</h6>
            <div className="list-group">
              {item.reports.map((r, i) => (
                <div key={i} className="list-group-item">
                  <div><strong>{r.userId?.username || r.userId?.email || 'Người dùng'}</strong> — <small className="text-muted">{new Date(r.createdAt).toLocaleString()}</small></div>
                  <div className="small text-muted">{r.reason}</div>
                  <div>{r.message}</div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <button className="btn btn-sm btn-danger" onClick={async () => {
                if (!window.confirm('Cấm user này?')) return;
                try {
                  await axiosClient.patch(`/admin/managerpost/${item._id}/ban-user`);
                  alert('User đã bị cấm');
                  onClose();
                } catch (err) {
                  console.error(err);
                  alert('Không thể cấm user');
                }
              }}>Cấm user</button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Đóng</button>
      </div>
    </div>
  );
}
