import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";
import collectionsApi from "../../api/farmer/collectionsApi";
import notebookApi from "../../api/farmer/notebookApi";
import "../../css/farmer/CollectionDetail.css";
import "../../css/farmer/CollectionDetail.modern.css";
import NotebookCard from "../../components/farmer/NotebookCard";

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
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sortBy, setSortBy] = useState("created");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchCollectionData();
  }, [id, sortBy, sortOrder]);

  // set page body background for this page and clean up on unmount
  useEffect(() => {
    document.body.classList.add("collection-detail-bg");
    return () => {
      document.body.classList.remove("collection-detail-bg");
    };
  }, []);

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
      // Build payload and upload file if user selected one
      const payload = {
        collection_name: editForm.collection_name,
        description: editForm.description,
      };

      if (editForm.cover_file) {
        try {
          const uploadedUrl = await collectionsApi.uploadImage(
            editForm.cover_file
          );
          if (uploadedUrl) payload.cover_image = uploadedUrl;
        } catch (uploadErr) {
          console.error("Upload failed:", uploadErr);
          // fallback to preview or existing value
          if (previewUrl) payload.cover_image = previewUrl;
        }
      } else {
        // if user didn't choose new file, keep existing cover_image or empty string
        payload.cover_image = editForm.cover_image || "";
      }

      await collectionsApi.updateCollection(id, payload);
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
      cover_file: null,
    });
    setPreviewUrl(collection.cover_image || null);
    setShowEditModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // revoke previous object URL if any
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setEditForm({ ...editForm, cover_file: file });
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith("blob:"))
      URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setEditForm({ ...editForm, cover_file: null, cover_image: "" });
  };

  // Clean up preview URL when modal closes
  useEffect(() => {
    if (!showEditModal && previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [showEditModal]);

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
    <>
      <Header />
      <div className="collection-detail-container">
        {/* Banner: cover image shown as full-bleed banner (like NotebookDetail) */}
        {collection.cover_image ? (
          <div className="collection-banner">
            <button
              className="btn-back banner-back"
              onClick={() => navigate("/farmer/collections")}
            >
              ← Quay lại
            </button>

            <img
              src={collection.cover_image}
              alt={collection.collection_name}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="banner-overlay">
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
        ) : (
          /* If no banner, show back button and header info in normal flow */
          <>
            <button
              className="btn-back"
              onClick={() => navigate("/farmer/collections")}
            >
              ← Quay lại
            </button>
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
          </>
        )}

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

        {/* Move action buttons here - below the sort/search controls */}
        <div className="header-actions-outside">
          <button className="btn-edit" onClick={openEditModal}>
            ✏️ Chỉnh sửa
          </button>
          <button className="btn-add-notebook" onClick={openAddModal}>
            + Thêm nhật ký
          </button>
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
              <NotebookCard
                key={notebook._id}
                notebook={notebook}
                onView={(nb) => handleViewNotebook(nb._id)}
                onDelete={(id) =>
                  handleRemoveNotebook(id, notebook.notebook_name)
                }
              />
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
          <div
            className="modal-overlay"
            onClick={() => setShowEditModal(false)}
          >
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
                  <label>Ảnh bìa (tải từ máy)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {previewUrl ? (
                    <div className="image-preview">
                      <img src={previewUrl} alt="Preview" />
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleRemoveImage}
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : editForm.cover_image ? (
                    <div className="image-preview">
                      <img src={editForm.cover_image} alt="Current cover" />
                      <div className="preview-actions">
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={handleRemoveImage}
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    </div>
                  ) : null}
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
      <Footer />
    </>
  );
};

export default CollectionDetail;
