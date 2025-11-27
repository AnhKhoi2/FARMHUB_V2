import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const collectionsApi = {
  // Lấy tất cả collections
  getAllCollections: async (status = null) => {
    const token = localStorage.getItem("accessToken");
    const params = status ? { status } : {};

    return axios.get(`${API_BASE_URL}/api/collections`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  },

  // Lấy chi tiết collection
  getCollectionById: async (id) => {
    const token = localStorage.getItem("accessToken");

    return axios.get(`${API_BASE_URL}/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Tạo collection mới
  createCollection: async (data) => {
    const token = localStorage.getItem("accessToken");

    return axios.post(`${API_BASE_URL}/api/collections`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Upload a single image file and return the absolute URL
  uploadImage: async (file) => {
    const token = localStorage.getItem("accessToken");
    const formData = new FormData();
    formData.append("image", file);

    const resp = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // Let axios set Content-Type with proper boundary
      },
    });

    // API returns data in { success, data: { url: '/uploads/..' }}
    const returned = resp.data?.data;
    if (!returned || !returned.url) return null;

    // Build absolute URL so client can use it directly in <img src>
    const absolute = `${API_BASE_URL}${returned.url}`;
    return absolute;
  },

  // Cập nhật collection
  updateCollection: async (id, data) => {
    const token = localStorage.getItem("accessToken");

    return axios.put(`${API_BASE_URL}/api/collections/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Xóa collection
  deleteCollection: async (id) => {
    const token = localStorage.getItem("accessToken");

    return axios.delete(`${API_BASE_URL}/api/collections/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Thêm notebook vào collection
  addNotebookToCollection: async (collectionId, notebookId) => {
    const token = localStorage.getItem("accessToken");

    return axios.post(
      `${API_BASE_URL}/api/collections/${collectionId}/notebooks`,
      { notebook_id: notebookId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  // Xóa notebook khỏi collection
  removeNotebookFromCollection: async (collectionId, notebookId) => {
    const token = localStorage.getItem("accessToken");

    return axios.delete(
      `${API_BASE_URL}/api/collections/${collectionId}/notebooks`,
      {
        headers: { Authorization: `Bearer ${token}` },
        data: { notebook_id: notebookId },
      }
    );
  },

  // Thêm nhiều notebooks vào collection
  addMultipleNotebooks: async (collectionId, notebookIds) => {
    const token = localStorage.getItem("accessToken");

    return axios.post(
      `${API_BASE_URL}/api/collections/${collectionId}/notebooks/bulk`,
      { notebook_ids: notebookIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  // Lấy notebooks trong collection
  getNotebooksInCollection: async (
    collectionId,
    sortBy = null,
    order = "desc"
  ) => {
    const token = localStorage.getItem("accessToken");
    const params = sortBy ? { sort_by: sortBy, order } : {};

    return axios.get(
      `${API_BASE_URL}/api/collections/${collectionId}/notebooks`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params,
      }
    );
  },

  // Tìm kiếm collections
  searchCollections: async (keyword) => {
    const token = localStorage.getItem("accessToken");

    return axios.get(`${API_BASE_URL}/api/collections/search`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { keyword },
    });
  },
};

export default collectionsApi;
