import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/AdminCategories.css";

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      console.log("Fetching categories...");
      const res = await axiosClient.get("/admin/disease-categories?limit=100");
      console.log("Categories response:", res.data);
      
      // Response structure: { success: true, data: { items: [...], total: ..., page: ..., limit: ... } }
      const items = res.data?.data?.items || [];
      console.log("Categories items:", items);
      setItems(items);
    } catch (err) {
      console.error("Error fetching categories:", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (payload) => {
    await axiosClient.post("/admin/disease-categories", payload);
    setShowCreate(false);
    fetchItems();
  };

  const handleEdit = async (id, payload) => {
    await axiosClient.put(`/admin/disease-categories/${id}`, payload);
    setShowEdit(false);

    setCurrent(null);
    fetchItems();
  };

  const handleDelete = async (id) => {
    await axiosClient.delete(`/admin/disease-categories/${id}`);
    setShowConfirm(false);
    setCurrent(null);
    fetchItems();
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h5 mb-0">Danh mục bệnh</h2>
            <small className="text-muted">Quản lý danh mục bệnh</small>
          </div>
          <div>
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Thêm danh mục</button>
          </div>
        </div>

        <div className="table-responsive bg-white shadow-sm rounded border">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Icon</th>
                <th>Name</th>
                <th>Slug</th>
                <th>Description</th>
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
              {!loading && items.map(it => (
                <tr key={it._id}>
                  <td><div className="category-icon">{it.icon || '🦠'}</div></td>
                  <td>
                    <button className="btn btn-link btn-sm p-0" onClick={() => { setCurrent(it); setShowEdit(true); }}>{it.name}</button>
                  </td>
                  <td className="small">{it.slug}</td>
                  <td className="small">{it.description || 'No description'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setCurrent(it); setShowEdit(true); }}>Edit</button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => { setCurrent(it); setShowConfirm(true); }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          {showCreate && (
            <PortalModal onClose={() => setShowCreate(false)}>
              <CategoryModal title="Create Category" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
            </PortalModal>
          )}

          {showEdit && current && (
            <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
              <CategoryModal title="Edit Category" initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
            </PortalModal>
          )}

          {showConfirm && current && (
            <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
              <ConfirmModal title="Delete category" message={`Bạn có chắc muốn xóa "${current.name}" không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
            </PortalModal>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

function CategoryModal({ title, initial = {}, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [description, setDescription] = useState(initial.description || "");
  const [icon, setIcon] = useState(initial.icon || "🦠");

  const submit = () => {
    onSubmit({ name, slug, description, icon });
  };

  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        <div className="row g-3">
          <div className="col-12">
            <div className="icon-preview">{icon}</div>
          </div>
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter category name"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Slug</label>
            <input 
              className="form-control" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              placeholder="category-slug"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Icon (Emoji)</label>
            <input 
              className="form-control" 
              value={icon} 
              onChange={(e) => setIcon(e.target.value)} 
              placeholder="🦠"
              maxLength={2}
            />
            <small className="form-text">Use emoji as icon (e.g., 🦠, 🍃, 🐛)</small>
          </div>
          <div className="col-12">
            <label className="form-label">Description</label>
            <textarea 
              className="form-control" 
              rows={3}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Enter category description"
            />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button className="btn btn-cancel" onClick={onClose}>Cancel</button>
        <button className="btn btn-add" onClick={submit}>Save</button>
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
