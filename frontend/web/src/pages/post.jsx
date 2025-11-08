import React, { useEffect, useState } from "react";
import "../css/post.css";
import axiosClient from "../api/shared/axiosClient";
import { Leaf, Upload, X, Search } from "../assets/icons"; // keep existing icons import if present

const categories = ["Nông sản", "Hạt giống", "Phân bón", "Thiết bị", "Dịch vụ", "Khác"];

export default function Post() {
  // Listings + fetch
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form / image management
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: categories[0],
    description: "",
    price: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/managerpost/public?limit=50');
      const data = res.data?.data?.items || res.data?.data || res.data || [];
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchListings(); }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file));
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const isFormValid = formData.title && formData.price && formData.location && formData.contactName;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Try to post to backend; backend currently expects image URLs.
    // Since we don't have an upload endpoint here, fallback to client-side mock like market.jsx
    try {
      // Attempt to post — will work if you have server-side upload handling that accepts images as URLs
      await axiosClient.post('/admin/managerpost', {
        ...formData,
        images: uploadedImages,
      });
      // Refetch listings if server responded OK
      await fetchListings();
      alert('Bài đăng đã được gửi.');
    } catch (err) {
      // Fallback: local mock (same behavior as market.jsx)
      console.warn('Posting to server failed, using local mock:', err?.message || err);
      const newListing = {
        _id: String(listings.length + 1),
        title: formData.title,
        category: formData.category,
        price: formData.price,
        location: formData.location,
        images: uploadedImages,
        userId: { username: formData.contactName },
        createdAt: new Date().toISOString(),
      };
      setListings((prev) => [newListing, ...prev]);
      alert('Bài đăng (local) đã được tạo.');
    } finally {
      setSubmitting(false);
      setFormData({ title: "", category: categories[0], description: "", price: "", location: "", contactName: "", contactPhone: "", contactEmail: "" });
      setUploadedImages([]);
      setShowForm(false);
    }
  };

  return (
    <main className="market-main">
      <header className="market-header">
        <div className="market-header-content">
          <div className="market-logo">
            <Leaf className="market-icon" />
            <h1>Bài viết</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="market-btn-primary">
            {showForm ? 'Ẩn form' : 'Đăng bài'}
          </button>
        </div>
      </header>

      <div className="market-container">
        {showForm && (
          <div className="market-form-section">
            <h2>Đăng bài</h2>
            <p className="market-form-desc">Chia sẻ sản phẩm hoặc dịch vụ nông nghiệp của bạn</p>

            <form onSubmit={handleSubmit} className="market-form">
              <section className="market-form-section-part">
                <h3>
                  <span className="market-step">1</span> Thông tin cơ bản
                </h3>
                <div className="market-form-group">
                  <label>
                    Tiêu đề <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="vd: Lúa mì giống F1 chất lượng cao"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={100}
                    required
                  />
                  <p className="char-count">{formData.title.length}/100</p>
                </div>
                <div className="market-form-row">
                  <div>
                    <label>Danh mục</label>
                    <select name="category" value={formData.category} onChange={handleInputChange}>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>
                      Giá <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="price"
                      placeholder="vd: 150.000 VNĐ"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <div className="market-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    placeholder="Mô tả tính năng, chất lượng..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="char-count">{formData.description.length}/2000</p>
                </div>
                <div className="market-form-group">
                  <label>
                    Địa điểm <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    placeholder="vd: Hà Nội"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </section>

              <section className="market-form-section-part">
                <h3>
                  <span className="market-step">2</span> Hình ảnh
                </h3>
                {uploadedImages.length < 5 && (
                  <div className="market-upload-box">
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} id="image-upload" />
                    <label htmlFor="image-upload">
                      <Upload className="market-icon-upload" />
                      <p>Kéo ảnh vào hoặc bấm để chọn</p>
                      <p className="small">PNG, JPG tối đa 5MB</p>
                    </label>
                  </div>
                )}
                {uploadedImages.length > 0 && (
                  <div className="market-images-grid">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="market-image-item">
                        <img src={image || "/placeholder.svg"} alt={`Preview ${index + 1}`} />
                        <button type="button" onClick={() => removeImage(index)} className="market-remove-img">
                          <X className="market-icon-small" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="market-form-section-part">
                <h3>
                  <span className="market-step">3</span> Thông tin liên hệ
                </h3>
                <div className="market-form-group">
                  <label>
                    Tên liên hệ <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactName"
                    placeholder="Nhập tên của bạn"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="market-form-row">
                  <div>
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      placeholder="0987654321"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label>Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      placeholder="email@example.com"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </section>

              <div className="market-form-footer">
                <div className="market-terms">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">Tôi xác nhận bài đăng tuân thủ chính sách bài viết</label>
                </div>
                <div className="market-form-buttons">
                  <button type="reset" className="market-btn-secondary">
                    Hủy
                  </button>
                  <button type="submit" disabled={!isFormValid || submitting} className="market-btn-primary">
                    {submitting ? "Đang gửi..." : "Đăng bài"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="market-listings">
          <h2>Bài rao vặt</h2>
          <div className="market-grid">
            {loading ? <div>Đang tải...</div> : listings.map((listing) => (
              <div key={listing._id || listing.id} className="market-card">
                <div className="market-card-image">
                  <img src={listing.images?.[0] || listing.image || "/placeholder.svg"} alt={listing.title} />
                </div>
                <div className="market-card-content">
                  <h3>{listing.title}</h3>
                  <p className="market-card-price">{listing.price}</p>
                  <p className="market-card-location">{listing.location?.address || listing.location}</p>
                  <div className="market-card-footer">
                    <small>{new Date(listing.createdAt).toLocaleString()}</small>
                    <button className="market-btn-primary">Chi tiết</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
