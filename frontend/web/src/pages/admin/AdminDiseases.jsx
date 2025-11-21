import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/AdminDiseases.css";
import { toast, Toaster } from 'react-hot-toast';
import { showError, showSuccess, extractErrorMessage } from '../../utils/notify';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { PlusOutlined, InboxOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

export default function AdminDiseases() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // show 10 items per page
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const fetchItems = async (p = page) => {
    setLoading(true);
    try {
      console.log("Fetching diseases...");
      const res = await axiosClient.get(`/admin/diseases?limit=${limit}&page=${p}`);
      console.log("Diseases response:", res.data);
      
      // Response structure: { success: true, data: { items: [...], total: ..., page: ..., limit: ... } }
      const items = res.data?.data?.items || [];
      const tot = res.data?.data?.total || 0;
      const currentPage = res.data?.data?.page || p;
      console.log("Diseases items:", items, { tot, currentPage });
      setItems(items);
      setTotal(tot);
      setPage(Number(currentPage));
    } catch (err) {
      console.error("Error fetching diseases:", err);
      console.error("Error response:", err.response?.data);
      showError(err, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/admin/disease-categories?limit=200');
      const cats = res.data?.data?.items || [];
      setCategories(cats);
    } catch (e) {
      console.error('Error fetching disease categories', e?.response?.data || e.message || e);
      showError(e, { duration: 6000 });
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchItems(page); }, [page]);

  const handleCreate = async (payload) => {
    try {
      await axiosClient.post("/admin/diseases", payload);
      showSuccess('Tạo bệnh thành công');
      setShowCreate(false);
      fetchItems(page);
    } catch (err) {
      console.error('Create disease failed', err);
      showError(err, { duration: 6000 });
    }
  };

  const handleEdit = async (id, payload) => {
    try {
      await axiosClient.put(`/admin/diseases/${id}`, payload);
      showSuccess('Cập nhật bệnh thành công');
      setShowEdit(false);
      setCurrent(null);
      fetchItems(page);
    } catch (err) {
      console.error('Edit disease failed', err);
      showError(err, { duration: 6000 });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/admin/diseases/${id}`);
      showSuccess('Xóa bệnh thành công');
      setShowConfirm(false);
      setCurrent(null);
      const totalPages = Math.max(1, Math.ceil((total - 1) / limit));
      const nextPage = page > totalPages ? totalPages : page;
      fetchItems(nextPage);
    } catch (err) {
      console.error('Delete disease failed', err);
      showError(err, { duration: 6000 });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <Toaster position="top-right" />
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h5 mb-0">Bệnh</h2>
            <small className="text-muted">Quản lý danh sách bệnh</small>
          </div>
          <div>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreate(true)}
                style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', fontWeight: 500 }}
              >
                Thêm mới
              </Button>
              <Button
                icon={<InboxOutlined />}
                onClick={() => setShowTrash(true)}
                style={{ color: '#2E7D32', borderColor: '#E0E0E0', background: '#fff' }}
              >
                Thùng rác
              </Button>
            </Space>
          </div>
        </div>

        <div className="table-responsive bg-white shadow-sm rounded border">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{width:60}}>STT</th>
                <th>Tên</th>
                <th>Danh mục</th>
                <th>Loại cây</th>
                <th>Mức độ</th>
                <th style={{width:300}}>Mô tả</th>
                <th style={{width:150}}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-4">Đang tải...</td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr><td colSpan={7} className="text-center py-4">Không có dữ liệu</td></tr>
              )}
              {!loading && items.map((it, idx) => (
                <tr key={it._id}>
                  <td className="small text-muted">{(page - 1) * limit + idx + 1}</td>
                  <td>
                    <button className="btn btn-link btn-sm p-0" onClick={() => { setCurrent(it); setShowEdit(true); }}>{it.name}</button>
                  </td>
                  <td className="small">{it.category}</td>
                  <td className="small">{(it.plantTypes || []).join(', ')}</td>
                  <td className="small">{it.severity}</td>
                  <td className="small text-truncate" style={{maxWidth:300}}>{it.description ? (it.description.length > 120 ? it.description.substring(0,120) + '...' : it.description) : ''}</td>
                  <td className="text-center align-middle" style={{width:120}}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <button
                        className="btn btn-sm btn-link"
                        title="Chỉnh sửa"
                        onClick={() => { setCurrent(it); setShowEdit(true); }}
                        aria-label={`edit-${it._id}`}
                        style={{ color: '#4CAF50', padding: 4, margin: 0, lineHeight: 1 }}
                      >
                        <FiEdit size={18} />
                      </button>

                      <button
                        className="btn btn-sm btn-link"
                        title="Xóa"
                        onClick={() => { setCurrent(it); setShowConfirm(true); }}
                        aria-label={`delete-${it._id}`}
                        style={{ color: '#FF4D4F', padding: 4, margin: 0, lineHeight: 1 }}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div className="text-muted small">Tổng: {total} mục</div>
          <nav>
            <ul className="pagination pagination-sm mb-0">
              {(() => {
                const totalPages = Math.max(1, Math.ceil(total / limit));
                const pages = [];
                // window of pages: current-2 ... current+2
                let start = Math.max(1, page - 2);
                let end = Math.min(totalPages, page + 2);
                if (start > 1) {
                  pages.push(1);
                  if (start > 2) pages.push('...');
                }
                for (let p = start; p <= end; p++) pages.push(p);
                if (end < totalPages) {
                  if (end < totalPages - 1) pages.push('...');
                  pages.push(totalPages);
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
                  <li key="next" className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => page < totalPages && setPage(page + 1)}>Tiếp</button>
                  </li>
                ];
              })()}
            </ul>
          </nav>
        </div>

        <div className="mt-3">
          {showCreate && (
            <PortalModal onClose={() => setShowCreate(false)}>
              <DiseaseModal title="Tạo bệnh" categories={categories} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
            </PortalModal>
          )}

          {showEdit && current && (
            <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
              <DiseaseModal title="Chỉnh sửa bệnh" initial={current} categories={categories} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
            </PortalModal>
          )}

          {showConfirm && current && (
            <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
              <ConfirmModal title="Xóa bệnh" message={`Bạn có chắc muốn xóa "${current.name}" không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
            </PortalModal>
          )}

          {showTrash && (
            <PortalModal onClose={() => setShowTrash(false)}>
              <DiseaseTrashModal onClose={() => setShowTrash(false)} />
            </PortalModal>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function DiseaseModal({ title, initial = {}, onClose, onSubmit, categories = [] }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [category, setCategory] = useState(initial.category || "");
  const [description, setDescription] = useState(initial.description || "");
  const [severity, setSeverity] = useState(initial.severity || "low");
  const [plantTypes, setPlantTypes] = useState((initial.plantTypes || []).join(", "));

  // when categories load or initial changes, if initial.category matches a category name or slug, prefer slug
  useEffect(() => {
    if (!initial || !initial.category) return;
    const catVal = initial.category;
    if (categories && categories.length) {
      const found = categories.find(c => c.slug === catVal || c.name === catVal || c._id === catVal);
      if (found) setCategory(found.slug || found.name);
    }
  }, [initial, categories]);

  useEffect(() => {
    if (initial && initial.description) setDescription(initial.description);
  }, [initial]);

  const submit = () => {
    const payload = { name, slug, category, severity, description, plantTypes: plantTypes.split(",").map(s => s.trim()).filter(Boolean) };
    onSubmit(payload);
  };
  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Tên</label>
            <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Slug</label>
            <input className="form-control form-control-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Danh mục</label>
            <select className="form-select form-select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c._id || c.slug || c.name} value={c.slug || c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Mức độ</label>
            <select className="form-select form-select-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Loại cây (ngăn cách bằng dấu phẩy)</label>
            <input className="form-control form-control-sm" value={plantTypes} onChange={(e) => setPlantTypes(e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea className="form-control form-control-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Hủy</button>
        <button className="btn btn-sm btn-primary" onClick={submit}>Lưu</button>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm }) {
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
        <button className="btn btn-confirm" onClick={onConfirm}>Xóa</button>
      </div>
    </div>
  );
}

function DiseaseTrashModal({ onClose }) {
  const [trash, setTrash] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = async () => {
    setLoading(true);
    try {
      // backend exposes deleted items via list with includeDeleted=true
      const res = await axiosClient.get('/admin/diseases?includeDeleted=true&limit=200');
      const items = res.data?.data?.items || [];
      // filter only deleted items
      const deleted = (items || []).filter((it) => it.isDeleted === true || it.isDeleted === 'true');
      setTrash(deleted);
    } catch (err) {
      console.error('Failed to load disease trash', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  const handleRestore = async (id) => {
    try {
      await axiosClient.patch(`/admin/diseases/${id}/restore`);
      fetchTrash();
    } catch (err) {
      console.error('Restore failed', err);
    }
  };

  return (
    <div style={{ width: 700, maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h5 className="mb-0">Thùng rác - Bệnh</h5>
        <Button onClick={onClose} type="text">Đóng</Button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
      ) : (
        <div>
          {trash.length === 0 ? (
            <div className="text-muted">Không có bệnh đã xóa</div>
          ) : (
            trash.map(t => (
              <div key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderBottom: '1px solid #eee' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.name}</div>
                  <div className="small text-muted">{t.description || 'Không có mô tả'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button onClick={() => handleRestore(t._id)} style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50', color: '#fff' }}>Hoàn tác</Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
