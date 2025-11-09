import mongoose from "mongoose";

// Danh mục (không dấu) đồng bộ với FE mapping UI2BE
export const MARKET_CATEGORIES = [
  "Nong san",
  "Hat giong",
  "Phan bon",
  "Thiet bi",
  "Dich vu",
  "Khac",
];

// Trạng thái vòng đời bài đăng + duyệt
// - pending: chờ admin duyệt (mặc định khi user tạo)
// - approved: hiển thị public
// - rejected: admin từ chối (giữ để chủ bài/sv nội bộ xem nhưng không public)
// - hidden: người đăng ẩn tạm (không public)
// - sold: đã bán (tùy bạn có vẫn hiển thị hay không, controller hiện đang filter approved ở list public)
// - deleted: xóa mềm
const STATUS_ENUM = ["pending", "approved", "rejected", "hidden", "sold", "deleted"];

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true }, // "/uploads/market/xxx.jpg"
    alt: { type: String, default: "" },
  },
  { _id: false }
);

const MarketListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: MARKET_CATEGORIES, required: true },
    description: { type: String, default: "", maxlength: 4000 },

    // Giá: lưu cả dạng text FE nhập và số đã chuẩn hóa (để lọc khoảng giá)
    priceText: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },

    location: { type: String, default: "" },

    images: { type: [ImageSchema], default: [] },

    contactName: { type: String, required: true, trim: true, maxlength: 100 },
    contactPhone: { type: String, default: "", trim: true, maxlength: 30 },
    contactEmail: { type: String, default: "", trim: true, maxlength: 120 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Duyệt bài
    status: { type: String, enum: STATUS_ENUM, default: "pending", index: true },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: null },
    approvedAt: { type: Date, default: null },

    // Khác
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

/** ===========================
 *  Static helpers
 *  =========================== */
MarketListingSchema.statics.normalizeVnd = function normalizeVnd(input) {
  // Nhận "150.000 VND", "2,500,000", "5tr", "500k", "Liên hệ"...
  if (!input || typeof input !== "string") return 0;
  const s = input.trim().toLowerCase();

  // các case đặc biệt coi như 0 (Liên hệ)
  if (!s || /^(lien he|liên hệ|contact|call)/i.test(s)) return 0;

  // thay . và , (phân tách nghìn) → remove; đổi đơn vị "k", "tr" → nhân
  let num = s
    .replace(/[^\d.,ktr]/g, "") // giữ số và k/tr/.,,
    .replace(/,/g, "") // bỏ dấu ,
    .replace(/\./g, ""); // bỏ dấu .

  // Đơn vị
  if (num.endsWith("tr")) {
    const base = Number(num.replace("tr", "")) || 0;
    return Math.round(base * 1_000_000);
  }
  if (num.endsWith("k")) {
    const base = Number(num.replace("k", "")) || 0;
    return Math.round(base * 1_000);
  }

  const asNumber = Number(num.replace(/[^\d]/g, "")) || 0;
  return asNumber;
};

/** ===========================
 *  Indexes
 *  =========================== */
// Tối ưu list/search/filter
MarketListingSchema.index({ createdAt: -1 });
MarketListingSchema.index({ status: 1, category: 1, createdAt: -1 });
MarketListingSchema.index({ price: 1 });
MarketListingSchema.index({ createdBy: 1, status: 1 });

// Text index cho tìm kiếm tự do (q)
try {
  MarketListingSchema.index(
    { title: "text", description: "text", location: "text" },
    { name: "market_text_idx", default_language: "vi" }
  );
} catch {
  // bỏ qua nếu đã có
}

const MarketListing = mongoose.model("MarketListing", MarketListingSchema);
export default MarketListing;
