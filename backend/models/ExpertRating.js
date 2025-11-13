// backend/models/ExpertRating.js
import mongoose from "mongoose";

const ExpertRatingSchema = new mongoose.Schema(
  {
    expert: { type: mongoose.Schema.Types.ObjectId, ref: "Expert", required: true },
    user:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    score:  { type: Number, required: true, min: 1, max: 5 },
    comment:{ type: String, default: "" },
  },
  { timestamps: true }
);

// Mỗi user chỉ được đánh giá 1 expert đúng 1 lần
ExpertRatingSchema.index({ expert: 1, user: 1 }, { unique: true });

const ExpertRating = mongoose.model("ExpertRating", ExpertRatingSchema);
export default ExpertRating;
