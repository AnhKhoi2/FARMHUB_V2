import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/AdminDiseases.css";

export default function AdminDiseases() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      console.log("Fetching diseases...");
      const res = await axiosClient.get("/admin/diseases?limit=100");
      console.log("Diseases response:", res.data);
      
      // Response structure: { success: true, data: { items: [...], total: ..., page: ..., limit: ... } }
      const items = res.data?.data?.items || [];
      console.log("Diseases items:", items);
      setItems(items);
    } catch (err) {
      console.error("Error fetching diseases:", err);
      console.error("Error response:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async (payload) => {
    await axiosClient.post("/admin/diseases", payload);
    setShowCreate(false);
    fetchItems();
  };

  const handleEdit = async (id, payload) => {
    await axiosClient.put(`/admin/diseases/${id}`, payload);
    setShowEdit(false);
    setCurrent(null);
    fetchItems();
  };

  const handleDelete = async (id) => {
    await axiosClient.delete(`/admin/diseases/${id}`);
    setShowConfirm(false);
    setCurrent(null);
    fetchItems();
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
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
                <th>Name</th>
                <th>Category</th>
                <th>Plant types</th>
                <th>Severity</th>
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
                  <td>
                    <button className="btn btn-link btn-sm p-0" onClick={() => { setCurrent(it); setShowEdit(true); }}>{it.name}</button>
                  </td>
                  <td className="small">{it.category}</td>
                  <td className="small">{(it.plantTypes || []).join(', ')}</td>
                  <td className="small">{it.severity}</td>
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
              <DiseaseModal title="Create Disease" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
            </PortalModal>
          )}

          {showEdit && current && (
            <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
              <DiseaseModal title="Edit Disease" initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
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

function DiseaseModal({ title, initial = {}, onClose, onSubmit }) {
  const [name, setName] = useState(initial.name || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [category, setCategory] = useState(initial.category || "");
  const [severity, setSeverity] = useState(initial.severity || "low");
  const [plantTypes, setPlantTypes] = useState((initial.plantTypes || []).join(", "));

  const submit = () => {
    const payload = { name, slug, category, severity, plantTypes: plantTypes.split(",").map(s => s.trim()).filter(Boolean) };
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
            <input className="form-control form-control-sm" value={category} onChange={(e) => setCategory(e.target.value)} />
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
