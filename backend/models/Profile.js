// models/profile.js (chỉ là ví dụ, gộp vào schema hiện có của bạn)
import mongoose from "mongoose";

const PHONE_REGEX_VN = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

const ProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  fullName: { type: String, trim: true, maxlength: 100 },
  avatar: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || /^https?:\/\//i.test(v),
      message: "Avatar URL không hợp lệ",
    },
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: (v) => !v || PHONE_REGEX_VN.test(v),
      message: "Số điện thoại không hợp lệ",
    },
  },
  dob: { type: Date }, // có thể thêm min/max nếu muốn
  gender: { type: String, enum: ["male", "female", "other"], default: "other" },
  address: { type: String, trim: true, maxlength: 255 },
  bio: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

export default mongoose.model("Profile", ProfileSchema);
