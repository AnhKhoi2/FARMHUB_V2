"use client";

import { useEffect, useMemo, useState } from "react";
import axiosClient from "../api/shared/axiosClient";
import { Leaf, Upload, X, Search } from "lucide-react";
import "../css/post.css";

// ==== Mapping UI <-> Admin Post ====
const UI_CATEGORIES = ["Nông sản", "Hạt giống", "Phân bón", "Thiết bị", "Dịch vụ", "Khác"];

function mapAdminPost(dto) {
  // Admin post schema:
  // { _id, title, description, phone, location(Object|String), images:[String], status, userId:{username}, createdAt }
  const img = dto?.images?.[0] || "/placeholder.svg";

  return {
    id: dto?._id,
    title: dto?.title || "",
    category: dto?.category || "Khác",
    price: dto?.price || dto?.priceText || "",
    phone: dto?.phone || "",
    location:
      typeof dto?.location === "string"
        ? dto.location
        : (dto?.location?.address ||
          dto?.location?.city ||
          dto?.location?.province ||
          ""),
    image: img,
    seller: dto?.userId?.username || "Người bán",
    createdAt: dto?.createdAt
      ? new Date(dto.createdAt).toLocaleString("vi-VN")
      : new Date().toLocaleString("vi-VN"),
    views: 0,
    status: dto?.status || "pending",
    _raw: dto,
  };
}

