import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Normalize username/email to avoid case/whitespace mismatches on lookup
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // 🔧 Chỉ yêu cầu mật khẩu với tài khoản local
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    avatar: { type: String, default: "" },
    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },

    role: {
      type: String,
      enum: ["user", "expert", "moderator", "admin"],
      default: "user",
    },

    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },

    refreshTokens: { type: [String], default: [] },

    // 🟦 FIELD MỚI – GIỚI HẠN SỐ LẦN GỬI XÁC THỰC
    verifyEmailCount: { type: Number, default: 0 }, // số lần gửi mail
    lastVerifyEmailAt: { type: Date, default: null }, // lần gửi gần nhất

    // ✅ Lưu việc người dùng đã đồng ý điều khoản
    acceptedTerms: { type: Boolean, default: false },
    acceptedTermsAt: { type: Date, default: null },

    // 🟢 SUBSCRIPTION FIELDS
    subscriptionPlan: {
      type: String,
      enum: ["free", "smart", "vip", "pro"],
      default: "free",
    },
    subscriptionExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
