import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import collectionsApi from "../../api/farmer/collectionsApi";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/CollectionDetail.css";

const CollectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [allNotebooks, setAllNotebooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchCollectionData();
  }, [id, sortBy, sortOrder]);

  const fetchCollectionData = async () => {
    try {
      setLoading(true);

      // Lấy thông tin collection
      const collectionRes = await collectionsApi.getCollectionById(id);
      setCollection(collectionRes.data.data);

      // Lấy danh sách notebooks trong collection
      const notebooksRes = await collectionsApi.getNotebooksInCollection(
        id,
        sortBy,
        sortOrder
      );
      setNotebooks(notebooksRes.data.data || []);

      setError(null);
    } catch (err) {
      console.error("Error fetching collection data:", err);
      setError("Không thể tải dữ liệu bộ sưu tập");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllNotebooks = async () => {
    try {
      const response = await notebookApi.getAllNotebooks();
      const allNbs = response.data.data || [];

      // Lọc ra những notebook chưa có trong collection
      const notebookIdsInCollection = notebooks.map((nb) => nb._id);
      const availableNotebooks = allNbs.filter(
        (nb) => !notebookIdsInCollection.includes(nb._id)
      );

      setAllNotebooks(availableNotebooks);
    } catch (err) {
      console.error("Error fetching notebooks:", err);
    }
  };

  const handleAddNotebook = async (notebookId) => {
    try {
      await collectionsApi.addNotebookToCollection(id, notebookId);
      setShowAddModal(false);
      fetchCollectionData();
    } catch (err) {
      console.error("Error adding notebook:", err);
      alert("Không thể thêm nhật ký vào bộ sưu tập");
    }
  };

  const handleRemoveNotebook = async (notebookId, notebookName) => {
    if (!window.confirm(`Xóa "${notebookName}" khỏi bộ sưu tập?`)) {
      return;
    }

    try {
      await collectionsApi.removeNotebookFromCollection(id, notebookId);
      fetchCollectionData();
    } catch (err) {
      console.error("Error removing notebook:", err);
      alert("Không thể xóa nhật ký khỏi bộ sưu tập");
    }
  };

  const handleUpdateCollection = async (e) => {
    e.preventDefault();

    try {
      await collectionsApi.updateCollection(id, editForm);
      setShowEditModal(false);
      fetchCollectionData();
    } catch (err) {
      console.error("Error updating collection:", err);
      alert("Không thể cập nhật bộ sưu tập");
    }
  };

  const handleViewNotebook = (notebookId) => {
    navigate(`/farmer/notebooks/${notebookId}`);
  };

  const openEditModal = () => {
    setEditForm({
      collection_name: collection.collection_name,
      description: collection.description || "",
      cover_image: collection.cover_image || "",
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    fetchAllNotebooks();
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="collection-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="collection-detail-container">
        <div className="error-message">
          {error || "Không tìm thấy bộ sưu tập"}
        </div>
        <button onClick={() => navigate("/farmer/collections")}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="collection-detail-container">
      {/* Header */}
      <div className="collection-header">
        <button
          className="btn-back"
          onClick={() => navigate("/farmer/collections")}
        >
          ← Quay lại
        </button>

        <div className="header-content">
          <div className="header-left">
            {collection.cover_image ? (
              <img
                src={collection.cover_image}
                alt={collection.collection_name}
                className="collection-cover-large"
              />
            ) : (
              <div className="cover-placeholder-large">📚</div>
            )}

            <div className="header-info">
              <h1>{collection.collection_name}</h1>
              {collection.description && (
                <p className="collection-description">
                  {collection.description}
                </p>
              )}
              <div className="collection-stats">
                <span>📓 {collection.notebook_count} nhật ký</span>
                <span>
                  📅{" "}
                  {new Date(collection.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button className="btn-edit" onClick={openEditModal}>
              ✏️ Chỉnh sửa
            </button>
            <button className="btn-add-notebook" onClick={openAddModal}>
              + Thêm nhật ký
            </button>
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="sort-controls">
        <label>Sắp xếp theo:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="created">Ngày tạo</option>
          <option value="updated">Ngày cập nhật</option>
          <option value="name">Tên</option>
          <option value="progress">Tiến độ</option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">Giảm dần</option>
          <option value="asc">Tăng dần</option>
        </select>
      </div>

      {/* Notebooks Grid */}
      <div className="notebooks-grid">
        {notebooks.length === 0 ? (
          <div className="empty-state">
            <p>📭 Chưa có nhật ký nào trong bộ sưu tập</p>
            <button className="btn-add-first" onClick={openAddModal}>
              + Thêm nhật ký đầu tiên
            </button>
          </div>
        ) : (
          notebooks.map((notebook) => (
            <div
              key={notebook._id}
              className="notebook-card"
              onClick={() => handleViewNotebook(notebook._id)}
            >
              <div className="notebook-cover">
                {notebook.cover_image ? (
                  <img
                    src={notebook.cover_image}
                    alt={notebook.notebook_name}
                  />
                ) : (
                  <div className="cover-placeholder">🌱</div>
                )}
                {notebook.progress !== undefined && (
                  <div className="progress-badge">{notebook.progress}%</div>
                )}
              </div>

              <div className="notebook-info">
                <h3>{notebook.notebook_name}</h3>
                <p className="plant-type">🌿 {notebook.plant_type}</p>

                {notebook.guide_id && (
                  <p className="guide-info">📖 {notebook.guide_id.title}</p>
                )}

                <div className="notebook-meta">
                  <span>
                    📅{" "}
                    {new Date(
                      notebook.planted_date || notebook.createdAt
                    ).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                {notebook.progress !== undefined && (
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${notebook.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div
                className="notebook-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="btn-remove"
                  onClick={() =>
                    handleRemoveNotebook(notebook._id, notebook.notebook_name)
                  }
                  title="Xóa khỏi bộ sưu tập"
                >
                  ✖️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Notebook Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Thêm nhật ký vào bộ sưu tập</h2>

            <div className="notebooks-list">
              {allNotebooks.length === 0 ? (
                <p className="empty-message">Không có nhật ký nào để thêm</p>
              ) : (
                allNotebooks.map((notebook) => (
                  <div key={notebook._id} className="notebook-item">
                    <div className="notebook-item-info">
                      <h4>{notebook.notebook_name}</h4>
                      <p>🌿 {notebook.plant_type}</p>
                    </div>
                    <button
                      className="btn-add-single"
                      onClick={() => handleAddNotebook(notebook._id)}
                    >
                      + Thêm
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              className="btn-close-modal"
              onClick={() => setShowAddModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Edit Collection Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh sửa bộ sưu tập</h2>
            <form onSubmit={handleUpdateCollection}>
              <div className="form-group">
                <label>Tên bộ sưu tập *</label>
                <input
                  type="text"
                  value={editForm.collection_name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      collection_name: e.target.value,
                    })
                  }
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      description: e.target.value,
                    })
                  }
                  maxLength={500}
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>URL ảnh bìa</label>
                <input
                  type="url"
                  value={editForm.cover_image}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      cover_image: e.target.value,
                    })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionDetail;
