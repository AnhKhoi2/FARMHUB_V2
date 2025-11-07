"use client"

import { useState } from "react"
import { Upload, X, Leaf, Search } from "lucide-react"
import "../css/market.css";


const categories = ["Nông sản", "Hạt giống", "Phân bón", "Thiết bị", "Dịch vụ", "Khác"]

const sampleListings = [
  {
    id: "1",
    title: "Lúa mì giống F1 chất lượng cao",
    category: "Hạt giống",
    price: "150.000 VNĐ/kg",
    location: "Hà Nội",
    image: "https://via.placeholder.com/300x200?text=Wheat",
    seller: "Trang Trại Hạt Giống",
    createdAt: "2 ngày trước",
    views: 245,
  },
  {
    id: "2",
    title: "Phân bón hữu cơ 100% tự nhiên",
    category: "Phân bón",
    price: "250.000 VNĐ/bao",
    location: "TP. Hồ Chí Minh",
    image: "https://via.placeholder.com/300x200?text=Fertilizer",
    seller: "Nông Sản Sạch",
    createdAt: "1 tuần trước",
    views: 512,
  },
  {
    id: "3",
    title: "Máy cắt cỏ chạy điện 5000W",
    category: "Thiết bị",
    price: "2.500.000 VNĐ",
    location: "Đà Nẵng",
    image: "https://via.placeholder.com/300x200?text=Machinery",
    seller: "Công Ty Thiết Bị Nông Nghiệp",
    createdAt: "3 ngày trước",
    views: 189,
  },
  {
    id: "4",
    title: "Dịch vụ tư vấn quy hoạch nông trại",
    category: "Dịch vụ",
    price: "Liên hệ",
    location: "Cần Thơ",
    image: "https://via.placeholder.com/300x200?text=Consultation",
    seller: "Chuyên Gia Nông Nghiệp",
    createdAt: "5 ngày trước",
    views: 156,
  },
  {
    id: "5",
    title: "Cà chua Đà Lạt tươi mỗi ngày",
    category: "Nông sản",
    price: "35.000 VNĐ/kg",
    location: "Lâm Đồng",
    image: "https://via.placeholder.com/300x200?text=Tomato",
    seller: "Vườn Rau Đà Lạt",
    createdAt: "1 ngày trước",
    views: 678,
  },
  {
    id: "6",
    title: "Hệ thống tưới nước tự động",
    category: "Thiết bị",
    price: "5.000.000 VNĐ",
    location: "Bình Dương",
    image: "https://via.placeholder.com/300x200?text=Irrigation",
    seller: "Công Nghệ Nông Nghiệp",
    createdAt: "4 ngày trước",
    views: 421,
  },
]

export default function Market() {
  const [showForm, setShowForm] = useState(false)
  const [listings, setListings] = useState(sampleListings)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [formData, setFormData] = useState({
    title: "",
    category: "Nông sản",
    description: "",
    price: "",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    images: [],
  })
  const [uploadedImages, setUploadedImages] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const newListing = {
      id: String(listings.length + 1),
      title: formData.title,
      category: formData.category,
      price: formData.price,
      location: formData.location,
      image: uploadedImages[0] || "https://via.placeholder.com/300x200?text=Product",
      seller: formData.contactName,
      createdAt: "vừa đăng",
      views: 0,
    }

    setListings((prev) => [newListing, ...prev])
    alert("Bài đăng đã được gửi thành công!")
    setSubmitting(false)
    setFormData({
      title: "",
      category: "Nông sản",
      description: "",
      price: "",
      location: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      images: [],
    })
    setUploadedImages([])
    setShowForm(false)
  }

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.seller.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || listing.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e) => {
    const files = e.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => URL.createObjectURL(file))
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 5))
    }
  }

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const isFormValid = formData.title && formData.price && formData.location && formData.contactName

  return (
    <main className="market-main">
      <header className="market-header">
        <div className="market-header-content">
          <div className="market-logo">
            <Leaf className="market-icon" />
            <h1>Chợ</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="market-btn-primary">
            {showForm ? "Ẩn form" : "Đăng bài"}
          </button>
        </div>
      </header>

      <div className="market-container">
        {showForm && (
          <div className="market-form-section">
            <h2>Đăng bài rao vặt</h2>
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
                  <label htmlFor="terms">Tôi xác nhận bài đăng tuân thủ chính sách Chợ</label>
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
          <div className="market-search-filter">
            <div className="market-search">
              <Search className="market-icon-small" />
              <input
                type="text"
                placeholder="Tìm kiếm bài đăng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="market-category-pills">
            <button onClick={() => setSelectedCategory(null)} className={selectedCategory === null ? "active" : ""}>
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "active" : ""}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredListings.length > 0 ? (
            <div className="market-grid">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="market-card">
                  <div className="market-card-image">
                    <img src={listing.image || "/placeholder.svg"} alt={listing.title} />
                    <div className="market-card-category">{listing.category}</div>
                  </div>
                  <div className="market-card-content">
                    <h3>{listing.title}</h3>
                    <p className="market-card-price">{listing.price}</p>
                    <p className="market-card-location">{listing.location}</p>
                    <p className="market-card-date">{listing.createdAt}</p>
                    <div className="market-card-footer">
                      <span>{listing.seller}</span>
                      <span>{listing.views} lượt xem</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="market-empty">
              <p>Không tìm thấy bài đăng nào</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
