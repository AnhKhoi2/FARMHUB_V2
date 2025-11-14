import React, { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/shared/axiosClient';
import PortalModal from '../../components/shared/PortalModal';
import placeholderImg from '../../assets/placeholder.svg';

// Simple Admin wrapper reusing existing public ManagerGuides & TrashGuides pages via iframe-like embedding could be done,
// but here we just provide navigation shortcuts into the existing routes now namespaced under /admin.
export default function AdminGuides() {
  const navigate = useNavigate();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);

  const fetchGuides = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/guides', { params: { page: p, limit } });
      const data = res.data || {};
      const docs = data.data || data.docs || [];
      const meta = data.meta || {};
      const tot = data.total || meta.total || (meta.pages ? meta.pages * limit : docs.length);
      setGuides(docs);
      setTotalPages(Math.max(1, Math.ceil(tot / limit)));
    } catch (e) {
      console.error(e);
      setError('Không thể tải guides');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => { fetchGuides(page); }, [page, fetchGuides]);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa hướng dẫn này?')) return;
    setLoading(true);
    try {
      await axiosClient.delete(`/guides/${id}`);
      const remaining = guides.length - 1;
      if (remaining <= 0 && page > 1) {
        setPage(page - 1);
        fetchGuides(page - 1);
      } else {
        fetchGuides(page);
      }
    } catch (e) {
      console.error(e);
      alert('Xóa không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Hướng dẫn</h3>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Tạo mới</button>
            {/* route for trash is registered at /managerguides/trash (not /admin/guides/trash) */}
            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/managerguides/trash')}>Thùng rác</button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                      <th style={{width:60}}>STT</th>
                      <th>Tiêu đề</th>
                      <th>Mô tả</th>
                      <th>Tác giả</th>
                      <th>Ngày tạo</th>
                      <th style={{width:220}}>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6}>Đang tải...</td></tr>
                  ) : guides.length === 0 ? (
                    <tr><td colSpan={6}>Không có hướng dẫn nào.</td></tr>
                  ) : (
                    guides.map((g, idx) => (
                      <tr key={g._id || g.id}>
                        <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
                        <td>{g.title || '(Không có tiêu đề)'}</td>
                        <td className="text-muted small">{g.description || g.summary || '—'}</td>
                        <td>{g.expert_id?.username || g.expert_id?.name || '—'}</td>
                        <td className="text-muted small">{g.createdAt ? new Date(g.createdAt).toLocaleString() : '—'}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => navigate(`/guides/${g._id || g.id}`)}>Xem</button>
                          <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => { setCurrent(g); setShowEdit(true); }}>Sửa</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(g._id || g.id)}>Xóa</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-2">
          <div />
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {(() => {
                const total = totalPages * limit; // estimate total based on pages
                const totalPagesLocal = Math.max(1, totalPages);
                const pages = [];
                let start = Math.max(1, page - 2);
                let end = Math.min(totalPagesLocal, page + 2);
                if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                for (let p = start; p <= end; p++) pages.push(p);
                if (end < totalPagesLocal) { if (end < totalPagesLocal - 1) pages.push('...'); pages.push(totalPagesLocal); }
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

        {showCreate && (
          <PortalModal onClose={() => setShowCreate(false)}>
            <GuideModal title="Tạo hướng dẫn" onClose={() => setShowCreate(false)} onSubmit={async (form) => {
              try {
                const fd = new FormData();
                Object.entries(form).forEach(([k,v]) => {
                  if (k === 'steps') fd.append(k, JSON.stringify(v));
                  else if (v !== undefined && v !== null) fd.append(k, v);
                });
                await axiosClient.post('/guides', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                setShowCreate(false);
                fetchGuides(page);
              } catch (e) {
                console.error(e);
                alert('Tạo mới không thành công');
              }
            }} />
          </PortalModal>
        )}

        {showEdit && current && (
          <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
            <GuideModal title="Sửa hướng dẫn" initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={async (form) => {
              try {
                const fd = new FormData();
                Object.entries(form).forEach(([k,v]) => {
                  if (k === 'steps') fd.append(k, JSON.stringify(v));
                  else if (v !== undefined && v !== null) fd.append(k, v);
                });
                await axiosClient.put(`/guides/${current._id || current.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                setShowEdit(false);
                setCurrent(null);
                fetchGuides(page);
              } catch (e) {
                console.error(e);
                alert('Cập nhật không thành công');
              }
            }} />
          </PortalModal>
        )}
      </div>
    </AdminLayout>
  );
}

function GuideModal({ title, initial = {}, onClose, onSubmit }) {
  const [titleText, setTitleText] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || initial.summary || '');
  const [content, setContent] = useState(initial.content || '');
  const [plantTags, setPlantTags] = useState(Array.isArray(initial.plantTags) ? initial.plantTags.join(', ') : '');
  const [imageFile, setImageFile] = useState(null);

  const submit = () => {
    const steps = [];
    const payload = {
      title: titleText,
      description,
      content,
      plantTags: plantTags.split(',').map(s => s.trim()).filter(Boolean),
      image: imageFile || undefined,
      steps,
    };
    onSubmit(payload);
  };

  return (
    <div>
      <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        <div className="mb-2">
          <label className="form-label">Tiêu đề</label>
          <input className="form-control form-control-sm" value={titleText} onChange={e=>setTitleText(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">Mô tả</label>
          <textarea className="form-control form-control-sm" value={description} onChange={e=>setDescription(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">Nội dung</label>
          <textarea className="form-control form-control-sm" rows={4} value={content} onChange={e=>setContent(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">Thẻ cây trồng (phân bởi dấu phẩy)</label>
          <input className="form-control form-control-sm" value={plantTags} onChange={e=>setPlantTags(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">Ảnh chính</label>
          <input className="form-control form-control-sm" type="file" accept="image/*" onChange={e=>setImageFile(e.target.files?.[0] || null)} />
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn btn-sm btn-primary" onClick={submit}>Lưu</button>
      </div>
    </div>
  );
}