export default function Post() {
  // ===== List & filters =====
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null); // Chỉ dùng cho UI filter phía client

  // ===== Form =====
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Nông sản",
    description: "",
    price: "",
    location: "",
    contactName: "", // Không dùng trên Admin Post, để nguyên UI
    contactPhone: "",
    contactEmail: "",
  });
  const [imageFiles, setImageFiles] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // blob urls
  const [submitting, setSubmitting] = useState(false);

  // ===== Detail modal =====
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  // ===== Helpers =====
  const fileToBase64 = (f) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

  // ===== Fetch Admin public list (then filter approved) =====
  async function fetchListings() {
    setLoading(true);
    try {
      // Admin public endpoint
      const res = await axiosClient.get("/admin/managerpost/public", {
        params: { q: searchQuery || undefined, limit: 50 },
      });

      const raw = res?.data?.data?.items || res?.data?.data || res?.data || [];
      // Chỉ hiển thị bài đã duyệt
      const approved = raw.filter((x) => x?.status === "approved");
      const items = approved.map(mapAdminPost);

      // (Tùy chọn) filter category ở client theo UI chip
      const filteredByCat =
        selectedCategory && selectedCategory !== "Tất cả"
          ? items.filter((it) => it.category === selectedCategory)
          : items;

      setListings(filteredByCat);
    } catch (err) {
      console.error(err);
      alert("Không tải được danh sách bài đăng.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // ===== Open detail (dùng sẵn object, không gọi admin detail vì cần quyền admin) =====
  function openDetailFromCard(card) {
    setDetailItem(card);
    setDetailOpen(true);
  }

  // ===== Form handlers =====
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const next = [...imageFiles, ...files].slice(0, 5);
    setImageFiles(next);
    setImagePreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const isFormValid = !!formData.title;

  // ===== Submit to Admin Post (pending) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitting(true);
    try {
      // convert images -> base64 (Admin schema images: [String])
      const imagesBase64 = await Promise.all(imageFiles.map(fileToBase64));

      // Admin Post.create expects:
      // { title, description, phone, location(Object|String), images:[String] }
      // + req.user from verifyToken => userId
      const payload = {
        title: formData.title,
        description: formData.description || "",
        phone: formData.contactPhone || "",
        location: formData.location || "",
        images: imagesBase64,
        category: formData.category,
        price: formData.price || "",
      };


      await axiosClient.post("/admin/managerpost", payload);

      alert("Bài đã gửi và đang chờ duyệt bởi Admin.");
      // Reset form
      setFormData({
        title: "",
        category: "Nông sản",
        description: "",
        price: "",
        location: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
      });
      setImageFiles([]);
      setImagePreviews([]);
      setShowForm(false);

      // reload list (vẫn chỉ thấy approved, nên bài mới sẽ chưa hiện)
      fetchListings();
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) alert("Bạn cần đăng nhập để đăng bài.");
      else alert(err?.response?.data?.message || "Gửi bài thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== Client-side quick filter by text =====
  const filteredListings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.seller.toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  return (
    <main className="market-main">
      <header className="market-header">
        <div className="market-header-content">
          <div className="market-logo">
            <Leaf className="market-icon" />
            <h1>Chợ</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="market-btn-primary"
          >
            {showForm ? "Ẩn form" : "Đăng bài"}
          </button>
        </div>
      </header>

      <div className="market-container">
        {/* ===== Form ===== */}
        {showForm && (
          <div className="market-form-section">
            <h2>Đăng bài</h2>
            <p className="market-form-desc">
              Bài gửi sẽ vào trạng thái “chờ duyệt”.
            </p>

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
                    placeholder="vd: Bán khay trồng rau"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={120}
                    required
                  />
                  <p className="char-count">
                    {formData.title.length}/120
                  </p>
                </div>

                <div className="market-form-row">
                  <div>
                    <label>Danh mục</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      {UI_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Giá</label>
                    <input
                      type="text"
                      name="price"
                      placeholder="vd: 150.000 VNĐ (tuỳ chọn)"
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="market-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    name="description"
                    placeholder="Mô tả tình trạng, quy cách, ghi chú..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    maxLength={2000}
                  />
                  <p className="char-count">
                    {formData.description.length}/2000
                  </p>
                </div>

                <div className="market-form-group">
                  <label>Địa điểm</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="vd: Hà Nội, Cầu Giấy"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>
              </section>

              <section className="market-form-section-part">
                <h3>
                  <span className="market-step">2</span> Hình ảnh
                </h3>
                {imagePreviews.length < 5 && (
                  <div className="market-upload-box">
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <label htmlFor="image-upload">
                      <Upload className="market-icon-upload" />
                      <p>
                        Kéo ảnh vào hoặc bấm để chọn (tối đa 5 ảnh)
                      </p>
                    </label>
                  </div>
                )}
                {imagePreviews.length > 0 && (
                  <div className="market-images-grid">
                    {imagePreviews.map((img, i) => (
                      <div key={i} className="market-image-item">
                        <img
                          src={img || "/placeholder.svg"}
                          alt={`Preview ${i + 1}`}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="market-remove-img"
                        >
                          <X className="market-icon-small" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="market-form-section-part">
                <h3>
                  <span className="market-step">3</span> Liên hệ
                </h3>
                <div className="market-form-group">
                  <label>Tên liên hệ</label>
                  <input
                    type="text"
                    name="contactName"
                    placeholder="Tên của bạn (tuỳ chọn)"
                    value={formData.contactName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="market-form-row">
                  <div>
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="contactPhone"
                      placeholder="0987xxxxxx"
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
                  <label htmlFor="terms">
                    Tôi xác nhận bài đăng tuân thủ chính sách bài viết
                  </label>
                </div>
                <div className="market-form-buttons">
                  <button
                    type="button"
                    className="market-btn-secondary"
                    onClick={() => setShowForm(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={!isFormValid || submitting}
                    className="market-btn-primary"
                  >
                    {submitting ? "Đang gửi..." : "Đăng bài"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ===== List ===== */}
        <div className="market-listings">
          <h2>Bài rao vặt</h2>

          <div className="market-search-filter">
            <div className="market-search">
              <Search className="market-icon-small" />
              <input
                type="text"
                placeholder="Tìm kiếm bài đăng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchListings();
                }}
              />
              <button
                className="market-btn-primary"
                style={{ marginLeft: 8 }}
                onClick={fetchListings}
              >
                Tìm
              </button>
            </div>
          </div>

          <div className="market-category-pills">
            <button
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "active" : ""}
            >
              Tất cả
            </button>
            {UI_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "active" : ""}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="market-empty">
              <p>Đang tải...</p>
            </div>
          ) : (
            <div className="market-grid">
              {filteredListings.length > 0 ? (
                filteredListings.map((listing) => (
<div key={listing.id} className="market-card">
  <div className="market-card-image">
    <img src={listing.image || "/placeholder.svg"} alt={listing.title} />
    <div className="market-card-category">{listing.category}</div>
  </div>

  <div className="market-card-content">
    {/* Tiêu đề */}
    <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>
      {listing.title}
    </h3>

    {/* Giá */}
    <p style={{ fontWeight: "700", color: "#059669", marginBottom: "6px" }}>
  {listing.price ? `${listing.price.replace(/VNĐ|VND/gi, "").trim()} VNĐ` : "Giá liên hệ"}
</p>

    {/* SĐT (nếu có) */}
    {listing.phone && (
      <p style={{ marginBottom: "6px" }}>
        <strong>SĐT:</strong> {listing.phone}
      </p>
    )}

    {/* Địa chỉ */}
    <p style={{ marginBottom: "4px" }}>
      {listing.location || "Không rõ địa chỉ"}
    </p>

    {/* Ngày đăng */}
    <p style={{ marginBottom: "6px", fontSize: "13px", color: "#6b7280" }}>
      {listing.createdAt}
    </p>

    {/* Người đăng + lượt xem */}
    <div
      style={{
        fontSize: "13px",
        display: "flex",
        justifyContent: "space-between",
        color: "#374151",
      }}
    >
      <span>{listing.seller}</span>
      <span>{listing.views} lượt xem</span>
    </div>
  </div>
                    <div className="mt-2 d-flex justify-content-between">
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => openDetailFromCard(listing)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="market-empty">
                  <p>Không tìm thấy bài đăng nào</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== Detail Modal (dùng data sẵn có) ===== */}
      {detailOpen && detailItem && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 2100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setDetailOpen(false)}
        >
          <div
            style={{
              width: 680,
              maxWidth: "94vw",
              background: "#fff",
              borderRadius: 8,
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
              <h5 className="mb-0">{detailItem.title}</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDetailOpen(false)}
              >
                Đóng
              </button>
            </div>

            <div className="p-3">
              <div
                style={{
                  width: "100%",
                  height: 320,
                  overflow: "hidden",
                  borderRadius: 6,
                }}
              >
                <img
                  src={detailItem.image}
                  alt={detailItem.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <div className="mt-3">
                <div className="d-flex gap-3 flex-wrap">
                  <div>
                    <strong>Danh mục:</strong> {detailItem.category}
                  </div>
                  <div>
                    <strong>Giá:</strong>{" "}
                    {detailItem.price || "Giá liên hệ"}
                  </div>
                  <div>
                    <strong>Số điện thoại:</strong>{" "}
                    {detailItem.phone || "Không có"}
                  </div>
                  <div>
                    <strong>Địa điểm:</strong> {detailItem.location}
                  </div>
                  <div>
                    <strong>Ngày:</strong> {detailItem.createdAt}
                  </div>
                  <div>
                    <strong>Liên hệ:</strong> {detailItem.seller}
                  </div>
                </div>

                {detailItem?._raw?.description && (
                  <div className="mt-2">
                    <strong>Mô tả:</strong>
                    <div style={{ whiteSpace: "pre-wrap" }}>
                      {detailItem._raw.description}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
