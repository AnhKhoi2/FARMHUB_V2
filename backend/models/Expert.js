// ===============================
//  FARMHUB - Expert Model (chuẩn cho ESM)
// ===============================
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

// Subdocument cho chứng chỉ
const CertificateSchema = new mongoose.Schema(
  { url: { type: String, required: true, trim: true } },
  { _id: false }
);

const ExpertSchema = new mongoose.Schema(
  {
    expert_id: { type: String, default: uuidv4, unique: true },

    // Liên kết sang Users (nơi quản lý email/password/role)
// backend/models/Expert.js
user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },


    // Hồ sơ
    full_name: { type: String, required: true, trim: true },
    phone_number: {
      type: String,
      trim: true,
      match: [/^(0|\+84)[0-9]{9}$/, "Số điện thoại không hợp lệ"],
      unique: true,
      sparse: true
    },
    expertise_area: { type: String, required: true, trim: true },
    experience_years: { type: Number, default: 0, min: 0 },
    certificates: { type: [CertificateSchema], default: [] },
    description: { type: String, default: "" },

    // Đánh giá
    avg_score: { type: Number, default: 0, min: 0, max: 5 },
    total_reviews: { type: Number, default: 0 },

    // Moderation/Duyệt
    review_status: {
      type: String,
      enum: ["pending", "approved", "rejected", "banned", "inactive"],
      default: "pending"
    },
    review_notes: { type: String, default: "" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewed_at: { type: Date, default: null },

    // Hiển thị/Xoá mềm
    is_public: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

ExpertSchema.index({ full_name: "text", expertise_area: "text", description: "text" });

// ✅ Export mặc định
const Expert = mongoose.model("Expert", ExpertSchema);
export default Expert;

