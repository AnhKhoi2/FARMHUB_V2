import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/AdminDiseases.css";
import { toast, Toaster } from 'react-hot-toast';
import { showError, showSuccess, extractErrorMessage } from '../../utils/notify';

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
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Thêm bệnh</button>
          </div>
        </div>

        <div className="table-responsive bg-white shadow-sm rounded border">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{width:60}}>STT</th>
                <th>Name</th>
                <th>Category</th>
                <th>Plant types</th>
                <th>Severity</th>
                <th style={{width:300}}>Description</th>
                <th style={{width:150}}>Actions</th>
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
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setCurrent(it); setShowEdit(true); }}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => { setCurrent(it); setShowConfirm(true); }}>Delete</button>
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
                  <li key="next" className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => page < totalPages && setPage(page + 1)}>Next</button>
                  </li>
                ];
              })()}
            </ul>
          </nav>
        </div>

        <div className="mt-3">
          {showCreate && (
            <PortalModal onClose={() => setShowCreate(false)}>
              <DiseaseModal title="Create Disease" categories={categories} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
            </PortalModal>
          )}

          {showEdit && current && (
            <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
              <DiseaseModal title="Edit Disease" initial={current} categories={categories} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
            </PortalModal>
          )}

          {showConfirm && current && (
            <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
              <ConfirmModal title="Delete disease" message={`Bạn có chắc muốn xóa "${current.name}" không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
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
            <label className="form-label">Name</label>
            <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Slug</label>
            <input className="form-control form-control-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Category</label>
            <select className="form-select form-select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Chọn category --</option>
              {categories.map((c) => (
                <option key={c._id || c.slug || c.name} value={c.slug || c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">Severity</label>
            <select className="form-select form-select-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Plant types (comma separated)</label>
            <input className="form-control form-control-sm" value={plantTypes} onChange={(e) => setPlantTypes(e.target.value)} />
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea className="form-control form-control-sm" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-sm btn-primary" onClick={submit}>Save</button>
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
        <button className="btn btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn btn-confirm" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  );
}
