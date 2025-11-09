import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },

    // 🔧 Chỉ yêu cầu mật khẩu với tài khoản local
    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
    },

    provider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: null },
    role:     { type: String, enum: ["user", "expert", "moderator", "admin"], default: "user" },
    isVerified: { type: Boolean, default: false },
    isDeleted:  { type: Boolean, default: false },
  // mark a user as banned by admin (cannot create posts / login etc. checks elsewhere)
  isBanned: { type: Boolean, default: false },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true }
);


const User = mongoose.model("User", userSchema);
export default User;
