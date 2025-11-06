import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, //tránh trùng lặp
      
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // ✅ Thay thế 'admin: boolean' bằng 'role: string'
    role: { 
      type: String, 
      enum: ["user", "expert", "moderator", "admin"], 
      default: "user" 
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: undefined,
      index: true,
    },
    // Password reset token and expiry for reset flow
    resetPasswordToken: {
      type: String,
      default: undefined,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
      index: true,
    },
    refreshTokens: {
    type: [String],
    default: [],
   },
    // Subscription plan fields
    subscriptionPlan: {
      type: String,
      enum: ["free", "vip", "pro"],
      default: "free",
      index: true,
    },
    subscriptionExpires: {
      type: Date,
      default: undefined,
      index: true,
    },
    // Track daily weather usage (reset each day)
    weatherUsage: {
      date: { type: Date, default: undefined },
      count: { type: Number, default: 0 },
    },
  },
  { timestamps: true } //create. update khi nào
);

// Indexes to support search/filter
userSchema.index({ username: "text", email: "text" });
userSchema.index({ role: 1, isDeleted: 1 });

const User = mongoose.model("User", userSchema)
export default User;