import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import collectionsApi from "../../api/farmer/collectionsApi";
import CreateCollectionModal from "../../components/farmer/CreateCollectionModal";
import "../../css/farmer/Collections.css";
import Header from "../../components/shared/Header";

const Collections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await collectionsApi.getAllCollections();
      console.log("Collections response:", response.data);
      setCollections(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching collections:", err);
      console.error("Error response:", err.response);

      // More detailed error messages
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.response?.status === 403) {
        setError("Bạn không có quyền truy cập tài nguyên này.");
      } else if (err.code === "ERR_NETWORK") {
        setError(
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng."
        );
      } else {
        setError(
          err.response?.data?.message || "Không thể tải danh sách bộ sưu tập"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchCollections();
      return;
    }

    try {
      setLoading(true);
      const response = await collectionsApi.searchCollections(searchKeyword);
      console.log("Search response:", response.data);
      setCollections(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error searching collections:", err);

      if (err.response?.status === 401) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else if (err.code === "ERR_NETWORK") {
        setError("Không thể kết nối đến máy chủ.");
      } else {
        setError(err.response?.data?.message || "Không thể tìm kiếm");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (formData) => {
    try {
      await collectionsApi.createCollection(formData);
      setShowCreateModal(false);
      fetchCollections();
    } catch (err) {
      console.error("Error creating collection:", err);
      alert("Không thể tạo bộ sưu tập");
    }
  };

  const handleDeleteCollection = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bộ sưu tập "${name}"?`)) {
      return;
    }

    try {
      await collectionsApi.deleteCollection(id);
      fetchCollections();
    } catch (err) {
      console.error("Error deleting collection:", err);
      alert("Không thể xóa bộ sưu tập");
    }
  };

  const handleViewCollection = (id) => {
    navigate(`/farmer/collections/${id}`);
  };

  if (loading && collections.length === 0) {
    return (
      <div className="collections-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="collections-container">
        {/* Header */}
        <div className="collections-header">
          <h1>📚 Bộ sưu tập của tôi</h1>
          <button
            className="btn-create-collection"
            onClick={() => setShowCreateModal(true)}
          >
            + Tạo bộ sưu tập mới
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm bộ sưu tập..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>🔍 Tìm kiếm</button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Collections Grid */}
        <div className="collections-grid">
          {collections.length === 0 ? (
            <div className="empty-state">
              <p>📭 Chưa có bộ sưu tập nào</p>
              <p>Tạo bộ sưu tập đầu tiên để tổ chức các nhật ký của bạn!</p>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection._id}
                className="collection-card"
                onClick={() => handleViewCollection(collection._id)}
              >
                <div className="collection-cover">
                  {collection.cover_image ? (
                    <img
                      src={collection.cover_image}
                      alt={collection.collection_name}
                    />
                  ) : (
                    <div className="cover-placeholder">📚</div>
                  )}
                </div>

                <div className="collection-info">
                  <h3>{collection.collection_name}</h3>
                  {collection.description && (
                    <p className="collection-description">
                      {collection.description}
                    </p>
                  )}

                  <div className="collection-meta">
                    <span className="notebook-count">
                      📓 {collection.notebook_count} nhật ký
                    </span>
                    <span className="created-date">
                      {new Date(collection.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>

                  {collection.tags && collection.tags.length > 0 && (
                    <div className="collection-tags">
                      {collection.tags.map((tag, index) => (
                        <span key={index} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="collection-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="btn-delete"
                    onClick={() =>
                      handleDeleteCollection(
                        collection._id,
                        collection.collection_name
                      )
                    }
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Collection Modal */}
        <CreateCollectionModal
          show={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateCollection}
        />
      </div>{" "}
    </>
  );
};

export default Collections;
