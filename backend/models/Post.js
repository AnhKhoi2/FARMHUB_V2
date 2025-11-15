import mongoose from 'mongoose';
const { Schema } = mongoose;

const MarketPostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true },

    description: { type: String },

    phone: { type: String },

    // Có thể để Object hoặc String đều được
    location: { type: Schema.Types.Mixed, default: "" },

    images: { type: [String], default: [] },

    // 🔹 THÊM FIELD PRICE
    price: {
      type: String,
      default: "",
      set(v) {
        if (!v) return "";
        // xoá các biến thể vnđ / vnd để tránh trùng lặp
        const clean = String(v).replace(/vnd|vnđ|đ|đồng|VNĐ|VND/gi, "").trim();
        if (!clean) return "";
        return `${clean} VNĐ`;
      }
    },
    

    // 🔹 Danh mục
    category: {
      type: String,
      enum: ['Nông sản', 'Hạt giống', 'Phân bón', 'Thiết bị', 'Dịch vụ', 'Khác'],
      default: 'Khác',
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    isDeleted: { type: Boolean, default: false },

    // 🔹 Danh sách báo cáo
    reports: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        message: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('MarketPost', MarketPostSchema);
