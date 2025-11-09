import React, { useState, useEffect } from "react";
import collectionsApi from "../../api/farmer/collectionsApi";
import "../../css/farmer/AddToCollection.css";

const AddToCollectionButton = ({ notebookId, notebookName }) => {
  const [showModal, setShowModal] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  useEffect(() => {
    if (showModal) {
      fetchCollections();
    }
  }, [showModal]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionsApi.getAllCollections();
      setCollections(response.data.data || []);
    } catch (err) {
      console.error("Error fetching collections:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCollection = async (collectionId) => {
    try {
      await collectionsApi.addNotebookToCollection(collectionId, notebookId);
      alert(`Đã thêm "${notebookName}" vào bộ sưu tập!`);
      setShowModal(false);
    } catch (err) {
      console.error("Error adding to collection:", err);
      if (err.response?.data?.message) {
        alert(err.response.data.message);
      } else {
        alert("Không thể thêm vào bộ sưu tập");
      }
    }
  };

  const handleCreateAndAdd = async (e) => {
    e.preventDefault();

    if (!newCollectionName.trim()) {
      alert("Vui lòng nhập tên bộ sưu tập");
      return;
    }

    try {
      setCreating(true);

      // Tạo collection mới
      const createResponse = await collectionsApi.createCollection({
        collection_name: newCollectionName,
        description: "",
      });

      const newCollection = createResponse.data.data;

      // Thêm notebook vào collection vừa tạo
      await collectionsApi.addNotebookToCollection(
        newCollection._id,
        notebookId
      );

      alert(`Đã tạo bộ sưu tập "${newCollectionName}" và thêm nhật ký!`);
      setShowModal(false);
      setNewCollectionName("");
    } catch (err) {
      console.error("Error creating collection:", err);
      alert("Không thể tạo bộ sưu tập");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <button
        className="btn-add-to-collection"
        onClick={() => setShowModal(true)}
        title="Thêm vào bộ sưu tập"
      >
        📚 Thêm vào bộ sưu tập
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content add-to-collection-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Thêm vào bộ sưu tập</h2>
            <p className="notebook-name">📓 {notebookName}</p>

            {loading ? (
              <div className="loading-text">Đang tải...</div>
            ) : (
              <>
                {collections.length > 0 && (
                  <div className="collections-list">
                    <h3>Chọn bộ sưu tập có sẵn:</h3>
                    {collections.map((collection) => (
                      <div
                        key={collection._id}
                        className="collection-item"
                        onClick={() => handleAddToCollection(collection._id)}
                      >
                        <div className="collection-item-info">
                          <h4>{collection.collection_name}</h4>
                          <span className="notebook-count">
                            📓 {collection.notebook_count} nhật ký
                          </span>
                        </div>
                        <button className="btn-add-arrow">→</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="divider">
                  <span>hoặc</span>
                </div>

                <form
                  onSubmit={handleCreateAndAdd}
                  className="create-collection-form"
                >
                  <h3>Tạo bộ sưu tập mới:</h3>
                  <input
                    type="text"
                    placeholder="Tên bộ sưu tập mới..."
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    className="btn-create-new"
                    disabled={creating}
                  >
                    {creating ? "Đang tạo..." : "+ Tạo và thêm vào"}
                  </button>
                </form>
              </>
            )}

            <button
              className="btn-close-modal"
              onClick={() => setShowModal(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AddToCollectionButton;
