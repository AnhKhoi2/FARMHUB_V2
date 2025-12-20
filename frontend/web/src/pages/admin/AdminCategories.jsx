import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import PortalModal from "../../components/shared/PortalModal";
import axiosClient from "../../api/shared/axiosClient";
import "../../css/admin/AdminCategories.css";
import { toast, Toaster } from 'react-hot-toast';
import { showError, showSuccess } from '../../utils/notify';
import { FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import { PlusOutlined, InboxOutlined } from "@ant-design/icons";
import { Button, Space, Spin, Typography } from 'antd';

export default function AdminCategories() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");

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
      setFilteredItems(items);
    } catch (err) {
      console.error("Error fetching categories:", err);
      console.error("Error response:", err.response?.data);
      showError(err, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  // Filter items when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredItems(items);
    } else {
      const filtered = items.filter(item => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchTerm, items]);

  const handleCreate = async (payload) => {
    try {
      await axiosClient.post("/admin/disease-categories", payload);
      showSuccess('Tạo danh mục thành công');
      setShowCreate(false);
      fetchItems();
    } catch (err) {
      console.error('Create category failed', err);
      showError(err, { duration: 6000 });
    }
  };

  const handleEdit = async (id, payload) => {
    try {
      await axiosClient.put(`/admin/disease-categories/${id}`, payload);
      showSuccess('Cập nhật danh mục thành công');
      setShowEdit(false);
      setCurrent(null);
      fetchItems();
    } catch (err) {
      console.error('Edit category failed', err);
      showError(err, { duration: 6000 });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axiosClient.delete(`/admin/disease-categories/${id}`);
      showSuccess('Xóa danh mục thành công');
      setShowConfirm(false);
      setCurrent(null);
      fetchItems();
    } catch (err) {
      console.error('Delete category failed', err);
      showError(err, { duration: 6000 });
    }
  };

  return (
    <AdminLayout>
      <div className="container-fluid">
        <Toaster position="top-right" />
        <div className="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="h5 mb-0">Danh mục bệnh</h2>
            <small className="text-muted">Quản lý danh mục bệnh</small>
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
                onClick={() => navigate("/admin/disease-categories/trash")}
                style={{ color: '#2E7D32', borderColor: '#E0E0E0', background: '#fff' }}
              >
                Thùng rác
              </Button>
              
            </Space>
          </div>
        </div>

        {/* Search Bar */}
        <div className="d-flex align-items-center mb-3" style={{ gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              className="form-control form-control-sm"
              placeholder="Tìm kiếm theo tên, đường dẫn hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 320, minWidth: 220 }}
            />
            {searchTerm && (
              <button
                className="btn btn-sm"
                title="Xóa tìm kiếm"
                onClick={() => setSearchTerm("")}
                style={{
                  padding: 0,
                  width: 28,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  border: '1px solid #ced4da',
                  background: '#fff'
                }}
                aria-label="clear-search"
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="table-responsive bg-white shadow-sm rounded border">
          <table className="table table-sm table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{width:60}}>STT</th>
                <th>Biểu tượng</th>
                <th>Tên</th>
                <th>Đường dẫn</th>
                <th style={{width:350}}>Mô tả</th>
                <th style={{width:120}} className="text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="text-center py-4">Đang tải...</td></tr>
              )}
              {!loading && filteredItems.length === 0 && (
                <tr><td colSpan={6} className="text-center py-4">
                  {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Không có dữ liệu'}
                </td></tr>
              )}
              {!loading && filteredItems.map((it, idx) => (
                <tr key={it._id}>
                  <td className="small text-muted">{idx + 1}</td>
                  <td><div className="category-icon">{it.icon || '🦠'}</div></td>
                  <td>
                    <button className="btn btn-link btn-sm p-0" onClick={() => { setCurrent(it); setShowEdit(true); }}>{it.name}</button>
                  </td>
                  <td className="small">{it.slug}</td>
                  <td className="small" style={{maxWidth:350}}>
                    {it.description ? (it.description.length > 120 ? it.description.substring(0,120) + '...' : it.description) : 'Không có mô tả'}
                  </td>
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

        <div className="mt-3">
          {showCreate && (
            <PortalModal onClose={() => setShowCreate(false)}>
              <CategoryModal title="Tạo danh mục" onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
            </PortalModal>
          )}

          {showEdit && current && (
            <PortalModal onClose={() => { setShowEdit(false); setCurrent(null); }}>
              <CategoryModal title="Chỉnh sửa danh mục" initial={current} onClose={() => { setShowEdit(false); setCurrent(null); }} onSubmit={(data) => handleEdit(current._id, data)} />
            </PortalModal>
          )}

          {showConfirm && current && (
            <PortalModal onClose={() => { setShowConfirm(false); setCurrent(null); }}>
              <ConfirmModal title="Xóa danh mục" message={`Bạn có chắc muốn xóa "${current.name}" không?`} onCancel={() => { setShowConfirm(false); setCurrent(null); }} onConfirm={() => handleDelete(current._id)} />
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
            <label className="form-label">Tên</label>
            <input 
              className="form-control" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Nhập tên danh mục"
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Đường dẫn (slug)</label>
            <input 
              className="form-control" 
              value={slug} 
              onChange={(e) => setSlug(e.target.value)} 
              placeholder="ten-danh-muc"
            />
          </div>
          <div className="col-12">
            <label className="form-label">Biểu tượng (Emoji)</label>
            <input 
              className="form-control" 
              value={icon} 
              onChange={(e) => setIcon(e.target.value)} 
              placeholder="🦠"
              maxLength={2}
            />
            <small className="form-text">Sử dụng emoji làm biểu tượng (ví dụ: 🦠, 🍃, 🐛)</small>
          </div>
          <div className="col-12">
            <label className="form-label">Mô tả</label>
            <textarea 
              className="form-control" 
              rows={3}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Nhập mô tả danh mục"
            />
          </div>
        </div>
      </div>
      <div className="modal-footer">
        <button 
          className="btn btn-cancel" 
          onClick={onClose}
          style={{ backgroundColor: '#6c757d', border: 'none', color: 'white' }}
        >
          Hủy
        </button>
        <button 
          className="btn btn-add" 
          onClick={submit}
          style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', border: 'none', color: 'white', padding: '0.5rem 1.5rem', borderRadius: '8px', fontWeight: '500' }}
        >
          Lưu
        </button>
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
