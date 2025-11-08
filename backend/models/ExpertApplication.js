// backend/models/ExpertApplication.js
import mongoose from "mongoose";

const CertificateSchema = new mongoose.Schema(
  { url: { type: String, required: true, trim: true } },
  { _id: false }
);

const ExpertApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone_number: { type: String, trim: true },
    expertise_area: { type: String, required: true, trim: true },
    experience_years: { type: Number, default: 0, min: 0 },
    description: { type: String, default: "" },
    certificates: [String], // <-- mảng chuỗi, không cần bọc object
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    review_notes: { type: String, default: "" },
    reviewed_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewed_at: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("ExpertApplication", ExpertApplicationSchema);
