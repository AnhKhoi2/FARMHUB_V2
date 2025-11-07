import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";

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
      const res = await axiosClient.get("/admin/disease-categories?limit=20");
      const items = res.data?.data?.items || res.data?.items || [];
      setItems(items);
    } catch (err) {
      console.error(err);
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
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3>Categories</h3>
          <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(true)}>Add category</button>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4}>Loading...</td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={4}>No records</td></tr>
                  ) : (
                    items.map((it) => (
                      <tr key={it._id}>
                        <td>{it.name}</td>
                        <td>{it.slug}</td>
                        <td>{it.description}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => { setCurrent(it); setShowEdit(true); }}>Edit</button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => { setCurrent(it); setShowConfirm(true); }}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <PortalModal onClose={() => setShowCreate(false)}>
            <CategoryModal title="Create Category" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
          </PortalModal>
        )}

        {/* Edit Modal */}
        {showEdit && current && (
          <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
            <CategoryModal title="Edit Category" initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
          </PortalModal>
        )}

        {/* Confirm Delete */}
        {showConfirm && current && (
          <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
            <ConfirmModal title="Delete category" message={`Bạn có chắc muốn xóa "${current.name}" không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
          </PortalModal>
        )}
      </div>
    </AdminLayout>
  );
}

function CategoryModal({ title, initial = {}, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [description, setDescription] = useState(initial.description || "");

  const submit = () => {
    onSubmit({ name, slug, description });
  };

  return (
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Slug</label>
          <input className="form-control form-control-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea className="form-control form-control-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
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
    <div>
      <div className="modal-header">
        <h5 className="modal-title">{title}</h5>
        <button type="button" className="btn-close" aria-label="Close" onClick={onCancel}></button>
      </div>
      <div className="modal-body">
        <p>{message}</p>
      </div>
      <div className="modal-footer">
        <button className="btn btn-sm btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-sm btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  );
}
