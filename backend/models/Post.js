import mongoose from 'mongoose';
const { Schema } = mongoose;

const MarketPostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    phone: { type: String },
    location: { type: Object },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isDeleted: { type: Boolean, default: false },
    // reports: array of { userId, reason, message, createdAt }
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

export default mongoose.model("MarketPost", MarketPostSchema);
